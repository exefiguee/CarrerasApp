import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Inicializar Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ========================================
// 🔥 INTERFACES Y TIPOS
// ========================================

interface CreateBetData {
  // Básicos
  raceId: string;
  amount: number;
  betType: string;
  
  // Caballos
  seleccionados: Array<{
    numero: number;
    nombre: string;
    jockey?: string;
    noCorre?: boolean;
    scratched?: boolean;
  }>;
  texto?: string;
  
  // Carrera
  carrera: {
    id: string;
    numero: number;
    fecha: string;
    hora: string;
  };
  
  // Hipódromo
  hipodromo: {
    id: string;
    nombre: string;
  };
  
  // Opcionales
  horseNumber?: number;
  esApuestaMultiCarrera?: boolean;
  esApuestaAgrupada?: boolean;
  detalleGrupos?: any;
  numeroCombinaciones?: number;
  montoPorCombinacion?: number;
  carreraMetadata?: any;
  usaVales?: boolean;
  valesApostados?: number;
  dividendo?: number;
}

interface CancelBetData {
  betId: string;
}

// ========================================
// 🔥 FUNCIONES AUXILIARES
// ========================================

/**
 * Validar que el usuario tenga saldo suficiente
 */
async function validateUserBalance(userId: string, amount: number): Promise<{ valid: boolean; currentBalance: number; error?: string }> {
  try {
    const userDoc = await db.collection('USUARIOS').doc(userId).get();
    
    if (!userDoc.exists) {
      return { valid: false, currentBalance: 0, error: 'Usuario no encontrado' };
    }
    
    const userData = userDoc.data()!;
    const currentBalance = userData.balance || 0;
    
    if (currentBalance < amount) {
      return { 
        valid: false, 
        currentBalance, 
        error: `Saldo insuficiente. Tienes $${currentBalance}, necesitas $${amount}` 
      };
    }
    
    return { valid: true, currentBalance };
  } catch (error) {
    console.error("❌ Error validando saldo:", error);
    return { valid: false, currentBalance: 0, error: 'Error al validar saldo' };
  }
}

/**
 * Validar que la carrera exista y esté disponible
 */
async function validateRace(raceId: string): Promise<{ valid: boolean; error?: string }> {
  try {
    if (!raceId) {
      return { valid: false, error: 'ID de carrera no especificado' };
    }
    
    const raceDoc = await db.collection('carreras1').doc(raceId).get();
    
    if (!raceDoc.exists) {
      return { valid: false, error: 'Carrera no encontrada' };
    }
    
    const raceData = raceDoc.data()!;
    
    // Verificar si la carrera ya finalizó
    if (raceData.estado === 'FINALIZADA') {
      return { valid: false, error: 'La carrera ya finalizó' };
    }
    
    return { valid: true };
  } catch (error) {
    console.error("❌ Error validando carrera:", error);
    return { valid: false, error: 'Error al validar carrera' };
  }
}

/**
 * Validar montos mínimos y máximos
 */
function validateBetAmount(amount: number, minAmount = 200, maxAmount = 500000): { valid: boolean; error?: string } {
  if (amount < minAmount) {
    return { valid: false, error: `El monto mínimo es $${minAmount}` };
  }
  
  if (amount > maxAmount) {
    return { valid: false, error: `El monto máximo es $${maxAmount}` };
  }
  
  return { valid: true };
}

/**
 * Validar selección de caballos
 */
function validateHorseSelection(horses: any[]): { valid: boolean; error?: string } {
  if (!horses || horses.length === 0) {
    return { valid: false, error: 'Debes seleccionar al menos un caballo' };
  }
  
  // Verificar que los números sean válidos
  for (const horse of horses) {
    if (!horse.numero || horse.numero < 1) {
      return { valid: false, error: 'Número de caballo inválido' };
    }
  }
  
  return { valid: true };
}

// ========================================
// 🔥 FUNCIÓN: CREAR APUESTA
// ========================================

export const createBet = functions.https.onCall(async (request) => {
  const data: CreateBetData = request.data;
  const context = request;
  
  // ========== 1. VERIFICAR AUTENTICACIÓN ==========
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'Debes iniciar sesión para realizar una apuesta'
    );
  }

  const userId = context.auth.uid;
  const userEmail = context.auth.token?.email || '';
  const userName = context.auth.token?.name || userEmail.split('@')[0] || 'Usuario';

  console.log("🔥 Creando apuesta para:", userId);
  console.log("📦 Datos recibidos:", data);

  try {
    // ========== 2. VALIDACIONES ==========
    
    // Validar monto
    const amountValidation = validateBetAmount(data.amount);
    if (!amountValidation.valid) {
      throw new functions.https.HttpsError('invalid-argument', amountValidation.error!);
    }
    
    // Validar caballos
    const horsesValidation = validateHorseSelection(data.seleccionados);
    if (!horsesValidation.valid) {
      throw new functions.https.HttpsError('invalid-argument', horsesValidation.error!);
    }
    
    // Validar carrera
    const raceValidation = await validateRace(data.raceId);
    if (!raceValidation.valid) {
      throw new functions.https.HttpsError('failed-precondition', raceValidation.error!);
    }
    
    // Validar saldo
    const balanceValidation = await validateUserBalance(userId, data.amount);
    if (!balanceValidation.valid) {
      throw new functions.https.HttpsError('failed-precondition', balanceValidation.error!);
    }

    console.log("✅ Validaciones pasadas");
    console.log("💰 Saldo actual:", balanceValidation.currentBalance);

    // ========== 3. USAR TRANSACCIÓN PARA ATOMICIDAD ==========
    const result = await db.runTransaction(async (transaction) => {
      const timestamp = admin.firestore.Timestamp.now();
      const now = new Date();

      // Referencias
      const userRef = db.collection('USUARIOS').doc(userId);
      const betRef = db.collection('bets').doc();
      const globalBetRef = db.collection('APUESTAS_GLOBAL').doc();
      const transactionRef = db.collection('transactions').doc();

      const betId = betRef.id;
      const globalBetId = globalBetRef.id;

      // ========== 4. CREAR APUESTA SIMPLE EN "bets" ==========
      const simpleBet: any = {
        userId,
        raceId: data.raceId,
        amount: data.amount,
        betType: data.betType,
        status: 'pending',
        createdAt: timestamp,
        odds: 2.0,
        selectedHorses: data.seleccionados,
      };

      if (data.horseNumber) {
        simpleBet.horseNumber = data.horseNumber;
      }

      transaction.set(betRef, simpleBet);
      console.log("✅ Bet creado:", betId);

      // ========== 5. CREAR APUESTA GLOBAL EN "APUESTAS_GLOBAL" ==========
      const globalBet: any = {
        apuestaId: betId,
        usuarioId: userId,
        usuario: {
          id: userId,
          email: userEmail,
          nombre: userName,
        },
        tipoApuesta: {
          tipo: data.betType,
          label: data.betType,
          descripcion: data.betType,
          modoSeleccion: data.esApuestaMultiCarrera ? 'grouped-races' : 'single',
        },
        esApuestaMultiCarrera: data.esApuestaMultiCarrera || false,
        esApuestaAgrupada: data.esApuestaAgrupada || false,
        seleccionados: data.seleccionados,
        texto: data.texto || '',
        carrera: data.carrera,
        hipodromo: data.hipodromo,
        montos: {
          montoTotal: data.amount,
          montoPorCombinacion: data.montoPorCombinacion || data.amount,
          numeroCombinaciones: data.numeroCombinaciones || 1,
          apuestaMinima: 200,
          apuestaMaxima: 500000,
          dividendo: data.dividendo || 100,
          gananciaPotencial: data.amount * 2,
          usaVales: data.usaVales || false,
          valesApostados: data.valesApostados || 0,
        },
        estado: 'PENDIENTE',
        estadoDetallado: {
          estado: 'PENDIENTE',
          mensaje: 'Esperando resultado de la carrera',
          fechaUltimaActualizacion: timestamp,
        },
        resultado: {
          esGanadora: false,
          gananciaReal: 0,
          fechaResolucion: null,
        },
        timestamps: {
          creacion: timestamp,
          creacionISO: now.toISOString(),
          unix: Date.now(),
        },
        metadata: {
          app: 'HorseRacingApp',
          version: '2.0',
          platform: 'cloud-function',
        },
      };

      // Campos opcionales
      if (data.horseNumber) {
        globalBet.caballos = { numero: data.horseNumber };
      }
      if (data.detalleGrupos) {
        globalBet.detalleGrupos = data.detalleGrupos;
      }
      if (data.carreraMetadata) {
        globalBet.carreraMetadata = data.carreraMetadata;
      }

      transaction.set(globalBetRef, globalBet);
      console.log("✅ APUESTAS_GLOBAL creado:", globalBetId);

      // ========== 6. ACTUALIZAR SALDO DEL USUARIO ==========
      transaction.update(userRef, {
        balance: admin.firestore.FieldValue.increment(-data.amount),
        totalBet: admin.firestore.FieldValue.increment(data.amount),
        lastBetAt: timestamp,
      });
      console.log("✅ Saldo actualizado");

      // ========== 7. CREAR TRANSACCIÓN ==========
      const transactionData = {
        userId,
        type: 'bet',
        amount: -data.amount,
        betId: betId,
        globalBetId: globalBetId,
        raceId: data.raceId,
        description: `Apuesta ${data.betType} - ${data.texto || ''}`,
        createdAt: timestamp,
        status: 'completed',
        metadata: {
          betType: data.betType,
          horses: data.seleccionados.map(h => h.numero),
        },
      };

      transaction.set(transactionRef, transactionData);
      console.log("✅ Transacción creada");

      // Calcular nuevo saldo
      const newBalance = balanceValidation.currentBalance - data.amount;

      return {
        success: true,
        betId: betId,
        globalBetId: globalBetId,
        newBalance: newBalance,
        transactionId: transactionRef.id,
      };
    });

    console.log("🎉 TODO GUARDADO EXITOSAMENTE");
    return result;

  } catch (error: any) {
    console.error("❌ ERROR:", error);
    
    // Si es un error de Firebase Functions, lo dejamos pasar
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Otros errores los convertimos
    throw new functions.https.HttpsError(
      'internal', 
      error.message || 'Error al crear apuesta'
    );
  }
});

// ========================================
// 🔥 FUNCIÓN: CANCELAR APUESTA
// ========================================

export const cancelBet = functions.https.onCall(async (request) => {
  const data: CancelBetData = request.data;
  const context = request;
  
  // ========== 1. VERIFICAR AUTENTICACIÓN ==========
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  const userId = context.auth.uid;
  const { betId } = data;

  console.log("🔥 Cancelando apuesta:", betId);

  try {
    // ========== 2. VERIFICAR QUE LA APUESTA EXISTA ==========
    const betRef = db.collection('bets').doc(betId);
    const betDoc = await betRef.get();

    if (!betDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Apuesta no encontrada');
    }

    const betData = betDoc.data()!;

    // ========== 3. VERIFICAR PERMISOS ==========
    if (betData.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permiso para cancelar esta apuesta');
    }

    // ========== 4. VERIFICAR ESTADO ==========
    if (betData.status !== 'pending') {
      throw new functions.https.HttpsError(
        'failed-precondition', 
        `No se puede cancelar una apuesta con estado: ${betData.status}`
      );
    }

    // ========== 5. USAR TRANSACCIÓN ==========
    await db.runTransaction(async (transaction) => {
      const timestamp = admin.firestore.Timestamp.now();
      const userRef = db.collection('USUARIOS').doc(userId);

      // Actualizar bet
      transaction.update(betRef, {
        status: 'cancelled',
        cancelledAt: timestamp,
      });

      // Devolver dinero
      transaction.update(userRef, {
        balance: admin.firestore.FieldValue.increment(betData.amount),
      });

      // Buscar y actualizar en APUESTAS_GLOBAL
      const globalQuery = await db.collection('APUESTAS_GLOBAL')
        .where('apuestaId', '==', betId)
        .limit(1)
        .get();

      if (!globalQuery.empty) {
        const globalDoc = globalQuery.docs[0];
        transaction.update(globalDoc.ref, {
          estado: 'CANCELADA',
          'estadoDetallado.estado': 'CANCELADA',
          'estadoDetallado.mensaje': 'Cancelada por el usuario',
          'estadoDetallado.fechaUltimaActualizacion': timestamp,
        });
      }

      // Crear transacción de reembolso
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        userId,
        type: 'refund',
        amount: betData.amount,
        betId,
        description: 'Reembolso por cancelación de apuesta',
        createdAt: timestamp,
        status: 'completed',
      });
    });

    console.log("✅ Apuesta cancelada exitosamente");
    return { success: true };

  } catch (error: any) {
    console.error("❌ ERROR:", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ========================================
// 🔥 FUNCIÓN: RESOLVER APUESTA (ADMIN)
// ========================================

export const resolveBet = functions.https.onCall(async (request) => {
  const data: { betId: string; isWinner: boolean; winAmount?: number } = request.data;
  const context = request;
  
  // Solo admin puede resolver apuestas
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden resolver apuestas');
  }

  const { betId, isWinner, winAmount = 0 } = data;

  console.log("🔥 Resolviendo apuesta:", betId, "Ganadora:", isWinner);

  try {
    await db.runTransaction(async (transaction) => {
      const betRef = db.collection('bets').doc(betId);
      const betDoc = await transaction.get(betRef);

      if (!betDoc.exists) {
        throw new Error('Apuesta no encontrada');
      }

      const betData = betDoc.data()!;
      const timestamp = admin.firestore.Timestamp.now();

      // Actualizar bet
      transaction.update(betRef, {
        status: isWinner ? 'won' : 'lost',
        resolvedAt: timestamp,
        winAmount: winAmount,
      });

      // Si ganó, pagar premio
      if (isWinner && winAmount > 0) {
        const userRef = db.collection('USUARIOS').doc(betData.userId);
        transaction.update(userRef, {
          balance: admin.firestore.FieldValue.increment(winAmount),
          totalWon: admin.firestore.FieldValue.increment(winAmount),
        });

        // Crear transacción de premio
        const transactionRef = db.collection('transactions').doc();
        transaction.set(transactionRef, {
          userId: betData.userId,
          type: 'win',
          amount: winAmount,
          betId,
          description: `Premio por apuesta ganadora`,
          createdAt: timestamp,
          status: 'completed',
        });
      }

      // Actualizar APUESTAS_GLOBAL
      const globalQuery = await db.collection('APUESTAS_GLOBAL')
        .where('apuestaId', '==', betId)
        .limit(1)
        .get();

      if (!globalQuery.empty) {
        const globalDoc = globalQuery.docs[0];
        transaction.update(globalDoc.ref, {
          estado: isWinner ? 'GANADA' : 'PERDIDA',
          'estadoDetallado.estado': isWinner ? 'GANADA' : 'PERDIDA',
          'estadoDetallado.mensaje': isWinner ? `¡Ganaste $${winAmount}!` : 'Apuesta perdida',
          'estadoDetallado.fechaUltimaActualizacion': timestamp,
          'resultado.esGanadora': isWinner,
          'resultado.gananciaReal': winAmount,
          'resultado.fechaResolucion': timestamp,
        });
      }
    });

    console.log("✅ Apuesta resuelta exitosamente");
    return { success: true };

  } catch (error: any) {
    console.error("❌ ERROR:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
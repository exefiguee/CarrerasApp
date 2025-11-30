import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface CreateBetData {
  raceId: string;
  horseNumber?: number;
  amount: number;
  betType: string;
  esApuestaMultiCarrera?: boolean;
  esApuestaAgrupada?: boolean;
  detalleGrupos?: any;
  seleccionados?: any[];
  numeroCombinaciones?: number;
  montoPorCombinacion?: number;
  texto?: string;
  carrera?: any;
  hipodromo?: any;
  carreraMetadata?: any;
  usaVales?: boolean;
  valesApostados?: number;
  dividendo?: number;
}

/**
 * 🔥 CREAR APUESTA - ULTRA SIMPLE
 */
export const createBet = functions.https.onCall(async (request) => {
  const db = admin.firestore();
  
  console.log("🔥 INICIO");
  
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  const userId = request.auth.uid;
  const data = request.data as CreateBetData;

  console.log("User:", userId);
  console.log("Amount:", data.amount);
  console.log("BetType:", data.betType);

  try {
    // 1. Obtener usuario
    const userRef = db.collection('USUARIOS').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('Usuario no encontrado');
    }

    const userData = userDoc.data()!;
    const currentBalance = userData.balance || 0;

    console.log("Balance:", currentBalance);

    if (currentBalance < data.amount) {
      throw new Error('Saldo insuficiente');
    }

    const timestamp = admin.firestore.Timestamp.now();
    
    // 2. Crear bet simple
    const betRef = db.collection('bets').doc();
    
    // 🔥 CONSTRUIR OBJETO SIN UNDEFINED
    const simpleBet: Record<string, any> = {
      userId,
      raceId: data.raceId || '',
      amount: data.amount,
      betType: data.betType,
      status: 'pending',
      createdAt: timestamp,
      odds: 2.0,
    };
    
    // 🔥 SOLO AGREGAR SI EXISTE
    if (data.horseNumber !== undefined && data.horseNumber !== null) {
      simpleBet.horseNumber = data.horseNumber;
    }
    
    if (data.seleccionados && data.seleccionados.length > 0) {
      simpleBet.selectedHorses = data.seleccionados;
    }
    
    await betRef.set(simpleBet);
    console.log("✅ Bet guardado:", betRef.id);

    // 3. Crear APUESTAS_GLOBAL
    const globalBetRef = db.collection('APUESTAS_GLOBAL').doc();
    
    const globalBet: Record<string, any> = {
      apuestaId: betRef.id,
      usuarioId: userId,
      usuario: {
        id: userId,
        email: userData.email || '',
      },
      tipoApuesta: {
        tipo: data.betType,
        label: data.betType,
        descripcion: data.betType,
      },
      seleccionados: data.seleccionados || [],
      texto: data.texto || '',
      carrera: data.carrera || {
        id: data.raceId || '',
        numero: 0,
      },
      hipodromo: data.hipodromo || { nombre: 'PALERMO' },
      montos: {
        montoTotal: data.amount,
        montoPorCombinacion: data.montoPorCombinacion || data.amount,
        numeroCombinaciones: data.numeroCombinaciones || 1,
      },
      estado: 'PENDIENTE',
      timestamps: {
        creacion: timestamp,
      },
    };
    
    await globalBetRef.set(globalBet);
    console.log("✅ APUESTAS_GLOBAL guardado:", globalBetRef.id);

    // 4. Actualizar saldo
    const newBalance = currentBalance - data.amount;
    await userRef.update({ balance: newBalance });
    console.log("✅ Saldo actualizado:", newBalance);

    // 5. Crear transacción
    await db.collection('transactions').add({
      userId,
      type: 'bet',
      amount: -data.amount,
      betId: betRef.id,
      createdAt: timestamp,
      status: 'completed',
    });
    console.log("✅ Transacción creada");

    console.log("🎉 ÉXITO TOTAL");

    return {
      success: true,
      betId: betRef.id,
      globalBetId: globalBetRef.id,
      newBalance: newBalance,
    };

  } catch (error: any) {
    console.error("❌ ERROR:", error.message);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 🔥 CANCELAR APUESTA
 */
export const cancelBet = functions.https.onCall(async (request) => {
  const db = admin.firestore();
  
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  const userId = request.auth.uid;
  const { betId } = request.data;

  try {
    const betRef = db.collection('bets').doc(betId);
    const betDoc = await betRef.get();

    if (!betDoc.exists) {
      throw new Error('Apuesta no encontrada');
    }

    const betData = betDoc.data()!;

    if (betData.userId !== userId) {
      throw new Error('No autorizado');
    }

    if (betData.status !== 'pending') {
      throw new Error('No se puede cancelar');
    }

    // Devolver dinero
    const userRef = db.collection('USUARIOS').doc(userId);
    const userDoc = await userRef.get();
    const currentBalance = userDoc.data()!.balance || 0;
    await userRef.update({ balance: currentBalance + betData.amount });

    // Cancelar bet
    await betRef.update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };

  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  validateUserBalance,
  validateRace,
  validateBetAmount,
  validateHorseSelection,
  cleanFirestoreData,
} from './helpers';

const db = admin.firestore();

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
 * 🔥 CREAR APUESTA - CON SEGURIDAD COMPLETA
 */
export const createBet = functions.https.onCall(async (request) => {
  // ========== 1. VERIFICAR AUTENTICACIÓN ==========
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Debes iniciar sesión para realizar una apuesta'
    );
  }

  const userId = request.auth.uid;
  const data = request.data as CreateBetData;

  console.log("🔥 Creando apuesta para:", userId);
  console.log("📦 Datos recibidos:", {
    amount: data.amount,
    betType: data.betType,
    raceId: data.raceId,
  });

  try {
    // ========== 2. VALIDACIONES ==========
    
    // Validar monto
    const amountValidation = validateBetAmount(data.amount);
    if (!amountValidation.valid) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        amountValidation.error!
      );
    }

    // Validar caballos
    if (data.seleccionados) {
      const horsesValidation = validateHorseSelection(data.seleccionados);
      if (!horsesValidation.valid) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          horsesValidation.error!
        );
      }
    }

    // Validar carrera
    const raceValidation = await validateRace(data.raceId);
    if (!raceValidation.valid) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        raceValidation.error!
      );
    }

    // Validar saldo
    const balanceValidation = await validateUserBalance(userId, data.amount);
    if (!balanceValidation.valid) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        balanceValidation.error!
      );
    }

    console.log("✅ Todas las validaciones pasadas");
    console.log("💰 Saldo actual:", balanceValidation.currentBalance);

    // ========== 3. USAR TRANSACCIÓN ATÓMICA ==========
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

      // ========== 4. CREAR BET SIMPLE ==========
      const simpleBet: Record<string, any> = {
        userId,
        raceId: data.raceId,
        amount: data.amount,
        betType: data.betType,
        status: 'pending',
        createdAt: timestamp,
        odds: 2.0,
      };

      if (data.horseNumber) {
        simpleBet.horseNumber = data.horseNumber;
      }

      if (data.seleccionados && data.seleccionados.length > 0) {
        simpleBet.selectedHorses = data.seleccionados;
      }

      transaction.set(betRef, cleanFirestoreData(simpleBet));
      console.log("✅ Bet creado:", betId);

      // ========== 5. CREAR APUESTA GLOBAL ==========
  // ========== 5. CREAR APUESTA GLOBAL ==========
// 🔧 Guardar auth para TypeScript
const userEmail = request.auth?.token?.email || '';
const userName = request.auth?.token?.name || 'Usuario';

const globalBet: Record<string, any> = {
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
  seleccionados: data.seleccionados || [],
  texto: data.texto || '',
  carrera: data.carrera || {
    id: data.raceId,
    numero: 0,
    fecha: now.toISOString().split('T')[0],
    hora: now.toTimeString().split(' ')[0],
  },
  hipodromo: data.hipodromo || {
    id: data.raceId,
    nombre: 'PALERMO',
  },
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

      // Agregar campos opcionales
      if (data.horseNumber) {
        globalBet.caballos = { numero: data.horseNumber };
      }
      if (data.detalleGrupos) {
        globalBet.detalleGrupos = data.detalleGrupos;
      }
      if (data.carreraMetadata) {
        globalBet.carreraMetadata = data.carreraMetadata;
      }

      transaction.set(globalBetRef, cleanFirestoreData(globalBet));
      console.log("✅ APUESTAS_GLOBAL creado:", globalBetId);

      // ========== 6. ACTUALIZAR SALDO ==========
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
          horses: data.seleccionados?.map((h: any) => h.numero || h.number) || [],
        },
      };

      transaction.set(transactionRef, cleanFirestoreData(transactionData));
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
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { validateBetCancellation } from './helpers';

const db = admin.firestore();

interface CancelBetData {
  betId: string;
}

/**
 * 🔥 CANCELAR APUESTA - CON SEGURIDAD COMPLETA
 */
export const cancelBet = functions.https.onCall(async (request) => {
  // ========== 1. VERIFICAR AUTENTICACIÓN ==========
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'No autenticado'
    );
  }

  const userId = request.auth.uid;
  const data = request.data as CancelBetData;
  const { betId } = data;

  console.log("🔥 Cancelando apuesta:", betId, "Usuario:", userId);

  try {
    // ========== 2. VALIDAR CANCELACIÓN ==========
    const validation = await validateBetCancellation(betId, userId);
    
    if (!validation.valid) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        validation.error!
      );
    }

    const betData = validation.betData!;
    console.log("✅ Validación pasada, monto a devolver:", betData.amount);

    // ========== 3. USAR TRANSACCIÓN ATÓMICA ==========
    await db.runTransaction(async (transaction) => {
      const timestamp = admin.firestore.Timestamp.now();

      // Referencias
      const betRef = db.collection('bets').doc(betId);
      const userRef = db.collection('USUARIOS').doc(userId);

      // ========== 4. ACTUALIZAR BET ==========
      transaction.update(betRef, {
        status: 'cancelled',
        cancelledAt: timestamp,
      });
      console.log("✅ Bet cancelado");

      // ========== 5. DEVOLVER DINERO ==========
      transaction.update(userRef, {
        balance: admin.firestore.FieldValue.increment(betData.amount),
      });
      console.log("✅ Saldo devuelto:", betData.amount);

      // ========== 6. ACTUALIZAR APUESTAS_GLOBAL ==========
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
        console.log("✅ APUESTAS_GLOBAL actualizado");
      }

      // ========== 7. CREAR TRANSACCIÓN DE REEMBOLSO ==========
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
      console.log("✅ Transacción de reembolso creada");
    });

    console.log("🎉 Apuesta cancelada exitosamente");
    return { success: true };

  } catch (error: any) {
    console.error("❌ ERROR:", error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Error al cancelar apuesta'
    );
  }
});
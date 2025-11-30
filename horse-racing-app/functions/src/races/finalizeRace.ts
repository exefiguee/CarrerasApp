import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { isAdmin } from '../bets/helpers';

const db = admin.firestore();

interface FinalizeRaceData {
  raceId: string;
  results: {
    winner: number;
    place?: number[];
    show?: number[];
  };
}

/**
 * 🔥 Finalizar una carrera y liquidar apuestas (Solo Admin)
 */
export const finalizeRace = functions.https.onCall(async (request) => {
  // ========== 1. VERIFICAR AUTENTICACIÓN ==========
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  // ========== 2. VERIFICAR QUE ES ADMIN ==========
  const esAdmin = await isAdmin(request.auth.uid);
  if (!esAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden finalizar carreras'
    );
  }

  const data = request.data as FinalizeRaceData;
  const { raceId, results } = data;

  if (!raceId || !results || !results.winner) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Datos inválidos'
    );
  }

  console.log("🔥 Finalizando carrera:", raceId);

  try {
    // Actualizar estado de la carrera
    await db.collection('carreras1').doc(raceId).update({
      estado: 'FINALIZADA',
      results,
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
      finalizedBy: request.auth.uid
    });

    // Obtener todas las apuestas pendientes de esta carrera
    const betsSnapshot = await db.collection('bets')
      .where('raceId', '==', raceId)
      .where('status', '==', 'pending')
      .get();

    const batch = db.batch();
    let totalWinners = 0;
    let totalLosers = 0;

    for (const betDoc of betsSnapshot.docs) {
      const betData = betDoc.data();
      let isWinner = false;
      let payout = 0;

      // Determinar si ganó según el tipo de apuesta
      switch (betData.betType) {
        case 'GANADOR':
          isWinner = betData.horseNumber === results.winner;
          break;
        case 'SEGUNDO':
          isWinner = results.place?.includes(betData.horseNumber) || false;
          break;
        case 'TERCERO':
          isWinner = results.show?.includes(betData.horseNumber) || false;
          break;
      }

      if (isWinner) {
        // Calcular ganancia
        payout = betData.amount * betData.odds;
        totalWinners++;

        // Actualizar balance del usuario
        const userRef = db.collection('USUARIOS').doc(betData.userId);
        batch.update(userRef, {
          balance: admin.firestore.FieldValue.increment(payout),
          totalWon: admin.firestore.FieldValue.increment(payout - betData.amount)
        });

        // Crear transacción de ganancia
        const transactionRef = db.collection('transactions').doc();
        batch.set(transactionRef, {
          userId: betData.userId,
          type: 'win',
          amount: payout,
          betId: betDoc.id,
          raceId,
          description: `Ganancia de apuesta`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'completed'
        });

        // Actualizar apuesta
        batch.update(betDoc.ref, {
          status: 'won',
          payout,
          settledAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        totalLosers++;
        
        // Actualizar estadísticas del usuario
        const userRef = db.collection('USUARIOS').doc(betData.userId);
        batch.update(userRef, {
          totalLost: admin.firestore.FieldValue.increment(betData.amount)
        });

        // Actualizar apuesta como perdida
        batch.update(betDoc.ref, {
          status: 'lost',
          settledAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // Ejecutar todas las actualizaciones
    await batch.commit();

    console.log("✅ Carrera finalizada:", {
      totalBets: betsSnapshot.size,
      totalWinners,
      totalLosers
    });

    return {
      success: true,
      totalBets: betsSnapshot.size,
      totalWinners,
      totalLosers
    };

  } catch (error: any) {
    console.error("❌ Error al finalizar carrera:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
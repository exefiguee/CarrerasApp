import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface FinalizeRaceData {
  raceId: string;
  results: {
    winner: number;
    place?: number[];
    show?: number[];
  };
}

/**
 * Finalizar una carrera y liquidar apuestas (Solo Admin)
 */
export const finalizeRace = functions.https.onCall(async (request) => {
  const db = admin.firestore();
  
  // Verificar autenticación
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  // Verificar que es admin
  const adminRef = db.collection('USUARIOS').doc(request.auth.uid);
  const adminDoc = await adminRef.get();
  
  if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden finalizar carreras'
    );
  }

  // Obtener datos del request
  const { raceId, results } = request.data as FinalizeRaceData;

  if (!raceId || !results || !results.winner) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Datos inválidos'
    );
  }

  try {
    // Actualizar estado de la carrera
    await db.collection('races').doc(raceId).update({
      status: 'finished',
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
        case 'win':
          isWinner = betData.horseNumber === results.winner;
          break;
        case 'place':
          isWinner = results.place?.includes(betData.horseNumber) || false;
          break;
        case 'show':
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

    return {
      success: true,
      totalBets: betsSnapshot.size,
      totalWinners,
      totalLosers
    };

  } catch (error: any) {
    console.error('Error al finalizar carrera:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
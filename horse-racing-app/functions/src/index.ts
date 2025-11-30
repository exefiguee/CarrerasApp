import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// ========================================
// 🔥 INICIALIZAR FIREBASE ADMIN (UNA SOLA VEZ)
// ========================================
admin.initializeApp();

// ========================================
// 🔥 EXPORTAR MÓDULOS
// ========================================

// Apuestas
export { createBet, cancelBet } from './bets';

// Transacciones (Admin)
export { approveRecharge, approveWithdrawal } from './transactions';

// Carreras (Admin)
export { finalizeRace } from './races';

// Admin
export { adminCreateUser } from './admin';

// ========================================
// 🔥 FUNCIÓN DE HEALTH CHECK
// ========================================

export const healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).send({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2.0',
    message: 'Horse Racing API is running! 🐎',
  });
});

// ========================================
// 🔥 FUNCIÓN PARA OBTENER ESTADÍSTICAS
// ========================================

export const getUserStats = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  const db = admin.firestore();
  const userId = request.auth.uid;

  console.log("🔥 Obteniendo estadísticas de:", userId);

  try {
    // Obtener todas las apuestas del usuario
    const betsSnapshot = await db.collection('bets')
      .where('userId', '==', userId)
      .get();

    let totalBets = 0;
    let totalWon = 0;
    let totalLost = 0;
    let pendingBets = 0;
    let wonBets = 0;
    let lostBets = 0;

    betsSnapshot.forEach(doc => {
      const bet = doc.data();
      totalBets++;

      if (bet.status === 'pending') {
        pendingBets++;
      } else if (bet.status === 'won') {
        wonBets++;
        totalWon += bet.payout || 0;
      } else if (bet.status === 'lost') {
        lostBets++;
        totalLost += bet.amount || 0;
      }
    });

    const stats = {
      totalBets,
      pendingBets,
      wonBets,
      lostBets,
      totalWon,
      totalLost,
      netProfit: totalWon - totalLost,
      winRate: totalBets > 0 ? (wonBets / totalBets) * 100 : 0,
    };

    console.log("✅ Estadísticas:", stats);
    return stats;

  } catch (error: any) {
    console.error("❌ Error:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
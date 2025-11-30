import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { isAdmin } from '../bets/helpers';

const db = admin.firestore();

interface ApproveRechargeData {
  requestId: string;
  paymentMethod: string;
  paymentReference: string;
}

/**
 * 🔥 Aprobar una solicitud de recarga (Solo Admin)
 */
export const approveRecharge = functions.https.onCall(async (request) => {
  // ========== 1. VERIFICAR AUTENTICACIÓN ==========
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  // ========== 2. VERIFICAR QUE ES ADMIN ==========
  const esAdmin = await isAdmin(request.auth.uid);
  if (!esAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden aprobar recargas'
    );
  }

  const data = request.data as ApproveRechargeData;
  const { requestId, paymentMethod, paymentReference } = data;

  console.log("🔥 Aprobando recarga:", requestId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const requestRef = db.collection('rechargeRequests').doc(requestId);
      const requestDoc = await transaction.get(requestRef);

      if (!requestDoc.exists) {
        throw new Error('Solicitud no encontrada');
      }

      const requestData = requestDoc.data()!;

      if (requestData.status !== 'pending') {
        throw new Error('La solicitud ya fue procesada');
      }

      // Actualizar balance del usuario
      const userRef = db.collection('USUARIOS').doc(requestData.userId);
      transaction.update(userRef, {
        balance: admin.firestore.FieldValue.increment(requestData.amount)
      });

      // Actualizar solicitud
      transaction.update(requestRef, {
        status: 'approved',
        approvedBy: request.auth!.uid,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentMethod,
        paymentReference
      });

      // Crear transacción
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        userId: requestData.userId,
        type: 'recharge',
        amount: requestData.amount,
        requestId,
        description: `Recarga aprobada - ${paymentMethod}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed',
        approvedBy: request.auth!.uid
      });

      return { success: true };
    });

    console.log("✅ Recarga aprobada exitosamente");
    return result;

  } catch (error: any) {
    console.error("❌ Error:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 
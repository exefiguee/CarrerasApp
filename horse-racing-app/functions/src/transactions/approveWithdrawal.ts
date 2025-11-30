import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { isAdmin } from '../bets/helpers';

const db = admin.firestore();

interface ApproveWithdrawalData {
  requestId: string;
  paymentMethod: string;
  paymentReference: string;
}

/**
 * 🔥 Aprobar una solicitud de retiro (Solo Admin)
 */
export const approveWithdrawal = functions.https.onCall(async (request) => {
  // ========== 1. VERIFICAR AUTENTICACIÓN ==========
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  // ========== 2. VERIFICAR QUE ES ADMIN ==========
  const esAdmin = await isAdmin(request.auth.uid);
  if (!esAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden aprobar retiros'
    );
  }

  const data = request.data as ApproveWithdrawalData;
  const { requestId, paymentMethod, paymentReference } = data;

  console.log("🔥 Aprobando retiro:", requestId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const requestRef = db.collection('withdrawalRequests').doc(requestId);
      const requestDoc = await transaction.get(requestRef);

      if (!requestDoc.exists) {
        throw new Error('Solicitud no encontrada');
      }

      const requestData = requestDoc.data()!;

      if (requestData.status !== 'pending') {
        throw new Error('La solicitud ya fue procesada');
      }

      // Verificar balance del usuario
      const userRef = db.collection('USUARIOS').doc(requestData.userId);
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data()!;

      if (userData.balance < requestData.amount) {
        throw new Error('Balance insuficiente');
      }

      // Descontar del balance
      transaction.update(userRef, {
        balance: admin.firestore.FieldValue.increment(-requestData.amount)
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
        type: 'withdrawal',
        amount: -requestData.amount,
        requestId,
        description: `Retiro aprobado - ${paymentMethod}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed',
        approvedBy: request.auth!.uid
      });

      return { success: true };
    });

    console.log("✅ Retiro aprobado exitosamente");
    return result;

  } catch (error: any) {
    console.error("❌ Error:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface ApproveRechargeData {
  requestId: string;
  paymentMethod: string;
  paymentReference: string;
}

interface ApproveWithdrawalData {
  requestId: string;
  paymentMethod: string;
  paymentReference: string;
}

/**
 * Aprobar una solicitud de recarga (Solo Admin)
 */
export const approveRecharge = functions.https.onCall(async (request) => {
  const db = admin.firestore();
  
  // Verificar que es admin
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  const adminRef = db.collection('USUARIOS').doc(request.auth.uid);
  const adminDoc = await adminRef.get();
  
  if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden aprobar recargas'
    );
  }

  const { requestId, paymentMethod, paymentReference } = request.data as ApproveRechargeData;

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

    return result;

  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Aprobar una solicitud de retiro (Solo Admin)
 */
export const approveWithdrawal = functions.https.onCall(async (request) => {
  const db = admin.firestore();
  
  // Verificar que es admin
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  const adminRef = db.collection('USUARIOS').doc(request.auth.uid);
  const adminDoc = await adminRef.get();
  
  if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden aprobar retiros'
    );
  }

  const { requestId, paymentMethod, paymentReference } = request.data as ApproveWithdrawalData;

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

    return result;

  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveWithdrawal = exports.approveRecharge = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Aprobar una solicitud de recarga (Solo Admin)
 */
exports.approveRecharge = functions.https.onCall(async (request) => {
    var _a;
    const db = admin.firestore();
    // Verificar que es admin
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    const adminRef = db.collection('users').doc(request.auth.uid);
    const adminDoc = await adminRef.get();
    if (!adminDoc.exists || ((_a = adminDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden aprobar recargas');
    }
    const { requestId, paymentMethod, paymentReference } = request.data;
    try {
        const result = await db.runTransaction(async (transaction) => {
            const requestRef = db.collection('rechargeRequests').doc(requestId);
            const requestDoc = await transaction.get(requestRef);
            if (!requestDoc.exists) {
                throw new Error('Solicitud no encontrada');
            }
            const requestData = requestDoc.data();
            if (requestData.status !== 'pending') {
                throw new Error('La solicitud ya fue procesada');
            }
            // Actualizar balance del usuario
            const userRef = db.collection('users').doc(requestData.userId);
            transaction.update(userRef, {
                balance: admin.firestore.FieldValue.increment(requestData.amount)
            });
            // Actualizar solicitud
            transaction.update(requestRef, {
                status: 'approved',
                approvedBy: request.auth.uid,
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
                approvedBy: request.auth.uid
            });
            return { success: true };
        });
        return result;
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * Aprobar una solicitud de retiro (Solo Admin)
 */
exports.approveWithdrawal = functions.https.onCall(async (request) => {
    var _a;
    const db = admin.firestore();
    // Verificar que es admin
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    const adminRef = db.collection('users').doc(request.auth.uid);
    const adminDoc = await adminRef.get();
    if (!adminDoc.exists || ((_a = adminDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden aprobar retiros');
    }
    const { requestId, paymentMethod, paymentReference } = request.data;
    try {
        const result = await db.runTransaction(async (transaction) => {
            const requestRef = db.collection('withdrawalRequests').doc(requestId);
            const requestDoc = await transaction.get(requestRef);
            if (!requestDoc.exists) {
                throw new Error('Solicitud no encontrada');
            }
            const requestData = requestDoc.data();
            if (requestData.status !== 'pending') {
                throw new Error('La solicitud ya fue procesada');
            }
            // Verificar balance del usuario
            const userRef = db.collection('users').doc(requestData.userId);
            const userDoc = await transaction.get(userRef);
            const userData = userDoc.data();
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
                approvedBy: request.auth.uid,
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
                approvedBy: request.auth.uid
            });
            return { success: true };
        });
        return result;
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=transactions.js.map
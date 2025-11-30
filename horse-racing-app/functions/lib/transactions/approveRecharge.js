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
exports.approveRecharge = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const helpers_1 = require("../bets/helpers");
const db = admin.firestore();
/**
 * 🔥 Aprobar una solicitud de recarga (Solo Admin)
 */
exports.approveRecharge = functions.https.onCall(async (request) => {
    // ========== 1. VERIFICAR AUTENTICACIÓN ==========
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    // ========== 2. VERIFICAR QUE ES ADMIN ==========
    const esAdmin = await (0, helpers_1.isAdmin)(request.auth.uid);
    if (!esAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden aprobar recargas');
    }
    const data = request.data;
    const { requestId, paymentMethod, paymentReference } = data;
    console.log("🔥 Aprobando recarga:", requestId);
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
            const userRef = db.collection('USUARIOS').doc(requestData.userId);
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
        console.log("✅ Recarga aprobada exitosamente");
        return result;
    }
    catch (error) {
        console.error("❌ Error:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=approveRecharge.js.map
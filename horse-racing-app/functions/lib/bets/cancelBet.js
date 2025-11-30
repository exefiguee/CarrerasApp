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
exports.cancelBet = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const helpers_1 = require("./helpers");
const db = admin.firestore();
/**
 * 🔥 CANCELAR APUESTA - CON SEGURIDAD COMPLETA
 */
exports.cancelBet = functions.https.onCall(async (request) => {
    // ========== 1. VERIFICAR AUTENTICACIÓN ==========
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    const userId = request.auth.uid;
    const data = request.data;
    const { betId } = data;
    console.log("🔥 Cancelando apuesta:", betId, "Usuario:", userId);
    try {
        // ========== 2. VALIDAR CANCELACIÓN ==========
        const validation = await (0, helpers_1.validateBetCancellation)(betId, userId);
        if (!validation.valid) {
            throw new functions.https.HttpsError('failed-precondition', validation.error);
        }
        const betData = validation.betData;
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
    }
    catch (error) {
        console.error("❌ ERROR:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Error al cancelar apuesta');
    }
});
//# sourceMappingURL=cancelBet.js.map
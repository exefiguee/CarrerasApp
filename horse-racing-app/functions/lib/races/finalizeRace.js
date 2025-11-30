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
exports.finalizeRace = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const helpers_1 = require("../bets/helpers");
const db = admin.firestore();
/**
 * 🔥 Finalizar una carrera y liquidar apuestas (Solo Admin)
 */
exports.finalizeRace = functions.https.onCall(async (request) => {
    var _a, _b;
    // ========== 1. VERIFICAR AUTENTICACIÓN ==========
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    // ========== 2. VERIFICAR QUE ES ADMIN ==========
    const esAdmin = await (0, helpers_1.isAdmin)(request.auth.uid);
    if (!esAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden finalizar carreras');
    }
    const data = request.data;
    const { raceId, results } = data;
    if (!raceId || !results || !results.winner) {
        throw new functions.https.HttpsError('invalid-argument', 'Datos inválidos');
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
                    isWinner = ((_a = results.place) === null || _a === void 0 ? void 0 : _a.includes(betData.horseNumber)) || false;
                    break;
                case 'TERCERO':
                    isWinner = ((_b = results.show) === null || _b === void 0 ? void 0 : _b.includes(betData.horseNumber)) || false;
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
            }
            else {
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
    }
    catch (error) {
        console.error("❌ Error al finalizar carrera:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=finalizeRace.js.map
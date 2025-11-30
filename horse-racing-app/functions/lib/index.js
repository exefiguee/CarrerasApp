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
exports.getUserStats = exports.healthCheck = exports.adminCreateUser = exports.finalizeRace = exports.approveWithdrawal = exports.approveRecharge = exports.cancelBet = exports.createBet = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
// ========================================
// 🔥 INICIALIZAR FIREBASE ADMIN (UNA SOLA VEZ)
// ========================================
admin.initializeApp();
// ========================================
// 🔥 EXPORTAR MÓDULOS
// ========================================
// Apuestas
var bets_1 = require("./bets");
Object.defineProperty(exports, "createBet", { enumerable: true, get: function () { return bets_1.createBet; } });
Object.defineProperty(exports, "cancelBet", { enumerable: true, get: function () { return bets_1.cancelBet; } });
// Transacciones (Admin)
var transactions_1 = require("./transactions");
Object.defineProperty(exports, "approveRecharge", { enumerable: true, get: function () { return transactions_1.approveRecharge; } });
Object.defineProperty(exports, "approveWithdrawal", { enumerable: true, get: function () { return transactions_1.approveWithdrawal; } });
// Carreras (Admin)
var races_1 = require("./races");
Object.defineProperty(exports, "finalizeRace", { enumerable: true, get: function () { return races_1.finalizeRace; } });
// Admin
var admin_1 = require("./admin");
Object.defineProperty(exports, "adminCreateUser", { enumerable: true, get: function () { return admin_1.adminCreateUser; } });
// ========================================
// 🔥 FUNCIÓN DE HEALTH CHECK
// ========================================
exports.healthCheck = functions.https.onRequest((req, res) => {
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
exports.getUserStats = functions.https.onCall(async (request) => {
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
            }
            else if (bet.status === 'won') {
                wonBets++;
                totalWon += bet.payout || 0;
            }
            else if (bet.status === 'lost') {
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
    }
    catch (error) {
        console.error("❌ Error:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=index.js.map
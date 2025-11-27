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
exports.finalizeRace = exports.approveWithdrawal = exports.approveRecharge = exports.cancelBet = exports.createBet = exports.adminCreateUser = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
// Importar módulos
const bets_1 = require("./bets");
Object.defineProperty(exports, "createBet", { enumerable: true, get: function () { return bets_1.createBet; } });
Object.defineProperty(exports, "cancelBet", { enumerable: true, get: function () { return bets_1.cancelBet; } });
const transactions_1 = require("./transactions");
Object.defineProperty(exports, "approveRecharge", { enumerable: true, get: function () { return transactions_1.approveRecharge; } });
Object.defineProperty(exports, "approveWithdrawal", { enumerable: true, get: function () { return transactions_1.approveWithdrawal; } });
const races_1 = require("./races");
Object.defineProperty(exports, "finalizeRace", { enumerable: true, get: function () { return races_1.finalizeRace; } });
// Inicializar Firebase Admin
admin.initializeApp();
// ========== CREAR USUARIO (Solo Admin) ==========
exports.adminCreateUser = functions.https.onCall(async (request) => {
    var _a;
    // Verificar autenticación
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    const db = admin.firestore();
    // Verificar que es admin
    const adminRef = db.collection('users').doc(request.auth.uid);
    const adminDoc = await adminRef.get();
    if (!adminDoc.exists || ((_a = adminDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden crear usuarios');
    }
    const { email, password, name, initialBalance } = request.data;
    if (!email || !password || !name) {
        throw new functions.https.HttpsError('invalid-argument', 'Faltan datos requeridos');
    }
    try {
        // Crear usuario en Authentication
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });
        // Crear documento en Firestore
        await db.collection('users').doc(userRecord.uid).set({
            email,
            name,
            balance: initialBalance || 0,
            role: 'user',
            totalBet: 0,
            totalWon: 0,
            totalLost: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: request.auth.uid,
        });
        return {
            success: true,
            userId: userRecord.uid,
            email,
            name,
            password, // Devolver password para que el admin lo envíe
            initialBalance: initialBalance || 0,
        };
    }
    catch (error) {
        console.error('Error creando usuario:', error);
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'El email ya está registrado');
        }
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=index.js.map
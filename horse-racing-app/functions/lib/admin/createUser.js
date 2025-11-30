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
exports.adminCreateUser = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const helpers_1 = require("../bets/helpers");
const db = admin.firestore();
/**
 * 🔥 CREAR USUARIO (Solo Admin)
 */
exports.adminCreateUser = functions.https.onCall(async (request) => {
    // ========== 1. VERIFICAR AUTENTICACIÓN ==========
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    // ========== 2. VERIFICAR QUE ES ADMIN ==========
    const esAdmin = await (0, helpers_1.isAdmin)(request.auth.uid);
    if (!esAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden crear usuarios');
    }
    const data = request.data;
    const { email, password, name, initialBalance } = data;
    if (!email || !password || !name) {
        throw new functions.https.HttpsError('invalid-argument', 'Faltan datos requeridos');
    }
    console.log("🔥 Creando usuario:", email);
    try {
        // Crear usuario en Authentication
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });
        // Crear documento en Firestore
        await db.collection('USUARIOS').doc(userRecord.uid).set({
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
        console.log("✅ Usuario creado:", userRecord.uid);
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
        console.error("❌ Error creando usuario:", error);
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'El email ya está registrado');
        }
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=createUser.js.map
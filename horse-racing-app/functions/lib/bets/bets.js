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
exports.cancelBet = exports.createBet = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * 🔥 CREAR APUESTA - ULTRA SIMPLE
 */
exports.createBet = functions.https.onCall(async (request) => {
    const db = admin.firestore();
    console.log("🔥 INICIO");
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debes iniciar sesión');
    }
    const userId = request.auth.uid;
    const data = request.data;
    console.log("User:", userId);
    console.log("Amount:", data.amount);
    console.log("BetType:", data.betType);
    try {
        // 1. Obtener usuario
        const userRef = db.collection('USUARIOS').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new Error('Usuario no encontrado');
        }
        const userData = userDoc.data();
        const currentBalance = userData.balance || 0;
        console.log("Balance:", currentBalance);
        if (currentBalance < data.amount) {
            throw new Error('Saldo insuficiente');
        }
        const timestamp = admin.firestore.Timestamp.now();
        // 2. Crear bet simple
        const betRef = db.collection('bets').doc();
        // 🔥 CONSTRUIR OBJETO SIN UNDEFINED
        const simpleBet = {
            userId,
            raceId: data.raceId || '',
            amount: data.amount,
            betType: data.betType,
            status: 'pending',
            createdAt: timestamp,
            odds: 2.0,
        };
        // 🔥 SOLO AGREGAR SI EXISTE
        if (data.horseNumber !== undefined && data.horseNumber !== null) {
            simpleBet.horseNumber = data.horseNumber;
        }
        if (data.seleccionados && data.seleccionados.length > 0) {
            simpleBet.selectedHorses = data.seleccionados;
        }
        await betRef.set(simpleBet);
        console.log("✅ Bet guardado:", betRef.id);
        // 3. Crear APUESTAS_GLOBAL
        const globalBetRef = db.collection('APUESTAS_GLOBAL').doc();
        const globalBet = {
            apuestaId: betRef.id,
            usuarioId: userId,
            usuario: {
                id: userId,
                email: userData.email || '',
            },
            tipoApuesta: {
                tipo: data.betType,
                label: data.betType,
                descripcion: data.betType,
            },
            seleccionados: data.seleccionados || [],
            texto: data.texto || '',
            carrera: data.carrera || {
                id: data.raceId || '',
                numero: 0,
            },
            hipodromo: data.hipodromo || { nombre: 'PALERMO' },
            montos: {
                montoTotal: data.amount,
                montoPorCombinacion: data.montoPorCombinacion || data.amount,
                numeroCombinaciones: data.numeroCombinaciones || 1,
            },
            estado: 'PENDIENTE',
            timestamps: {
                creacion: timestamp,
            },
        };
        await globalBetRef.set(globalBet);
        console.log("✅ APUESTAS_GLOBAL guardado:", globalBetRef.id);
        // 4. Actualizar saldo
        const newBalance = currentBalance - data.amount;
        await userRef.update({ balance: newBalance });
        console.log("✅ Saldo actualizado:", newBalance);
        // 5. Crear transacción
        await db.collection('transactions').add({
            userId,
            type: 'bet',
            amount: -data.amount,
            betId: betRef.id,
            createdAt: timestamp,
            status: 'completed',
        });
        console.log("✅ Transacción creada");
        console.log("🎉 ÉXITO TOTAL");
        return {
            success: true,
            betId: betRef.id,
            globalBetId: globalBetRef.id,
            newBalance: newBalance,
        };
    }
    catch (error) {
        console.error("❌ ERROR:", error.message);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * 🔥 CANCELAR APUESTA
 */
exports.cancelBet = functions.https.onCall(async (request) => {
    const db = admin.firestore();
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    const userId = request.auth.uid;
    const { betId } = request.data;
    try {
        const betRef = db.collection('bets').doc(betId);
        const betDoc = await betRef.get();
        if (!betDoc.exists) {
            throw new Error('Apuesta no encontrada');
        }
        const betData = betDoc.data();
        if (betData.userId !== userId) {
            throw new Error('No autorizado');
        }
        if (betData.status !== 'pending') {
            throw new Error('No se puede cancelar');
        }
        // Devolver dinero
        const userRef = db.collection('USUARIOS').doc(userId);
        const userDoc = await userRef.get();
        const currentBalance = userDoc.data().balance || 0;
        await userRef.update({ balance: currentBalance + betData.amount });
        // Cancelar bet
        await betRef.update({
            status: 'cancelled',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=bets.js.map
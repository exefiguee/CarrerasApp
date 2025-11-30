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
exports.validateUserBalance = validateUserBalance;
exports.validateRace = validateRace;
exports.validateBetAmount = validateBetAmount;
exports.validateHorseSelection = validateHorseSelection;
exports.validateBetCancellation = validateBetCancellation;
exports.isAdmin = isAdmin;
exports.cleanFirestoreData = cleanFirestoreData;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * 🔒 Validar que el usuario tenga saldo suficiente
 */
async function validateUserBalance(userId, amount) {
    try {
        const userDoc = await db.collection('USUARIOS').doc(userId).get();
        if (!userDoc.exists) {
            return {
                valid: false,
                currentBalance: 0,
                error: 'Usuario no encontrado'
            };
        }
        const userData = userDoc.data();
        const currentBalance = userData.balance || 0;
        if (currentBalance < amount) {
            return {
                valid: false,
                currentBalance,
                error: `Saldo insuficiente. Tenés $${currentBalance}, necesitás $${amount}`
            };
        }
        return { valid: true, currentBalance };
    }
    catch (error) {
        console.error("❌ Error validando saldo:", error);
        return {
            valid: false,
            currentBalance: 0,
            error: 'Error al validar saldo'
        };
    }
}
/**
 * 🔒 Validar que la carrera exista y esté disponible
 */
async function validateRace(raceId) {
    try {
        if (!raceId) {
            return { valid: false, error: 'ID de carrera no especificado' };
        }
        const raceDoc = await db.collection('carreras1').doc(raceId).get();
        if (!raceDoc.exists) {
            return { valid: false, error: 'Carrera no encontrada' };
        }
        const raceData = raceDoc.data();
        // Verificar si la carrera ya finalizó
        if (raceData.estado === 'FINALIZADA') {
            return {
                valid: false,
                error: 'La carrera ya finalizó, no se pueden hacer más apuestas'
            };
        }
        // Verificar si la carrera está en curso
        if (raceData.estado === 'EN_CURSO') {
            return {
                valid: false,
                error: 'La carrera ya comenzó, no se pueden hacer más apuestas'
            };
        }
        return { valid: true, raceData };
    }
    catch (error) {
        console.error("❌ Error validando carrera:", error);
        return { valid: false, error: 'Error al validar carrera' };
    }
}
/**
 * 🔒 Validar montos mínimos y máximos
 */
function validateBetAmount(amount, minAmount = 200, maxAmount = 500000) {
    if (amount <= 0) {
        return { valid: false, error: 'El monto debe ser mayor a 0' };
    }
    if (amount < minAmount) {
        return {
            valid: false,
            error: `El monto mínimo es $${minAmount}`
        };
    }
    if (amount > maxAmount) {
        return {
            valid: false,
            error: `El monto máximo es $${maxAmount}`
        };
    }
    return { valid: true };
}
/**
 * 🔒 Validar selección de caballos
 */
function validateHorseSelection(horses) {
    if (!horses || horses.length === 0) {
        return {
            valid: false,
            error: 'Debes seleccionar al menos un caballo'
        };
    }
    // Verificar que los números sean válidos
    for (const horse of horses) {
        const numero = horse.numero || horse.number;
        if (!numero || numero < 1) {
            return {
                valid: false,
                error: `Número de caballo inválido: ${numero}`
            };
        }
    }
    return { valid: true };
}
/**
 * 🔒 Validar que el usuario pueda cancelar la apuesta
 */
async function validateBetCancellation(betId, userId) {
    try {
        const betDoc = await db.collection('bets').doc(betId).get();
        if (!betDoc.exists) {
            return {
                valid: false,
                error: 'Apuesta no encontrada'
            };
        }
        const betData = betDoc.data();
        // Verificar que sea el dueño
        if (betData.userId !== userId) {
            return {
                valid: false,
                error: 'No tenés permiso para cancelar esta apuesta'
            };
        }
        // Verificar que esté pendiente
        if (betData.status !== 'pending') {
            return {
                valid: false,
                error: `No se puede cancelar una apuesta con estado: ${betData.status}`
            };
        }
        // Verificar que la carrera no haya comenzado
        if (betData.raceId) {
            const raceValidation = await validateRace(betData.raceId);
            if (!raceValidation.valid) {
                return {
                    valid: false,
                    error: 'La carrera ya comenzó, no se puede cancelar'
                };
            }
        }
        return { valid: true, betData };
    }
    catch (error) {
        console.error("❌ Error validando cancelación:", error);
        return {
            valid: false,
            error: 'Error al validar cancelación'
        };
    }
}
/**
 * 🔒 Verificar que el usuario es admin
 */
async function isAdmin(userId) {
    try {
        const userDoc = await db.collection('USUARIOS').doc(userId).get();
        if (!userDoc.exists) {
            return false;
        }
        const userData = userDoc.data();
        return userData.role === 'admin';
    }
    catch (error) {
        console.error("❌ Error verificando admin:", error);
        return false;
    }
}
/**
 * 🔒 Limpiar datos para Firestore (eliminar undefined)
 */
function cleanFirestoreData(obj) {
    if (obj === null || obj === undefined)
        return null;
    if (Array.isArray(obj)) {
        return obj
            .map(item => cleanFirestoreData(item))
            .filter(item => item !== null);
    }
    if (typeof obj === 'object' && obj.constructor === Object) {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                const cleanedValue = cleanFirestoreData(value);
                if (cleanedValue !== null || value === null) {
                    cleaned[key] = cleanedValue;
                }
            }
        }
        return cleaned;
    }
    return obj;
}
//# sourceMappingURL=helpers.js.map
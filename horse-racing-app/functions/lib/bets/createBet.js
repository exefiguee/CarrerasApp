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
exports.createBet = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const helpers_1 = require("./helpers");
const db = admin.firestore();
/**
 * 🔥 CREAR APUESTA - CON SEGURIDAD COMPLETA
 */
exports.createBet = functions.https.onCall(async (request) => {
    // ========== 1. VERIFICAR AUTENTICACIÓN ==========
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debes iniciar sesión para realizar una apuesta');
    }
    const userId = request.auth.uid;
    const data = request.data;
    console.log("🔥 Creando apuesta para:", userId);
    console.log("📦 Datos recibidos:", {
        amount: data.amount,
        betType: data.betType,
        raceId: data.raceId,
    });
    try {
        // ========== 2. VALIDACIONES ==========
        // Validar monto
        const amountValidation = (0, helpers_1.validateBetAmount)(data.amount);
        if (!amountValidation.valid) {
            throw new functions.https.HttpsError('invalid-argument', amountValidation.error);
        }
        // Validar caballos
        if (data.seleccionados) {
            const horsesValidation = (0, helpers_1.validateHorseSelection)(data.seleccionados);
            if (!horsesValidation.valid) {
                throw new functions.https.HttpsError('invalid-argument', horsesValidation.error);
            }
        }
        // Validar carrera
        const raceValidation = await (0, helpers_1.validateRace)(data.raceId);
        if (!raceValidation.valid) {
            throw new functions.https.HttpsError('failed-precondition', raceValidation.error);
        }
        // Validar saldo
        const balanceValidation = await (0, helpers_1.validateUserBalance)(userId, data.amount);
        if (!balanceValidation.valid) {
            throw new functions.https.HttpsError('failed-precondition', balanceValidation.error);
        }
        console.log("✅ Todas las validaciones pasadas");
        console.log("💰 Saldo actual:", balanceValidation.currentBalance);
        // ========== 3. USAR TRANSACCIÓN ATÓMICA ==========
        const result = await db.runTransaction(async (transaction) => {
            var _a, _b, _c, _d, _e;
            const timestamp = admin.firestore.Timestamp.now();
            const now = new Date();
            // Referencias
            const userRef = db.collection('USUARIOS').doc(userId);
            const betRef = db.collection('bets').doc();
            const globalBetRef = db.collection('APUESTAS_GLOBAL').doc();
            const transactionRef = db.collection('transactions').doc();
            const betId = betRef.id;
            const globalBetId = globalBetRef.id;
            // ========== 4. CREAR BET SIMPLE ==========
            const simpleBet = {
                userId,
                raceId: data.raceId,
                amount: data.amount,
                betType: data.betType,
                status: 'pending',
                createdAt: timestamp,
                odds: 2.0,
            };
            if (data.horseNumber) {
                simpleBet.horseNumber = data.horseNumber;
            }
            if (data.seleccionados && data.seleccionados.length > 0) {
                simpleBet.selectedHorses = data.seleccionados;
            }
            transaction.set(betRef, (0, helpers_1.cleanFirestoreData)(simpleBet));
            console.log("✅ Bet creado:", betId);
            // ========== 5. CREAR APUESTA GLOBAL ==========
            // ========== 5. CREAR APUESTA GLOBAL ==========
            // 🔧 Guardar auth para TypeScript
            const userEmail = ((_b = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.token) === null || _b === void 0 ? void 0 : _b.email) || '';
            const userName = ((_d = (_c = request.auth) === null || _c === void 0 ? void 0 : _c.token) === null || _d === void 0 ? void 0 : _d.name) || 'Usuario';
            const globalBet = {
                apuestaId: betId,
                usuarioId: userId,
                usuario: {
                    id: userId,
                    email: userEmail,
                    nombre: userName,
                },
                tipoApuesta: {
                    tipo: data.betType,
                    label: data.betType,
                    descripcion: data.betType,
                    modoSeleccion: data.esApuestaMultiCarrera ? 'grouped-races' : 'single',
                },
                esApuestaMultiCarrera: data.esApuestaMultiCarrera || false,
                esApuestaAgrupada: data.esApuestaAgrupada || false,
                seleccionados: data.seleccionados || [],
                texto: data.texto || '',
                carrera: data.carrera || {
                    id: data.raceId,
                    numero: 0,
                    fecha: now.toISOString().split('T')[0],
                    hora: now.toTimeString().split(' ')[0],
                },
                hipodromo: data.hipodromo || {
                    id: data.raceId,
                    nombre: 'PALERMO',
                },
                montos: {
                    montoTotal: data.amount,
                    montoPorCombinacion: data.montoPorCombinacion || data.amount,
                    numeroCombinaciones: data.numeroCombinaciones || 1,
                    apuestaMinima: 200,
                    apuestaMaxima: 500000,
                    dividendo: data.dividendo || 100,
                    gananciaPotencial: data.amount * 2,
                    usaVales: data.usaVales || false,
                    valesApostados: data.valesApostados || 0,
                },
                estado: 'PENDIENTE',
                estadoDetallado: {
                    estado: 'PENDIENTE',
                    mensaje: 'Esperando resultado de la carrera',
                    fechaUltimaActualizacion: timestamp,
                },
                resultado: {
                    esGanadora: false,
                    gananciaReal: 0,
                    fechaResolucion: null,
                },
                timestamps: {
                    creacion: timestamp,
                    creacionISO: now.toISOString(),
                    unix: Date.now(),
                },
                metadata: {
                    app: 'HorseRacingApp',
                    version: '2.0',
                    platform: 'cloud-function',
                },
            };
            // Agregar campos opcionales
            if (data.horseNumber) {
                globalBet.caballos = { numero: data.horseNumber };
            }
            if (data.detalleGrupos) {
                globalBet.detalleGrupos = data.detalleGrupos;
            }
            if (data.carreraMetadata) {
                globalBet.carreraMetadata = data.carreraMetadata;
            }
            transaction.set(globalBetRef, (0, helpers_1.cleanFirestoreData)(globalBet));
            console.log("✅ APUESTAS_GLOBAL creado:", globalBetId);
            // ========== 6. ACTUALIZAR SALDO ==========
            transaction.update(userRef, {
                balance: admin.firestore.FieldValue.increment(-data.amount),
                totalBet: admin.firestore.FieldValue.increment(data.amount),
                lastBetAt: timestamp,
            });
            console.log("✅ Saldo actualizado");
            // ========== 7. CREAR TRANSACCIÓN ==========
            const transactionData = {
                userId,
                type: 'bet',
                amount: -data.amount,
                betId: betId,
                globalBetId: globalBetId,
                raceId: data.raceId,
                description: `Apuesta ${data.betType} - ${data.texto || ''}`,
                createdAt: timestamp,
                status: 'completed',
                metadata: {
                    betType: data.betType,
                    horses: ((_e = data.seleccionados) === null || _e === void 0 ? void 0 : _e.map((h) => h.numero || h.number)) || [],
                },
            };
            transaction.set(transactionRef, (0, helpers_1.cleanFirestoreData)(transactionData));
            console.log("✅ Transacción creada");
            // Calcular nuevo saldo
            const newBalance = balanceValidation.currentBalance - data.amount;
            return {
                success: true,
                betId: betId,
                globalBetId: globalBetId,
                newBalance: newBalance,
                transactionId: transactionRef.id,
            };
        });
        console.log("🎉 TODO GUARDADO EXITOSAMENTE");
        return result;
    }
    catch (error) {
        console.error("❌ ERROR:", error);
        // Si es un error de Firebase Functions, lo dejamos pasar
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Otros errores los convertimos
        throw new functions.https.HttpsError('internal', error.message || 'Error al crear apuesta');
    }
});
//# sourceMappingURL=createBet.js.map
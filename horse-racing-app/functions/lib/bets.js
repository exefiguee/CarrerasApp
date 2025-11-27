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
 * Crear una apuesta (Compatible con sistema complejo)
 */
exports.createBet = functions.https.onCall(async (request) => {
    const db = admin.firestore();
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debes estar autenticado para apostar');
    }
    const userId = request.auth.uid;
    const data = request.data;
    // Validaciones básicas
    if (!data.amount || data.amount <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Monto inválido');
    }
    if (data.amount > 100000) {
        throw new functions.https.HttpsError('invalid-argument', 'Monto máximo: $100,000');
    }
    try {
        const result = await db.runTransaction(async (transaction) => {
            var _a;
            // 1. Obtener usuario
            const userRef = db.collection('users').doc(userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error('Usuario no encontrado');
            }
            const userData = userDoc.data();
            const currentBalance = userData.balance || 0;
            // 2. Verificar balance
            if (currentBalance < data.amount) {
                throw new Error('Saldo insuficiente');
            }
            // 3. Verificar que la carrera existe (si aplica)
            if (data.raceId) {
                const raceRef = db.collection('races').doc(data.raceId);
                const raceDoc = await transaction.get(raceRef);
                if (raceDoc.exists) {
                    const raceData = raceDoc.data();
                    if (raceData.status === 'finished') {
                        throw new Error('La carrera ya finalizó');
                    }
                    // Verificar tiempo de cierre
                    const now = admin.firestore.Timestamp.now();
                    if (raceData.startTime && raceData.startTime.toMillis() <= now.toMillis()) {
                        throw new Error('La carrera ya comenzó');
                    }
                }
            }
            const timestamp = admin.firestore.Timestamp.now();
            // 4. Crear apuesta en colección "bets" (simple)
            const betRef = db.collection('bets').doc();
            const simpleBet = {
                userId,
                raceId: data.raceId,
                horseNumber: data.horseNumber,
                amount: data.amount,
                betType: data.betType,
                status: 'pending',
                createdAt: timestamp,
                odds: 1.0
            };
            transaction.set(betRef, simpleBet);
            // 5. Crear apuesta en "APUESTAS_GLOBAL" (detallada)
            const globalBetRef = db.collection('APUESTAS_GLOBAL').doc();
            const globalBet = {
                apuestaId: betRef.id,
                usuarioId: userId,
                // Usuario info
                usuario: {
                    id: userId,
                    email: userData.email || '',
                },
                // Tipo de apuesta
                tipoApuesta: {
                    tipo: data.betType,
                    label: data.betType,
                    descripcion: getDescripcionTipoApuesta(data.betType),
                    modoSeleccion: data.esApuestaMultiCarrera ? 'grouped-races' : 'single',
                },
                // Estructura de apuesta
                esApuestaMultiCarrera: data.esApuestaMultiCarrera || false,
                esApuestaAgrupada: data.esApuestaAgrupada || false,
                // Caballos seleccionados
                caballos: data.esApuestaMultiCarrera
                    ? { cantidad: ((_a = data.seleccionados) === null || _a === void 0 ? void 0 : _a.length) || 0 }
                    : { numero: data.horseNumber },
                seleccionados: data.seleccionados || [],
                detalleGrupos: data.detalleGrupos || {},
                texto: data.texto || '',
                // Carrera
                carrera: data.carrera || {
                    id: data.raceId,
                    numero: 0,
                    fecha: new Date().toISOString().split('T')[0],
                    hora: new Date().toTimeString().split(' ')[0],
                },
                hipodromo: data.hipodromo || { nombre: 'PALERMO' },
                carreraMetadata: data.carreraMetadata || {},
                // Montos
                montos: {
                    montoTotal: data.amount,
                    montoPorCombinacion: data.montoPorCombinacion || data.amount,
                    numeroCombinaciones: data.numeroCombinaciones || 1,
                    apuestaMinima: 200,
                    apuestaMaxima: 50000,
                    dividendo: data.dividendo || 100,
                    gananciaPotencial: data.amount * 2, // Ajustar según odds
                    usaVales: data.usaVales || false,
                    valesApostados: data.valesApostados || 0,
                },
                // Estado
                estado: 'PENDIENTE',
                estadoDetallado: {
                    estado: 'PENDIENTE',
                    mensaje: 'Esperando resultado de la carrera',
                    fechaUltimaActualizacion: timestamp,
                },
                // Resultado (inicialmente vacío)
                resultado: {
                    esGanadora: false,
                    gananciaReal: 0,
                    fechaResolucion: null,
                    posicionesFinales: null,
                },
                // Timestamps
                timestamps: {
                    creacion: timestamp,
                    creacionISO: new Date().toISOString(),
                    unix: Date.now(),
                },
                // Metadata
                metadata: {
                    app: 'HorseRacingApp',
                    version: '2.0',
                    dispositivo: 'CloudFunction',
                },
            };
            transaction.set(globalBetRef, globalBet);
            // 6. Descontar balance
            transaction.update(userRef, {
                balance: admin.firestore.FieldValue.increment(-data.amount),
                totalBet: admin.firestore.FieldValue.increment(data.amount),
            });
            // 7. Crear transacción
            const transactionRef = db.collection('transactions').doc();
            transaction.set(transactionRef, {
                userId,
                type: 'bet',
                amount: -data.amount,
                betId: betRef.id,
                globalBetId: globalBetRef.id,
                raceId: data.raceId,
                description: `Apuesta ${data.betType} - ${data.texto || ''}`,
                createdAt: timestamp,
                status: 'completed',
            });
            return {
                betId: betRef.id,
                globalBetId: globalBetRef.id,
                newBalance: currentBalance - data.amount,
            };
        });
        return Object.assign({ success: true }, result);
    }
    catch (error) {
        console.error('Error al crear apuesta:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Error al procesar la apuesta');
    }
});
/**
 * Obtener descripción del tipo de apuesta
 */
function getDescripcionTipoApuesta(tipo) {
    const descripciones = {
        'GANADOR': 'Acertar el caballo ganador',
        'PLACE': 'Caballo en los primeros 2 lugares',
        'SHOW': 'Caballo en los primeros 3 lugares',
        'EXACTA': 'Acertar primero y segundo en orden',
        'TRIFECTA': 'Acertar primero, segundo y tercero en orden',
        'DOBLE': 'Ganadores de 2 carreras consecutivas',
        'TRIPLE': 'Ganadores de 3 carreras consecutivas',
        'CUADRUPLE': 'Ganadores de 4 carreras',
        'QUINTUPLE': 'Ganadores de 5 carreras',
    };
    return descripciones[tipo] || 'Apuesta especial';
}
/**
 * Cancelar apuesta
 */
exports.cancelBet = functions.https.onCall(async (request) => {
    const db = admin.firestore();
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    const userId = request.auth.uid;
    const { betId } = request.data;
    try {
        const result = await db.runTransaction(async (transaction) => {
            const betRef = db.collection('bets').doc(betId);
            const betDoc = await transaction.get(betRef);
            if (!betDoc.exists) {
                throw new Error('Apuesta no encontrada');
            }
            const betData = betDoc.data();
            if (betData.userId !== userId) {
                throw new Error('No autorizado');
            }
            if (betData.status !== 'pending') {
                throw new Error('La apuesta no puede cancelarse');
            }
            // Buscar apuesta global
            const globalBetsQuery = await db.collection('APUESTAS_GLOBAL')
                .where('apuestaId', '==', betId)
                .limit(1)
                .get();
            // Devolver dinero
            const userRef = db.collection('users').doc(userId);
            transaction.update(userRef, {
                balance: admin.firestore.FieldValue.increment(betData.amount),
            });
            // Actualizar apuesta simple
            transaction.update(betRef, {
                status: 'cancelled',
                cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Actualizar apuesta global
            if (!globalBetsQuery.empty) {
                const globalBetDoc = globalBetsQuery.docs[0];
                transaction.update(globalBetDoc.ref, {
                    estado: 'CANCELADA',
                    'estadoDetallado.estado': 'CANCELADA',
                    'estadoDetallado.mensaje': 'Apuesta cancelada por el usuario',
                    'estadoDetallado.fechaUltimaActualizacion': admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            // Crear transacción de reembolso
            const transactionRef = db.collection('transactions').doc();
            transaction.set(transactionRef, {
                userId,
                type: 'refund',
                amount: betData.amount,
                betId,
                description: 'Reembolso por cancelación de apuesta',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'completed',
            });
            return { success: true };
        });
        return result;
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=bets.js.map
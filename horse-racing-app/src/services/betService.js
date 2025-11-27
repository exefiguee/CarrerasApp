import { db } from "../firebase/config";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  doc,
  collection,
  getDocs,
  Timestamp,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  increment,
  getDoc,
} from "firebase/firestore";

// Inicializar Functions
const functions = getFunctions();

// ✅ Función para limpiar valores undefined recursivamente
const cleanFirestoreData = (obj) => {
  if (obj === null || obj === undefined) return null;

  if (Array.isArray(obj)) {
    return obj
      .map((item) => cleanFirestoreData(item))
      .filter((item) => item !== null);
  }

  if (typeof obj === "object" && obj.constructor === Object) {
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
};

const betService = {
  // 🔥 CREAR APUESTA USANDO CLOUD FUNCTION (SEGURO)
  createBet: async (userId, betData, userSaldo) => {
    try {
      console.log("🎯 Iniciando creación de apuesta con Cloud Function...");
      console.log("📦 Datos recibidos:", betData);

      // ========== VALIDACIONES PREVIAS ==========
      if (userSaldo < betData.montoTotal) {
        throw new Error("Saldo insuficiente para realizar esta apuesta");
      }

      if (!betData.selectedHorses || betData.selectedHorses.length === 0) {
        throw new Error("Debes seleccionar al menos un caballo");
      }

      // ========== PREPARAR INFORMACIÓN DE CABALLOS ==========
      const caballosSeleccionados = betData.selectedHorses.map((horse) => ({
        numero: Number(horse.numero || horse.number) || 0,
        nombre: String(horse.nombre || horse.name || `Caballo ${horse.numero || horse.number}`),
        jockey: String(horse.jockey || ""),
        noCorre: Boolean(horse.noCorre || horse.scratched),
        scratched: Boolean(horse.noCorre || horse.scratched),
      }));

      // Generar texto descriptivo
      const caballosTexto = caballosSeleccionados
        .map((c) => `#${c.numero} ${c.nombre}`)
        .join(", ");

      console.log("✅ Caballos procesados:", caballosSeleccionados);

      // ========== CONSTRUIR DATOS PARA LA CLOUD FUNCTION ==========
      const functionData = {
        // Datos básicos
        raceId: String(betData.carreraId || ""),
        amount: Number(betData.montoTotal || betData.amount || 0),
        betType: String(betData.betType || "GANADOR"),
        
        // Apuestas múltiples
        esApuestaMultiCarrera: Boolean(betData.isGroupedRaces || betData.isMultiRace),
        esApuestaAgrupada: Boolean(betData.isGroupedPositions),
        numeroCombinaciones: Number(betData.combinaciones) || 1,
        montoPorCombinacion: Number(betData.amount) || 0,
        texto: caballosTexto,
        
        // Caballos seleccionados
        seleccionados: caballosSeleccionados,
        detalleGrupos: betData.caballosInfo || {},
        
        // Información de la carrera
        carrera: {
          id: String(betData.carreraId || ""),
          numero: Number(betData.numeroCarrera) || 0,
          fecha: String(betData.fecha || ""),
          hora: String(betData.hora || "00:00"),
          fechaTimestamp: betData.fecha ? new Date(`${betData.fecha} ${betData.hora || "12:00"}`).toISOString() : new Date().toISOString(),
        },
        
        // Hipódromo
        hipodromo: {
          id: String(betData.hipodromoId || betData.carreraId || ""),
          nombre: String(betData.hipodromoNombre || "Hipódromo desconocido"),
        },
        
        // Metadata de carrera
        carreraMetadata: betData.raceMetadata ? {
          totalCaballos: Number(betData.raceMetadata.totalHorses) || 0,
          distancia: String(betData.raceMetadata.distance || ""),
          tipo: String(betData.raceMetadata.type || ""),
          premio: String(betData.raceMetadata.prize || ""),
        } : {},
        
        // Sistema de vales
        usaVales: Boolean(betData.usesVales),
        valesApostados: Number(betData.valesApostados) || 0,
        dividendo: Number(betData.dividendo) || 100,
      };

      console.log("🔥 Llamando a Cloud Function createBet...");
      console.log("📤 Datos enviados:", functionData);

      // ========== LLAMAR A LA CLOUD FUNCTION ==========
      const createBetFunction = httpsCallable(functions, 'createBet');
      const result = await createBetFunction(functionData);

      console.log("✅ Respuesta de Cloud Function:", result.data);

      if (result.data.success) {
        return {
          success: true,
          apuestaId: result.data.betId,
          globalBetId: result.data.globalBetId,
          newBalance: result.data.newBalance,
          valesApostados: functionData.valesApostados,
          montoTotal: functionData.amount,
          mensaje: functionData.usaVales
            ? `Apuesta registrada - ${functionData.valesApostados} vales`
            : "Apuesta registrada exitosamente",
        };
      } else {
        throw new Error("Error en la Cloud Function");
      }

    } catch (error) {
      console.error("❌ Error al crear apuesta:", error);
      
      // Mensajes de error más amigables
      let errorMessage = error.message;
      
      if (error.code === 'unauthenticated') {
        errorMessage = "Debes iniciar sesión para apostar";
      } else if (error.code === 'permission-denied') {
        errorMessage = "No tienes permisos para realizar esta acción";
      } else if (error.message.includes('Saldo insuficiente')) {
        errorMessage = "Saldo insuficiente";
      } else if (error.message.includes('carrera')) {
        errorMessage = "Error con la información de la carrera";
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // 🔥 CANCELAR APUESTA USANDO CLOUD FUNCTION
  cancelBet: async (userId, apuestaId) => {
    try {
      console.log("🔥 Cancelando apuesta con Cloud Function:", apuestaId);

      const cancelBetFunction = httpsCallable(functions, 'cancelBet');
      const result = await cancelBetFunction({ betId: apuestaId });

      console.log("✅ Apuesta cancelada:", result.data);

      return {
        success: true,
        mensaje: "Apuesta cancelada y saldo reembolsado",
      };

    } catch (error) {
      console.error("❌ Error al cancelar apuesta:", error);
      
      let errorMessage = error.message;
      if (error.message.includes('no puede cancelarse')) {
        errorMessage = "Esta apuesta ya no puede cancelarse";
      } else if (error.message.includes('comenzó')) {
        errorMessage = "La carrera ya comenzó, no puedes cancelar";
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // 🔥 ESCUCHAR APUESTAS EN TIEMPO REAL
  listenToUserBets: (userId, callback) => {
    // Escuchar desde APUESTAS_GLOBAL filtrando por usuarioId
    const apuestasRef = collection(db, "APUESTAS_GLOBAL");
    const q = query(
      apuestasRef,
      orderBy("timestamps.creacion", "desc")
    );

    console.log("🔥 Iniciando listener de apuestas para:", userId);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const apuestas = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Filtrar solo las apuestas del usuario actual
          if (data.usuarioId === userId || data.usuario?.id === userId) {
            apuestas.push({
              id: doc.id,
              ...data,
            });
          }
        });

        console.log(`🔄 ${apuestas.length} apuestas actualizadas`);
        callback(apuestas);
      },
      (error) => {
        console.error("❌ Error en listener:", error);
        callback([]);
      }
    );

    return unsubscribe;
  },

  // 🔥 ESCUCHAR UNA APUESTA ESPECÍFICA
  listenToBet: (apuestaId, callback) => {
    // Buscar en APUESTAS_GLOBAL
    const apuestaRef = doc(db, "APUESTAS_GLOBAL", apuestaId);

    console.log("🔥 Escuchando apuesta:", apuestaId);

    const unsubscribe = onSnapshot(
      apuestaRef,
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() });
        } else {
          console.warn("⚠️ Apuesta no existe");
          callback(null);
        }
      },
      (error) => {
        console.error("❌ Error:", error);
        callback(null);
      }
    );

    return unsubscribe;
  },

  // 🔥 OBTENER TODAS LAS APUESTAS DEL USUARIO
  getUserBets: async (userId) => {
    try {
      const apuestasRef = collection(db, "APUESTAS_GLOBAL");
      const q = query(apuestasRef, orderBy("timestamps.creacion", "desc"));
      const snapshot = await getDocs(q);

      const apuestas = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filtrar solo las del usuario
        if (data.usuarioId === userId || data.usuario?.id === userId) {
          apuestas.push({
            id: doc.id,
            ...data,
          });
        }
      });

      return apuestas;
    } catch (error) {
      console.error("❌ Error al obtener apuestas:", error);
      return [];
    }
  },

  // 🔥 VALIDAR APUESTA
  validateBet: (betData, userSaldo) => {
    const errors = [];

    const montoTotal = betData.montoTotal || betData.amount || 0;

    if (montoTotal < 200) {
      errors.push("El monto mínimo de apuesta es $200");
    }

    if (montoTotal > 500000) {
      errors.push("El monto máximo de apuesta es $500,000");
    }

    if (userSaldo < montoTotal) {
      errors.push(`Saldo insuficiente. Necesitas $${montoTotal.toLocaleString("es-AR")}`);
    }

    if (!betData.selectedHorses || betData.selectedHorses.length === 0) {
      errors.push("Debes seleccionar al menos un caballo");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // 🔥 ACTUALIZAR ESTADO DE APUESTA (Solo Admin - via Cloud Function)
  updateBetStatus: async (apuestaId, nuevoEstado, gananciaReal = 0) => {
    try {
      console.log("🔥 Actualizando estado de apuesta:", apuestaId, nuevoEstado);

      // Esta función debería llamar a una Cloud Function de admin
      // Por ahora, actualizamos directamente (solo para testing)
      const apuestaRef = doc(db, "APUESTAS_GLOBAL", apuestaId);

      const updateData = {
        estado: nuevoEstado,
        "estadoDetallado.estado": nuevoEstado,
        "estadoDetallado.fechaUltimaActualizacion": Timestamp.now(),
        "resultado.fechaResolucion": Timestamp.now(),
      };

      if (nuevoEstado === "GANADA" && gananciaReal > 0) {
        updateData["resultado.gananciaReal"] = gananciaReal;
        updateData["resultado.esGanadora"] = true;
        updateData["estadoDetallado.mensaje"] = `¡Ganaste $${gananciaReal}!`;
      } else if (nuevoEstado === "PERDIDA") {
        updateData["resultado.esGanadora"] = false;
        updateData["estadoDetallado.mensaje"] = "Apuesta perdida";
      }

      await updateDoc(apuestaRef, updateData);

      console.log(`✅ Estado actualizado a: ${nuevoEstado}`);

      return {
        success: true,
        mensaje: `Apuesta ${nuevoEstado.toLowerCase()}`,
      };
    } catch (error) {
      console.error("❌ Error al actualizar estado:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // 🔥 ESTADÍSTICAS DEL USUARIO
  getUserBetStats: async (userId) => {
    try {
      const apuestas = await betService.getUserBets(userId);

      const stats = {
        total: apuestas.length,
        pendientes: apuestas.filter((a) => a.estado === "PENDIENTE").length,
        ganadas: apuestas.filter((a) => a.estado === "GANADA").length,
        perdidas: apuestas.filter((a) => a.estado === "PERDIDA").length,
        canceladas: apuestas.filter((a) => a.estado === "CANCELADA").length,
        
        totalApostado: apuestas.reduce(
          (sum, a) => sum + (a.montos?.montoTotal || 0),
          0
        ),
        totalGanado: apuestas
          .filter((a) => a.estado === "GANADA")
          .reduce((sum, a) => sum + (a.resultado?.gananciaReal || 0), 0),
        totalValesApostados: apuestas.reduce(
          (sum, a) => sum + (a.montos?.valesApostados || 0),
          0
        ),
        
        // Balance neto
        balanceNeto: function() {
          return this.totalGanado - this.totalApostado;
        }(),
      };

      return stats;
    } catch (error) {
      console.error("❌ Error en estadísticas:", error);
      return null;
    }
  },

  // 🔥 OBTENER APUESTAS POR ESTADO
  getBetsByStatus: async (userId, estado) => {
    try {
      const allBets = await betService.getUserBets(userId);
      return allBets.filter((bet) => bet.estado === estado);
    } catch (error) {
      console.error("❌ Error al filtrar apuestas:", error);
      return [];
    }
  },

  // 🔥 OBTENER APUESTAS DE HOY
  getTodayBets: async (userId) => {
    try {
      const allBets = await betService.getUserBets(userId);
      const today = new Date().toISOString().split('T')[0];
      
      return allBets.filter((bet) => {
        const betDate = bet.carrera?.fecha || "";
        return betDate === today;
      });
    } catch (error) {
      console.error("❌ Error al obtener apuestas de hoy:", error);
      return [];
    }
  },

  // 🔥 OBTENER ÚLTIMA APUESTA
  getLastBet: async (userId) => {
    try {
      const bets = await betService.getUserBets(userId);
      return bets.length > 0 ? bets[0] : null;
    } catch (error) {
      console.error("❌ Error al obtener última apuesta:", error);
      return null;
    }
  },

  // 🔥 VERIFICAR SI PUEDE APOSTAR
  canPlaceBet: async (userId, amount) => {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { can: false, reason: "Usuario no encontrado" };
      }

      const userData = userDoc.data();
      const balance = userData.balance || 0;

      if (balance < amount) {
        return { 
          can: false, 
          reason: "Saldo insuficiente",
          balance,
          needed: amount,
        };
      }

      return { can: true, balance };
    } catch (error) {
      console.error("❌ Error al verificar si puede apostar:", error);
      return { can: false, reason: "Error al verificar saldo" };
    }
  },
};

export default betService;
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../firebase/config";
import {
  collection,
  getDocs,
  Timestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";

// 🔥 Inicializar Functions
const functions = getFunctions();

const betService = {
  // 🔥 CREAR APUESTA - USANDO CLOUD FUNCTION
  createBet: async (userId, betData, userSaldo) => {
    try {
      console.log("🎯 Llamando a Cloud Function createBet...");
      console.log("📦 Datos a enviar:", betData);

      // ========== PREPARAR DATOS PARA LA CLOUD FUNCTION ==========
      const functionData = {
        raceId: String(betData.carreraId || ""),
        amount: Number(betData.amount || 0),
        betType: String(betData.betType || "GANADOR"),
        
        // Caballos seleccionados
        seleccionados: betData.selectedHorses || [],
        
        // Información de multi-carrera o agrupada
        esApuestaMultiCarrera: Boolean(betData.isMultiRace),
        esApuestaAgrupada: Boolean(betData.isGroupedPositions),
        
        // Grupos de caballos (para EXACTA, IMPERFECTA, DOBLE, etc)
        detalleGrupos: betData.caballosInfo || null,
        
        // Combinaciones y montos
        numeroCombinaciones: Number(betData.combinaciones || 1),
        montoPorCombinacion: Number(betData.amount || 0),
        texto: betData.selectedHorses?.map(h => `#${h.numero || h.number} ${h.nombre || h.name}`).join(", ") || "",
        
        // Información de la carrera
        carrera: {
          id: String(betData.carreraId || ""),
          numero: Number(betData.numeroCarrera || 0),
          fecha: String(betData.fecha || new Date().toISOString().split('T')[0]),
          hora: String(betData.hora || "00:00"),
        },
        
        // Información del hipódromo
        hipodromo: {
          id: String(betData.hipodromoId || betData.carreraId || ""),
          nombre: String(betData.hipodromoNombre || "Hipódromo"),
        },
        
        // Metadata de la carrera
        carreraMetadata: betData.raceMetadata || null,
        
        // Vales (si aplica)
        usaVales: Boolean(betData.usesVales),
        valesApostados: Number(betData.valesApostados || 0),
        dividendo: Number(betData.dividendo || 0),
      };

      console.log("📤 Enviando a Cloud Function:", functionData);

      // ========== LLAMAR A LA CLOUD FUNCTION ==========
      const createBetFunction = httpsCallable(functions, "createBet");
      const result = await createBetFunction(functionData);

      console.log("✅ Respuesta de Cloud Function:", result.data);

      return {
        success: true,
        apuestaId: result.data.betId,
        globalBetId: result.data.globalBetId,
        newBalance: result.data.newBalance,
        transactionId: result.data.transactionId,
        valesApostados: betData.valesApostados || 0,
        montoTotal: betData.montoTotal,
        mensaje: betData.usesVales
          ? `Apuesta registrada - ${betData.valesApostados} vales`
          : "Apuesta registrada exitosamente",
      };

    } catch (error) {
      console.error("❌ Error al crear apuesta:", error);
      
      // Extraer mensaje de error de Cloud Functions
      let errorMessage = "Error al crear apuesta";
      if (error.code) {
        errorMessage = `[${error.code}] ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // 🔥 CANCELAR APUESTA - USANDO CLOUD FUNCTION
  cancelBet: async (userId, apuestaId) => {
    try {
      console.log("🔥 Llamando a Cloud Function cancelBet...");

      const cancelBetFunction = httpsCallable(functions, "cancelBet");
      const result = await cancelBetFunction({ betId: apuestaId });

      console.log("✅ Apuesta cancelada:", result.data);

      return {
        success: true,
        mensaje: "Apuesta cancelada exitosamente",
      };

    } catch (error) {
      console.error("❌ Error al cancelar:", error);
      
      let errorMessage = "Error al cancelar apuesta";
      if (error.code) {
        errorMessage = `[${error.code}] ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // 🔥 ESCUCHAR APUESTAS EN TIEMPO REAL (SIN CAMBIOS)
  listenToUserBets: (userId, callback) => {
    const apuestasRef = collection(db, "APUESTAS_GLOBAL");
    const q = query(apuestasRef, orderBy("timestamps.creacion", "desc"));

    console.log("🔥 Escuchando apuestas de:", userId);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const apuestas = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.usuarioId === userId || data.usuario?.id === userId) {
            apuestas.push({
              id: doc.id,
              ...data,
            });
          }
        });
        console.log(`🔄 ${apuestas.length} apuestas`);
        callback(apuestas);
      },
      (error) => {
        console.error("❌ Error en listener:", error);
        callback([]);
      }
    );

    return unsubscribe;
  },

  // 🔥 OBTENER APUESTAS DEL USUARIO (SIN CAMBIOS)
  getUserBets: async (userId) => {
    try {
      const apuestasRef = collection(db, "APUESTAS_GLOBAL");
      const q = query(apuestasRef, orderBy("timestamps.creacion", "desc"));
      const snapshot = await getDocs(q);

      const apuestas = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.usuarioId === userId || data.usuario?.id === userId) {
          apuestas.push({
            id: doc.id,
            ...data,
          });
        }
      });

      return apuestas;
    } catch (error) {
      console.error("❌ Error:", error);
      return [];
    }
  },

  // 🔥 VALIDACIÓN MÍNIMA (SIN CAMBIOS)
  validateBet: (betData, userSaldo) => {
    const errors = [];
    const montoTotal = betData.montoTotal || betData.amount || 0;

    if (montoTotal < 1) {
      errors.push("El monto debe ser mayor a 0");
    }

    if (!betData.selectedHorses || betData.selectedHorses.length === 0) {
      errors.push("Debes seleccionar al menos un caballo");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // 🔥 ACTUALIZAR ESTADO (MANTENER PARA USO ADMIN - OPCIONAL)
  updateBetStatus: async (apuestaId, nuevoEstado, gananciaReal = 0) => {
    try {
      console.log("🔥 Actualizando estado:", apuestaId, nuevoEstado);

      const globalBetsRef = collection(db, "APUESTAS_GLOBAL");
      const q = query(globalBetsRef);
      const snapshot = await getDocs(q);

      snapshot.forEach(async (docSnap) => {
        const data = docSnap.data();
        if (data.apuestaId === apuestaId || docSnap.id === apuestaId) {
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

          const apuestaRef = doc(db, "APUESTAS_GLOBAL", docSnap.id);
          await updateDoc(apuestaRef, updateData);
          console.log("✅ Estado actualizado");
        }
      });

      return { success: true };
    } catch (error) {
      console.error("❌ Error:", error);
      return { success: false, error: error.message };
    }
  },

  // 🔥 OBTENER ESTADÍSTICAS DEL USUARIO (NUEVO)
  getUserStats: async () => {
    try {
      console.log("📊 Obteniendo estadísticas del usuario...");

      const getUserStatsFunction = httpsCallable(functions, "getUserStats");
      const result = await getUserStatsFunction();

      console.log("✅ Estadísticas:", result.data);
      return result.data;

    } catch (error) {
      console.error("❌ Error al obtener estadísticas:", error);
      return null;
    }
  },
};

export default betService;
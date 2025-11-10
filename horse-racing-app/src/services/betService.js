import { db } from "../firebase/config";
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  increment,
  getDocs,
  Timestamp,
} from "firebase/firestore";

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
  // Calcular ganancia potencial
  calculatePotentialWin: (betType, selectedHorses, amount) => {
    const multipliers = {
      GANADOR: 2.5,
      SEGUNDO: 2.0,
      TERCERO: 1.8,
      EXACTA: 5.0,
      TRIFECTA_D: 3.0,
      TIRA_1_2: 4.0,
      TIRA_1_2_3: 6.0,
      TRIFECTA_C: 8.0,
    };

    const multiplier = multipliers[betType] || 2.0;
    return Math.floor(amount * multiplier);
  },

  // Crear apuesta en Firebase
  // Crear apuesta en Firebase
  createBet: async (userId, betData, userSaldo) => {
    try {
      // Validar que el usuario tenga saldo suficiente
      if (userSaldo < betData.amount) {
        throw new Error("Saldo insuficiente para realizar esta apuesta");
      }

      // ✅ Asegurar que selectedHorses sea un array válido
      let horsesArray = [];
      if (Array.isArray(betData.selectedHorses)) {
        horsesArray = betData.selectedHorses.filter((h) => h != null);
      } else if (betData.selectedHorses) {
        horsesArray = [betData.selectedHorses];
      }

      // Validar que haya al menos un caballo seleccionado
      if (horsesArray.length === 0) {
        throw new Error("Debes seleccionar al menos un caballo");
      }

      // ✅ Validar y limpiar campos obligatorios
      const hipodromoId = betData.hipodromoId || "";
      const hipodromoNombre =
        betData.hipodromoNombre || betData.hipodromo || "Hipódromo desconocido";
      const carreraId = betData.carreraId || "";
      const numeroCarrera = Number(betData.numeroCarrera) || 0;
      const fecha = betData.fecha || new Date().toISOString().split("T")[0];
      const hora = betData.hora || "00:00";
      const tipoApuesta = betData.betType || "";
      const montoApostado = Number(betData.amount) || 0;
      const gananciaPotencial = Number(betData.potentialWin) || 0;

      console.log("🔍 Datos validados:", {
        hipodromoId,
        hipodromoNombre,
        carreraId,
        numeroCarrera,
        fecha,
        hora,
        tipoApuesta,
        montoApostado,
        gananciaPotencial,
      });

      // ✅ Preparar caballos seleccionados sin undefined
      const caballosSeleccionados = horsesArray.map((horse) => {
        // ✅ Asegurar que number y name existan
        const numero = Number(horse.number) || Number(horse.numero) || 0;
        const nombre = horse.name || horse.nombre || `CABALLO ${numero}`;

        console.log("🐴 Procesando caballo:", {
          original: horse,
          numero,
          nombre,
        });

        return {
          numero: numero,
          nombre: String(nombre),
        };
      });

      console.log("🐴 Caballos procesados:", caballosSeleccionados);

      // ✅ Crear string descriptivo de caballos apostados
      const caballosTexto = caballosSeleccionados
        .map((c) => `#${c.numero} ${c.nombre}`)
        .join(", ");

      console.log("📝 Texto de caballos:", caballosTexto);

      // Crear la apuesta en la subcolección APUESTAS del usuario
      const apuestasRef = collection(db, "USUARIOS", userId, "APUESTAS");

      // ✅ Construir objeto SIN ningún undefined
      const apuestaDataRaw = {
        // Información del hipódromo
        hipodromoId: hipodromoId,
        hipodromoNombre: hipodromoNombre,

        // Información de la carrera
        carreraId: carreraId,
        numeroCarrera: numeroCarrera,
        fecha: fecha,
        hora: hora,

        // Información de la apuesta
        tipoApuesta: tipoApuesta,
        caballosSeleccionados: caballosSeleccionados,
        caballosTexto: caballosTexto, // ✅ Texto legible de caballos

        // Montos
        montoApostado: montoApostado,
        gananciaPotencial: gananciaPotencial,

        // Estado
        estado: "PENDIENTE",

        // Metadata
        fechaCreacion: Timestamp.now(),
        timestamp: Date.now(),
      };

      // ✅ CRÍTICO: Limpiar cualquier undefined antes de guardar
      const apuestaData = cleanFirestoreData(apuestaDataRaw);

      console.log("🔥 Datos FINALES para Firestore:", apuestaData);

      // ✅ Verificación de seguridad
      const hasUndefined = JSON.stringify(apuestaData).includes("undefined");
      if (hasUndefined) {
        console.error("⚠️ ALERTA: Aún hay undefined en los datos");
        throw new Error("Error: datos inválidos detectados");
      }

      // Guardar la apuesta
      const docRef = await addDoc(apuestasRef, apuestaData);

      console.log("✅ Apuesta guardada con ID:", docRef.id);

      // Restar el monto del saldo del usuario
      const userRef = doc(db, "USUARIOS", userId);
      await updateDoc(userRef, {
        SALDO: increment(-montoApostado),
      });

      return {
        success: true,
        apuestaId: docRef.id,
        mensaje: "Apuesta registrada exitosamente",
      };
    } catch (error) {
      console.error("Error al crear apuesta:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
  getUserBets: async (userId) => {
    try {
      const apuestasRef = collection(db, "USUARIOS", userId, "APUESTAS");
      const snapshot = await getDocs(apuestasRef);

      const apuestas = [];
      snapshot.forEach((doc) => {
        apuestas.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Ordenar por fecha de creación (más recientes primero)
      return apuestas.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Error al obtener apuestas:", error);
      return [];
    }
  },

  // Validar apuesta antes de crearla
  validateBet: (betData, userSaldo) => {
    const errors = [];

    if (!betData.amount || betData.amount < 200) {
      errors.push("El monto mínimo de apuesta es $200");
    }

    if (betData.amount > 50000) {
      errors.push("El monto máximo de apuesta es $50,000");
    }

    if (userSaldo < betData.amount) {
      errors.push("Saldo insuficiente para realizar esta apuesta");
    }

    // ✅ Validar que selectedHorses sea un array con al menos un elemento
    const horsesArray = Array.isArray(betData.selectedHorses)
      ? betData.selectedHorses.filter((h) => h != null)
      : betData.selectedHorses
      ? [betData.selectedHorses]
      : [];

    if (horsesArray.length === 0) {
      errors.push("Debes seleccionar al menos un caballo");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Actualizar estado de una apuesta
  updateBetStatus: async (userId, apuestaId, nuevoEstado, gananciaReal = 0) => {
    try {
      const apuestaRef = doc(db, "USUARIOS", userId, "APUESTAS", apuestaId);

      const updateData = {
        estado: nuevoEstado,
        fechaActualizacion: new Date().toISOString(),
      };

      // Si la apuesta fue ganada, actualizar ganancia real y saldo del usuario
      if (nuevoEstado === "GANADA" && gananciaReal > 0) {
        updateData.gananciaReal = gananciaReal;

        // Actualizar el saldo del usuario
        const userRef = doc(db, "USUARIOS", userId);
        await updateDoc(userRef, {
          SALDO: increment(gananciaReal),
        });
      }

      await updateDoc(apuestaRef, updateData);

      return {
        success: true,
        mensaje: "Estado de la apuesta actualizado",
      };
    } catch (error) {
      console.error("Error al actualizar estado de apuesta:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Cancelar apuesta (solo si está pendiente)
  cancelBet: async (userId, apuestaId, montoApostado) => {
    try {
      const apuestaRef = doc(db, "USUARIOS", userId, "APUESTAS", apuestaId);

      // Actualizar estado a CANCELADA
      await updateDoc(apuestaRef, {
        estado: "CANCELADA",
        fechaCancelacion: new Date().toISOString(),
      });

      // Devolver el monto al saldo del usuario
      const userRef = doc(db, "USUARIOS", userId);
      await updateDoc(userRef, {
        SALDO: increment(montoApostado),
      });

      return {
        success: true,
        mensaje: "Apuesta cancelada y saldo reembolsado",
      };
    } catch (error) {
      console.error("Error al cancelar apuesta:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Obtener estadísticas de apuestas del usuario
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
          (sum, a) => sum + (a.montoApostado || 0),
          0
        ),
        totalGanado: apuestas
          .filter((a) => a.estado === "GANADA")
          .reduce((sum, a) => sum + (a.gananciaReal || 0), 0),
      };

      return stats;
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      return null;
    }
  },
};

export default betService;

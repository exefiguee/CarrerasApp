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

// ✅ Función helper para convertir fecha a Timestamp de forma segura
const toFirestoreTimestamp = (dateValue) => {
  if (!dateValue) return Timestamp.now();

  // Si ya es un Timestamp de Firestore
  if (dateValue instanceof Timestamp) {
    return dateValue;
  }

  // Intentar crear Date
  const date = new Date(dateValue);

  // Validar que la fecha sea válida
  if (isNaN(date.getTime())) {
    console.warn(
      "⚠️ Fecha inválida recibida:",
      dateValue,
      "- usando fecha actual"
    );
    return Timestamp.now();
  }

  return Timestamp.fromDate(date);
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

      console.log("🐴 Caballos recibidos en betData:", horsesArray);

      // ✅ Preparar caballos seleccionados ANTES de validar otros campos
      const caballosSeleccionados = horsesArray.map((horse) => {
        const numero = Number(horse.number) || Number(horse.numero) || 0;
        const nombre = String(
          horse.name || horse.nombre || `CABALLO ${numero}`
        );

        console.log("🐴 Procesando caballo:", {
          original: horse,
          numero,
          nombre,
        });

        return {
          numero: numero,
          nombre: nombre,
        };
      });

      // ✅ Crear string descriptivo de caballos apostados
      const caballosTexto = caballosSeleccionados
        .map((c) => `#${c.numero} ${c.nombre}`)
        .join(", ");

      console.log("✅ Caballos procesados:", caballosSeleccionados);
      console.log("✅ Texto de caballos:", caballosTexto);

      // ✅ Validar y limpiar campos obligatorios
      const hipodromoId = String(betData.hipodromoId || "");
      const hipodromoNombre = String(
        betData.hipodromoNombre || betData.hipodromo || "Hipódromo desconocido"
      );
      const carreraId = String(betData.carreraId || "");
      const numeroCarrera = Number(betData.numeroCarrera) || 0;

      // ✅ CORRECCIÓN: Usar helper seguro para convertir fecha
      const fecha = toFirestoreTimestamp(betData.fecha);

      const hora = String(betData.hora || "00:00");
      const tipoApuesta = String(betData.betType || "");
      const montoApostado = Number(betData.amount) || 0;
      const gananciaPotencial = Number(betData.potentialWin) || 0;

      // Crear la apuesta en la subcolección APUESTAS del usuario
      const apuestasRef = collection(db, "USUARIOS", userId, "APUESTAS");

      // ✅ Construir objeto DIRECTAMENTE sin cleanFirestoreData primero
      const apuestaData = {
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
        caballosSeleccionados: caballosSeleccionados, // Array limpio
        caballosTexto: caballosTexto, // String limpio

        // Montos
        montoApostado: montoApostado,
        gananciaPotencial: gananciaPotencial,

        // Estado
        estado: "PENDIENTE",

        // Metadata
        fechaCreacion: Timestamp.now(),
        timestamp: Date.now(),
      };

      console.log(
        "🔥 Datos FINALES para Firestore:",
        JSON.stringify(apuestaData, null, 2)
      );

      // ✅ Verificación final
      if (
        !apuestaData.caballosSeleccionados ||
        apuestaData.caballosSeleccionados.length === 0
      ) {
        throw new Error("Error: no hay caballos seleccionados");
      }

      if (!apuestaData.caballosTexto) {
        throw new Error("Error: falta texto de caballos");
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
      console.error("❌ Error al crear apuesta:", error);
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
        // ✅ CORRECCIÓN: Usar Timestamp en lugar de ISO string
        fechaActualizacion: Timestamp.now(),
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
        // ✅ CORRECCIÓN: Usar Timestamp en lugar de ISO string
        fechaCancelacion: Timestamp.now(),
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

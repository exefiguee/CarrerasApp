import { db } from "../firebase/config";
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  increment,
  getDocs,
  Timestamp,
  onSnapshot,
  query,
  orderBy,
  setDoc,
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

// ✅ Función helper para convertir fecha STRING a Timestamp en zona horaria local
const toFirestoreTimestamp = (dateValue) => {
  if (!dateValue) return Timestamp.now();
  if (dateValue instanceof Timestamp) return dateValue;
  
  try {
    let date;
    
    // Si viene como string de fecha "YYYY-MM-DD" (formato más común)
    if (typeof dateValue === 'string') {
      // Formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        const [year, month, day] = dateValue.split('-').map(Number);
        // 🔥 CREAR FECHA EN ZONA HORARIA LOCAL (mediodía para evitar cambios de día)
        date = new Date(year, month - 1, day, 12, 0, 0, 0);
        console.log(`📅 Fecha creada desde "${dateValue}":`, date.toLocaleDateString('es-AR'));
      }
      // Formato DD/MM/YYYY
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
        const [day, month, year] = dateValue.split('/').map(Number);
        date = new Date(year, month - 1, day, 12, 0, 0, 0);
        console.log(`📅 Fecha creada desde "${dateValue}":`, date.toLocaleDateString('es-AR'));
      }
      // Otros formatos - parsear y ajustar a mediodía
      else {
        date = new Date(dateValue);
        // Si es medianoche, cambiar a mediodía para evitar problemas de zona horaria
        if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
          date.setHours(12, 0, 0, 0);
        }
      }
    } 
    // Si ya es un objeto Date
    else if (dateValue instanceof Date) {
      date = new Date(dateValue);
      // Si es medianoche, cambiar a mediodía
      if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
        date.setHours(12, 0, 0, 0);
      }
    } 
    // Otros casos
    else {
      date = new Date(dateValue);
    }
    
    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) {
      console.warn("⚠️ Fecha inválida:", dateValue, "- usando fecha actual");
      return Timestamp.now();
    }
    
    console.log("✅ Timestamp creado:", {
      entrada: dateValue,
      fechaLocal: date.toLocaleDateString('es-AR'),
      horaLocal: date.toLocaleTimeString('es-AR'),
    });
    
    return Timestamp.fromDate(date);
  } catch (error) {
    console.warn("⚠️ Error al convertir fecha:", dateValue, error);
    return Timestamp.now();
  }
};

const betService = {
  // 🔥 CREAR APUESTA CON TODOS LOS DATOS
  createBet: async (userId, betData, userSaldo) => {
    try {
      console.log("🎯 Iniciando creación de apuesta...");
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
      }));

      // Generar texto descriptivo
      const caballosTexto = caballosSeleccionados
        .map((c) => `#${c.numero} ${c.nombre}`)
        .join(", ");

      console.log("✅ Caballos procesados:", caballosSeleccionados);

      // ========== CONSTRUIR OBJETO COMPLETO PARA FIREBASE ==========
      const apuestaData = {
        // ========== INFORMACIÓN DEL HIPÓDROMO ==========
        hipodromo: {
          id: String(betData.hipodromoId || betData.carreraId || ""),
          nombre: String(betData.hipodromoNombre || "Hipódromo desconocido"),
        },

        // ========== INFORMACIÓN DE LA CARRERA ==========
        carrera: {
          id: String(betData.carreraId || ""),
          numero: Number(betData.numeroCarrera) || 0,
          fecha: String(betData.fecha || ""),
          hora: String(betData.hora || "00:00"),
          fechaTimestamp: toFirestoreTimestamp(betData.fecha),
        },

        // Metadata adicional de la carrera
        carreraMetadata: betData.raceMetadata ? {
          totalCaballos: Number(betData.raceMetadata.totalHorses) || 0,
          distancia: String(betData.raceMetadata.distance || ""),
          tipo: String(betData.raceMetadata.type || ""),
          premio: String(betData.raceMetadata.prize || ""),
        } : null,

        // ========== INFORMACIÓN DE LA APUESTA ==========
        tipoApuesta: {
          tipo: String(betData.betType || ""),
          label: String(betData.betTypeLabel || betData.betType || ""),
          descripcion: String(betData.betTypeDescription || ""),
          modoSeleccion: String(betData.selectionMode || ""),
        },

        // Indicadores booleanos
        esApuestaAgrupada: Boolean(betData.isGroupedPositions),
        esApuestaMultiCarrera: Boolean(betData.isGroupedRaces || betData.isMultiRace),

        // ========== CABALLOS SELECCIONADOS ==========
        caballos: {
          seleccionados: caballosSeleccionados,
          texto: caballosTexto,
          cantidad: caballosSeleccionados.length,
          // Información detallada si es apuesta agrupada
          detalleGrupos: betData.caballosInfo ? cleanFirestoreData(betData.caballosInfo) : null,
        },

        // ========== MONTOS Y CÁLCULOS ==========
        montos: {
          montoPorCombinacion: Number(betData.amount) || 0,
          numeroCombinaciones: Number(betData.combinaciones) || 1,
          montoTotal: Number(betData.montoTotal) || Number(betData.amount) || 0,
          gananciaPotencial: Number(betData.potentialWin) || 0,
          
          // Sistema de VALES
          usaVales: Boolean(betData.usesVales),
          dividendo: Number(betData.dividendo) || 0,
          valesApostados: Number(betData.valesApostados) || 0,
          
          // Límites
          apuestaMinima: Number(betData.apuestaMinima) || 200,
          apuestaMaxima: Number(betData.apuestaMaxima) || 50000,
        },

        // ========== ESTADO DE LA APUESTA ==========
        estado: "PENDIENTE",
        estadoDetallado: {
          estado: "PENDIENTE",
          mensaje: "Esperando resultado de la carrera",
          fechaUltimaActualizacion: Timestamp.now(),
        },

        // ========== RESULTADOS (se llenará después) ==========
        resultado: {
          posicionesFinales: null,
          gananciaReal: 0,
          esGanadora: false,
          fechaResolucion: null,
        },

        // ========== INFORMACIÓN DEL USUARIO ==========
        usuario: {
          id: String(userId || ""),
          email: String(betData.userEmail || ""),
        },

        // ========== TIMESTAMPS ==========
        timestamps: {
          creacion: Timestamp.now(),
          creacionISO: new Date().toISOString(),
          unix: Date.now(),
        },

        // ========== METADATA ADICIONAL ==========
        metadata: {
          version: "2.0",
          app: "HipodromoApp",
          dispositivo: navigator.userAgent || "Desconocido",
        },
      };

      // ========== LIMPIAR DATOS ==========
      const cleanedData = cleanFirestoreData(apuestaData);

      console.log("🔥 Datos FINALES limpiados para Firebase:");
      console.log(JSON.stringify(cleanedData, null, 2));

      // ========== GUARDAR EN FIREBASE ==========
      const apuestasRef = collection(db, "USUARIOS", userId, "APUESTAS");
      const docRef = await addDoc(apuestasRef, cleanedData);

      console.log("✅ Apuesta guardada con ID:", docRef.id);

      // ========== ACTUALIZAR SALDO DEL USUARIO ==========
      const userRef = doc(db, "USUARIOS", userId);
      await updateDoc(userRef, {
        SALDO: increment(-cleanedData.montos.montoTotal),
        ULTIMA_APUESTA: Timestamp.now(),
      });

      console.log(`💰 Saldo actualizado: -$${cleanedData.montos.montoTotal}`);

      // ========== GUARDAR REGISTRO EN COLECCIÓN GLOBAL (OPCIONAL) ==========
      // Esto es útil para tener todas las apuestas en un solo lugar
      try {
        const apuestasGlobalRef = collection(db, "APUESTAS_GLOBAL");
        await addDoc(apuestasGlobalRef, {
          ...cleanedData,
          apuestaId: docRef.id,
          usuarioId: userId,
        });
        console.log("✅ Apuesta también guardada en APUESTAS_GLOBAL");
      } catch (error) {
        console.warn("⚠️ No se pudo guardar en APUESTAS_GLOBAL:", error);
        // No es crítico, continuar
      }

      return {
        success: true,
        apuestaId: docRef.id,
        valesApostados: cleanedData.montos.valesApostados,
        montoTotal: cleanedData.montos.montoTotal,
        mensaje: cleanedData.montos.usaVales
          ? `Apuesta registrada - ${cleanedData.montos.valesApostados} vales`
          : "Apuesta registrada exitosamente",
      };

    } catch (error) {
      console.error("❌ Error al crear apuesta:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // 🔥 ESCUCHAR APUESTAS EN TIEMPO REAL
  listenToUserBets: (userId, callback) => {
    const apuestasRef = collection(db, "USUARIOS", userId, "APUESTAS");
    const q = query(apuestasRef, orderBy("timestamps.creacion", "desc"));

    console.log("🔥 Iniciando listener de apuestas para:", userId);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const apuestas = [];
        snapshot.forEach((doc) => {
          apuestas.push({
            id: doc.id,
            ...doc.data(),
          });
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
  listenToBet: (userId, apuestaId, callback) => {
    const apuestaRef = doc(db, "USUARIOS", userId, "APUESTAS", apuestaId);

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

  // 🔥 OBTENER TODAS LAS APUESTAS
  getUserBets: async (userId) => {
    try {
      const apuestasRef = collection(db, "USUARIOS", userId, "APUESTAS");
      const q = query(apuestasRef, orderBy("timestamps.creacion", "desc"));
      const snapshot = await getDocs(q);

      const apuestas = [];
      snapshot.forEach((doc) => {
        apuestas.push({
          id: doc.id,
          ...doc.data(),
        });
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

  // 🔥 ACTUALIZAR ESTADO DE APUESTA
  updateBetStatus: async (userId, apuestaId, nuevoEstado, gananciaReal = 0) => {
    try {
      const apuestaRef = doc(db, "USUARIOS", userId, "APUESTAS", apuestaId);

      const updateData = {
        estado: nuevoEstado,
        "estadoDetallado.estado": nuevoEstado,
        "estadoDetallado.fechaUltimaActualizacion": Timestamp.now(),
        "resultado.fechaResolucion": Timestamp.now(),
      };

      if (nuevoEstado === "GANADA" && gananciaReal > 0) {
        updateData["resultado.gananciaReal"] = gananciaReal;
        updateData["resultado.esGanadora"] = true;

        // Actualizar saldo del usuario
        const userRef = doc(db, "USUARIOS", userId);
        await updateDoc(userRef, {
          SALDO: increment(gananciaReal),
        });

        console.log(`💰 Usuario ganó: $${gananciaReal}`);
      } else if (nuevoEstado === "PERDIDA") {
        updateData["resultado.esGanadora"] = false;
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

  // 🔥 CANCELAR APUESTA
  cancelBet: async (userId, apuestaId) => {
    try {
      const apuestaRef = doc(db, "USUARIOS", userId, "APUESTAS", apuestaId);
      
      // Obtener el monto a reembolsar
      const apuestaDoc = await apuestaRef.get();
      if (!apuestaDoc.exists()) {
        throw new Error("Apuesta no encontrada");
      }

      const apuestaData = apuestaDoc.data();
      const montoReembolso = apuestaData.montos?.montoTotal || 0;

      // Actualizar estado
      await updateDoc(apuestaRef, {
        estado: "CANCELADA",
        "estadoDetallado.estado": "CANCELADA",
        "estadoDetallado.mensaje": "Apuesta cancelada por el usuario",
        "estadoDetallado.fechaUltimaActualizacion": Timestamp.now(),
        "resultado.fechaResolucion": Timestamp.now(),
      });

      // Reembolsar saldo
      const userRef = doc(db, "USUARIOS", userId);
      await updateDoc(userRef, {
        SALDO: increment(montoReembolso),
      });

      console.log(`✅ Apuesta cancelada y reembolsado: $${montoReembolso}`);

      return {
        success: true,
        mensaje: "Apuesta cancelada y saldo reembolsado",
        montoReembolsado: montoReembolso,
      };
    } catch (error) {
      console.error("❌ Error al cancelar apuesta:", error);
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
      };

      return stats;
    } catch (error) {
      console.error("❌ Error en estadísticas:", error);
      return null;
    }
  },
};

export default betService;
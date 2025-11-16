import { useState, useEffect } from "react";
import MiApuesta from "./UserBets";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
} from "firebase/firestore";

import {
  Play,
  Calendar,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Info,
} from "lucide-react";

// Componente CarreraCard con contador de tiempo
function CarreraCard({ carrera, isSelected, onSelect }) {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [status, setStatus] = useState("upcoming");

  useEffect(() => {
    const calculateTimeRemaining = () => {
      try {
        let day, month, year;

        if (carrera.fecha_texto.includes("/")) {
          [day, month, year] = carrera.fecha_texto.split("/");
        } else if (carrera.fecha_texto.includes("-")) {
          [year, month, day] = carrera.fecha_texto.split("-");
        } else {
          setStatus("upcoming");
          setTimeRemaining("--");
          return;
        }

        const [hrs, mins] = carrera.hora.split(":");

        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const dayNum = parseInt(day);
        const hoursNum = parseInt(hrs);
        const minsNum = parseInt(mins);

        if (
          isNaN(yearNum) ||
          isNaN(monthNum) ||
          isNaN(dayNum) ||
          isNaN(hoursNum) ||
          isNaN(minsNum)
        ) {
          setStatus("upcoming");
          setTimeRemaining("--");
          return;
        }

        const raceDate = new Date(
          yearNum,
          monthNum - 1,
          dayNum,
          hoursNum,
          minsNum
        );
        const now = new Date();
        const diff = raceDate - now;

        if (diff < 0) {
          setStatus("finished");
          setTimeRemaining("Trasmisión en vivo");
          return;
        }

        if (diff < 5 * 60 * 1000) {
          setStatus("live");
          const minutes = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}m ${secs}s`);
          return;
        }

        if (diff < 30 * 60 * 1000) {
          setStatus("soon");
          const minutes = Math.floor(diff / 60000);
          setTimeRemaining(`${minutes} minutos`);
          return;
        }

        if (diff < 24 * 60 * 60 * 1000) {
          setStatus("upcoming");
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m`);
          } else {
            setTimeRemaining(`${minutes} minutos`);
          }
          return;
        }

        setStatus("upcoming");
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / 3600000);
        if (days > 0) {
          setTimeRemaining(`${days}d ${hours}h`);
        } else {
          setTimeRemaining(`${hours}h`);
        }
      } catch (error) {
        console.error("Error calculando tiempo:", error);
        setStatus("upcoming");
        setTimeRemaining("--");
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [carrera.fecha_texto, carrera.hora]);

  const getStatusColors = () => {
    switch (status) {
      case "live":
        return {
          bg: "bg-red-500/20",
          border: "border-red-400/50",
          text: "text-red-400",
          icon: "text-red-400",
          pulse: true,
        };
      case "soon":
        return {
          bg: "bg-amber-500/20",
          border: "border-amber-400/50",
          text: "text-amber-400",
          icon: "text-amber-400",
          pulse: false,
        };
      case "finished":
        return {
          bg: "bg-slate-500/20",
          border: "border-slate-400/50",
          text: "text-slate-400",
          icon: "text-slate-400",
          pulse: false,
        };
      default:
        return {
          bg: "bg-fuchsia-500/20",
          border: "border-fuchsia-400/50",
          text: "text-fuchsia-400",
          icon: "text-fuchsia-400",
          pulse: false,
        };
    }
  };

  const statusColors = getStatusColors();
  const isDisabled = status === "finished";

  return (
    <button
      onClick={() => !isDisabled && onSelect(carrera)}
      disabled={isDisabled}
      className={`group w-full text-left p-3 rounded-xl transition-all duration-300 ${
        isDisabled
          ? "bg-slate-900/20 border border-slate-800/30 opacity-50 cursor-not-allowed"
          : isSelected
          ? "from-fuchsia-500/25 via-fuchsia-600/20 to-slate-800/40 border-2 border-fuchsia-400/60 shadow-xl shadow-fuchsia-500/20 scale-[1.02]"
          : "bg-slate-800/40 border border-slate-700/50 hover:border-fuchsia-500/50 hover:shadow-lg hover:shadow-fuchsia-500/10"
      }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${
              isDisabled
                ? "bg-slate-800/30 text-slate-500 border border-slate-700/30"
                : isSelected
                ? "bg-gradient-to-r from-fuchsia-600 to-fuchsia-900 text-white shadow-lg shadow-fuchsia-500/30"
                : "bg-slate-800/50 text-fuchsia-400 border border-fuchsia-400/40 group-hover:border-fuchsia-400/60"
            }`}>
            Carrera {carrera.num_carrera}
          </span>

          {isSelected && !isDisabled && (
            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse shadow-lg shadow-fuchsia-400/50" />
          )}
        </div>

        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${statusColors.bg} ${statusColors.border}`}>
          <Clock
            className={`w-3.5 h-3.5 ${statusColors.icon} ${
              statusColors.pulse ? "animate-pulse" : ""
            }`}
          />
          <span className={`font-bold text-xs ${statusColors.text}`}>
            {status === "live" && "¡En "}
            {timeRemaining}
            {status === "live" && "!"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
            isDisabled
              ? "bg-slate-800/30 text-slate-500"
              : isSelected
              ? "bg-slate-900/50 text-fuchsia-300"
              : "bg-slate-800/50 text-slate-300 group-hover:text-fuchsia-400"
          }`}>
          <Clock className="w-3.5 h-3.5" />
          <span className="font-semibold text-xs">{carrera.hora}</span>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
            isDisabled
              ? "bg-slate-800/20 text-slate-500"
              : isSelected
              ? "bg-slate-900/30 text-slate-300"
              : "bg-slate-800/30 text-slate-400"
          }`}>
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">{carrera.fecha_texto}</span>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          isDisabled
            ? "bg-slate-800/20 border border-slate-700/20"
            : isSelected
            ? "bg-slate-900/40 border border-fuchsia-500/30"
            : "bg-slate-800/30 border border-slate-700/30 group-hover:border-fuchsia-500/20"
        }`}>
        <div
          className={`p-1.5 rounded-md transition-all ${
            isDisabled
              ? "bg-slate-700/30"
              : isSelected
              ? "bg-fuchsia-500/20"
              : "bg-slate-700/50 group-hover:bg-fuchsia-500/10"
          }`}>
          <Users
            className={`w-3.5 h-3.5 transition-colors ${
              isDisabled
                ? "text-slate-500"
                : isSelected
                ? "text-fuchsia-400"
                : "text-slate-400 group-hover:text-fuchsia-400"
            }`}
          />
        </div>
        <span
          className={`font-medium text-xs transition-colors ${
            isDisabled
              ? "text-slate-500"
              : isSelected
              ? "text-fuchsia-300"
              : "text-slate-300 group-hover:text-fuchsia-400"
          }`}>
          {carrera.caballos} caballos inscriptos
        </span>
      </div>
    </button>
  );
}

const RacesList = ({ onSelectRace }) => {
  const [data, setData] = useState(null);
  const [transmisiones, setTransmisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHipodromo, setSelectedHipodromo] = useState(null);
  const [selectedFecha, setSelectedFecha] = useState(null);
  const [selectedCarrera, setSelectedCarrera] = useState(null);
  const [user, setUser] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(
    "public/canalcarreras.html?id=channel"
  );
  const [activeTab, setActiveTab] = useState("hipodromos");
  const [carrerasFromFirestore, setCarrerasFromFirestore] = useState([]);
  const [usandoFirestore, setUsandoFirestore] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    cargarDatos();
    cargarTransmisiones();
    cargarCarrerasDesdeFirestore();
  }, []);

  useEffect(() => {
    if (transmisiones.length > 0) {
      seleccionarTransmisionArgentina();
    }
  }, [transmisiones]);

  const seleccionarTransmisionArgentina = () => {
    const argTransmision = transmisiones.find(
      (t) =>
        t.descripcion.toUpperCase().includes("ARG") ||
        t.descripcion.toUpperCase().includes("ARGENTINA")
    );

    if (!argTransmision) return;

    const horarioMatch = argTransmision.descripcion.match(
      /(\d{1,2}):(\d{2})\s*a\s*(\d{1,2}):(\d{2})/
    );

    if (!horarioMatch) {
      setIframeUrl(argTransmision.link);
      return;
    }

    const horaInicio = parseInt(horarioMatch[1]);
    const minInicio = parseInt(horarioMatch[2]);
    const horaFin = parseInt(horarioMatch[3]);
    const minFin = parseInt(horarioMatch[4]);

    const ahora = new Date();
    const horaActual = ahora.getHours();
    const minActual = ahora.getMinutes();

    const minutosActuales = horaActual * 60 + minActual;
    const minutosInicio = horaInicio * 60 + minInicio;
    const minutosFin = horaFin * 60 + minFin;

    if (minutosActuales >= minutosInicio && minutosActuales <= minutosFin) {
      setIframeUrl(argTransmision.link);
    }
  };

  // Función para convertir fecha string a Timestamp
  const convertirFechaATimestamp = (fechaStr, horaStr) => {
    try {
      let day, month, year;

      if (fechaStr.includes("/")) {
        [day, month, year] = fechaStr.split("/");
      } else if (fechaStr.includes("-")) {
        [year, month, day] = fechaStr.split("-");
      } else {
        return Timestamp.now();
      }

      const [hrs, mins] = horaStr.split(":");

      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      const hoursNum = parseInt(hrs);
      const minsNum = parseInt(mins);

      if (
        isNaN(yearNum) ||
        isNaN(monthNum) ||
        isNaN(dayNum) ||
        isNaN(hoursNum) ||
        isNaN(minsNum)
      ) {
        return Timestamp.now();
      }

      const fecha = new Date(yearNum, monthNum - 1, dayNum, hoursNum, minsNum);
      return Timestamp.fromDate(fecha);
    } catch (error) {
      console.error("Error convirtiendo fecha:", error);
      return Timestamp.now();
    }
  };

  // Función para crear el mapa de caballitos
  const crearMapaCaballitos = (numCaballos) => {
    const caballitos = {};
    const totalCaballos = parseInt(numCaballos) || 0;

    for (let i = 1; i <= totalCaballos; i++) {
      caballitos[`caballo_${i}`] = true;
    }

    return caballitos;
  };
  // Crear tipos de apuestas por defecto
  const crearTiposApuestasDefault = () => {
    return {
      GANADOR: true,
      SEGUNDO: true,
      TERCERO: true,
      "TIRA(1,2)": true,
      "TIRA(1,2,3)": true,
      EXACTA: true,
      IMPERFECTA: true,
      "TRIFECTA D": true,
      "CUATRIFECTA D": true,
      "QUINTEX D": true,
      "TRIFECTA C": true,
      "CUATRIFECTA C": true,
      "QUINTEX C": true,
      DOBLE: true,
      TRIPLO: true,
      "PICK 4": true,
      "PICK 5": true,
      "PICK 6": true,
    };
  };

  const crearLimitesApuestasDefault = () => {
    return {
      GANADOR1: { apuestaMinima: 200, apuestaMaxima: 30000 },
      SEGUNDO1: { apuestaMinima: 200, apuestaMaxima: 15000 },
      TERCERO1: { apuestaMinima: 200, apuestaMaxima: 10000 },
      "TIRA(1,2)1": { apuestaMinima: 200, apuestaMaxima: 50000 },
      "TIRA(1,2,3)1": { apuestaMinima: 200, apuestaMaxima: 75000 },
      EXACTA1: { apuestaMinima: 200, apuestaMaxima: 75000 },
      IMPERFECTA1: { apuestaMinima: 200, apuestaMaxima: 50000 },
      TRIFECTAD1: { apuestaMinima: 200, apuestaMaxima: 100000 },
      CUATRIFECTAD1: { apuestaMinima: 200, apuestaMaxima: 150000 },
      QUINTEXD1: { apuestaMinima: 200, apuestaMaxima: 200000 },
      TRIFECTAC1: { apuestaMinima: 200, apuestaMaxima: 100000 },
      CUATRIFECTAC1: { apuestaMinima: 200, apuestaMaxima: 150000 },
      QUINTEXC1: { apuestaMinima: 200, apuestaMaxima: 200000 },
      DOBLE1: { apuestaMinima: 200, apuestaMaxima: 50000 },
      TRIPLO1: { apuestaMinima: 200, apuestaMaxima: 75000 },
      PICK41: { apuestaMinima: 200, apuestaMaxima: 100000 },
      PICK51: { apuestaMinima: 200, apuestaMaxima: 150000 },
      PICK61: { apuestaMinima: 200, apuestaMaxima: 200000 },
    };
  };
  const guardarCarrerasEnFirestore = async (jsonData) => {
    try {
      if (!jsonData || !jsonData.carreras) return;

      const carrerasRef = collection(db, "carreras1");

      // Cargar carreras existentes
      const querySnapshot = await getDocs(carrerasRef);
      const carrerasExistentes = new Map();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        carrerasExistentes.set(data.id_carrera, {
          firebaseId: doc.id,
          ...data,
        });
      });

      console.log(
        `📊 ${carrerasExistentes.size} carreras existentes en Firestore`
      );

      let nuevas = 0;
      let actualizadas = 0;
      let sinCambios = 0;

      for (const carrera of jsonData.carreras) {
        const carreraExistente = carrerasExistentes.get(carrera.id);

        // Si ya existe, saltar sin procesar
        if (carreraExistente) {
          sinCambios++;
          continue;
        }

        // Solo procesar carreras nuevas
        const hipodromoInfo = jsonData.hipodromos.find(
          (h) => h.id === carrera.id_hipodromo
        );

        const carreraData = {
          id_carrera: carrera.id,
          num_carrera: carrera.num_carrera,
          id_hipodromo: carrera.id_hipodromo,
          descripcion_hipodromo: hipodromoInfo?.descripcion || "Desconocido",
          fecha: convertirFechaATimestamp(carrera.fecha, carrera.hora),
          fecha_texto: carrera.fecha,
          hora: carrera.hora,
          caballos: parseInt(carrera.caballos) || 0,
          caballitos: crearMapaCaballitos(carrera.caballos),
          seJuega: true,
          tiposApuestas: crearTiposApuestasDefault(),
          limitesApuestas: crearLimitesApuestasDefault(),
        };

        const limpio = Object.fromEntries(
          Object.entries(carreraData).filter(([k, v]) => v !== undefined)
        );

        // ✨ Nueva carrera
        await addDoc(carrerasRef, {
          ...limpio,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        nuevas++;
        console.log(
          `✨ Nueva carrera ${carrera.num_carrera} agregada con tipos de apuestas`
        );
      }

      console.log(`
✅ Sincronización completada:
   ✨ ${nuevas} nuevas
   🔄 ${actualizadas} actualizadas
   ⏭️  ${sinCambios} sin cambios
      `);

      // Solo recargar si hubo cambios
      if (nuevas > 0) {
        await cargarCarrerasDesdeFirestore();
      }
    } catch (error) {
      console.error("❌ Error guardando carreras:", error);
    }
  };
  const cargarCarrerasDesdeFirestore = async () => {
    try {
      const carrerasRef = collection(db, "carreras1");
      const q = query(carrerasRef, orderBy("fecha", "asc"));
      const querySnapshot = await getDocs(q);

      const carreras = [];
      querySnapshot.forEach((doc) => {
        carreras.push({
          firebaseId: doc.id,
          ...doc.data(),
        });
      });

      setCarrerasFromFirestore(carreras);
      setUsandoFirestore(true);
      console.log(`📊 ${carreras.length} carreras cargadas desde Firestore`);
    } catch (error) {
      console.error("Error cargando carreras desde Firestore:", error);
      setUsandoFirestore(false);
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://xwdc.net/nuevo/ext_datos_carrerasv2.php"
      );
      const text = await response.text();
      const jsonStart = text.indexOf('{"error"');
      const jsonText = text.substring(jsonStart);
      const jsonData = JSON.parse(jsonText);

      if (jsonData.error === 0) {
        setData(jsonData);
        // Guardar carreras en Firestore
        await guardarCarrerasEnFirestore(jsonData);
      } else {
        setError("Error en los datos recibidos");
      }
    } catch (err) {
      setError("Error al cargar los datos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarTransmisiones = async () => {
    try {
      const res = await fetch("https://xwdc.net/nuevo/ext_gruposv2.php");
      const text = await res.text();
      const jsonStart = text.indexOf('{"error"');
      const jsonText = text.substring(jsonStart);
      const jsonData = JSON.parse(jsonText);

      if (jsonData.error === 0 && jsonData.grupos) {
        setTransmisiones(jsonData.grupos);
      }
    } catch (err) {
      console.error("Error al cargar transmisiones:", err);
    }
  };

  const getCarrerasDelHipodromo = () => {
    if (!selectedHipodromo) return [];

    // Si usamos Firestore, filtrar de ahí
    if (usandoFirestore && carrerasFromFirestore.length > 0) {
      return carrerasFromFirestore.filter(
        (c) => c.id_hipodromo === selectedHipodromo
      );
    }

    // Si no, usar los datos de la API
    if (!data) return [];
    return data.carreras.filter((c) => c.id_hipodromo === selectedHipodromo);
  };

  const getHipodromoInfo = (id) => {
    if (!data) return null;
    return data.hipodromos.find((h) => h.id === id);
  };

  const handleSelectCarrera = (carrera) => {
    setSelectedCarrera(carrera);
    const totalCaballos = parseInt(carrera.caballos) || 0;
    const generatedHorses = Array.from({ length: totalCaballos }, (_, i) => ({
      number: i + 1,
      name: `CABALLO ${i + 1}`,
    }));

    const hipodromoNombre =
      carrera.descripcion_hipodromo || "Hipódromo desconocido";

    if (onSelectRace) {
      onSelectRace({
        ...carrera,
        horses: generatedHorses,
        descripcion_hipodromo: hipodromoNombre,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin h-16 w-16 border-4 border-fuchsia-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="absolute inset-0 h-16 w-16 border-4 border-fuchsia-300/30 rounded-full mx-auto animate-pulse"></div>
          </div>
          <p className="text-slate-300 text-lg font-medium">
            Cargando datos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen from-slate-950 via-slate-900 to-slate-950">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md mx-4">
          <div className="text-red-400 text-center">
            <Info className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const carrerasDelHipodromo = getCarrerasDelHipodromo();

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-3 h-full flex flex-col ">
        <div className="grid grid-cols-1 lg:grid-cols-[50%_50%] gap-4 flex-1 min-h-0">
          <div className="flex flex-col h-full">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 overflow-hidden flex flex-col h-full">
              <div className="bg-gradient-to-r from-fuchsia-600/20 to-fuchsia-500/20 border-b border-slate-800/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-fuchsia-400" />
                    <h2 className="text-lg font-bold text-white">
                      Transmisión en Vivo
                    </h2>
                  </div>
                </div>
              </div>

              <div className="aspect-video bg-black flex-shrink-0">
                <iframe
                  src={iframeUrl}
                  className="w-full h-full border-0"
                  title="Visor Web"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col h-full min-h-0">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 overflow-hidden flex flex-col h-full">
              <div className="grid grid-cols-2 bg-slate-800/30 flex-shrink-0">
                <button
                  onClick={() => setActiveTab("hipodromos")}
                  className={`py-3 px-4 font-semibold text-sm md:text-base transition-all ${
                    activeTab === "hipodromos"
                      ? "bg-gradient-to-b from-fuchsia-600 to-fuchsia-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}>
                  Hipódromos y Carreras
                </button>
                <button
                  onClick={() => setActiveTab("apuestas")}
                  className={`py-3 px-4 font-semibold text-sm md:text-base transition-all ${
                    activeTab === "apuestas"
                      ? "bg-gradient-to-b from-fuchsia-600 to-fuchsia-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}>
                  Mis Apuestas
                </button>
              </div>

              <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === "hipodromos" && (
                  <div className="space-y-4">
                    {/* Indicador de fuente de datos */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                      <span className="text-xs text-slate-400">
                        Fuente de datos:
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          usandoFirestore ? "text-green-400" : "text-amber-400"
                        }`}>
                        {usandoFirestore ? "🔥 Firestore" : "🌐 API Externa"}
                      </span>
                      {usandoFirestore && (
                        <span className="text-xs text-slate-500">
                          ({carrerasFromFirestore.length} carreras)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <select
                        value={selectedHipodromo || ""}
                        onChange={(e) => {
                          setSelectedHipodromo(e.target.value || null);
                          setSelectedCarrera(null);
                        }}
                        className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm font-medium cursor-pointer transition-all hover:border-fuchsia-500/50 focus:outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20">
                        <option value="">🏟️ Selecciona un hipódromo</option>
                        {data?.hipodromos
                          .filter((hip) => {
                            const carrerasParaEsteHipo = usandoFirestore
                              ? carrerasFromFirestore.filter(
                                  (c) => c.id_hipodromo === hip.id
                                )
                              : data.carreras.filter(
                                  (c) => c.id_hipodromo === hip.id
                                );
                            return carrerasParaEsteHipo.length > 0;
                          })
                          .map((hip) => {
                            const carrerasCount = usandoFirestore
                              ? carrerasFromFirestore.filter(
                                  (c) => c.id_hipodromo === hip.id
                                ).length
                              : data.carreras.filter(
                                  (c) => c.id_hipodromo === hip.id
                                ).length;
                            return (
                              <option key={hip.id} value={hip.id}>
                                {hip.descripcion} ({carrerasCount} carreras)
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    {!selectedHipodromo ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-fuchsia-500/30">
                            <TrendingUp className="w-10 h-10 text-fuchsia-400" />
                          </div>
                          <p className="text-lg font-semibold text-slate-200 mb-2">
                            Selecciona un hipódromo
                          </p>
                          <p className="text-sm text-slate-400">
                            Elige un hipódromo del menú desplegable para ver sus
                            carreras
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {data?.hipodromos
                          .filter((hip) => hip.id === selectedHipodromo)
                          .map((hip) => {
                            const carrerasCount = carrerasDelHipodromo.length;
                          })}

                        <div>
                          <h4 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-fuchsia-400" />
                            Carreras del Día
                          </h4>
                          {carrerasDelHipodromo.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                <p className="text-slate-400 text-sm">
                                  No hay carreras disponibles para este
                                  hipódromo
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {carrerasDelHipodromo.map((carrera) => {
                                const isSelected =
                                  selectedCarrera?.firebaseId ===
                                    carrera.firebaseId ||
                                  selectedCarrera?.id === carrera.id;
                                return (
                                  <CarreraCard
                                    key={
                                      carrera.firebaseId ||
                                      `carrera-${carrera.id}`
                                    }
                                    carrera={carrera}
                                    isSelected={isSelected}
                                    onSelect={handleSelectCarrera}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "apuestas" &&
                  (user ? (
                    <MiApuesta userId={user.uid} />
                  ) : (
                    <div className="text-center text-slate-400 py-8">
                      Inicia sesión para ver tus apuestas...
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(217, 70, 239, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(217, 70, 239, 0.5);
        }
      `}</style>
    </div>
  );
};

export default RacesList;

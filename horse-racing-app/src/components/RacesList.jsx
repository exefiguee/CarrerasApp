import { useState, useEffect } from "react";
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
  const [timeRemaining, setTimeRemaining] = useState('');
  const [status, setStatus] = useState('upcoming'); // 'upcoming', 'soon', 'live', 'finished'

  useEffect(() => {
    const calculateTimeRemaining = () => {
      try {
        // Parsear fecha y hora de la carrera
        // Asumiendo formato: fecha="DD/MM/YYYY" o "YYYY-MM-DD" y hora="HH:MM"
        let day, month, year;
        
        if (carrera.fecha.includes('/')) {
          [day, month, year] = carrera.fecha.split('/');
        } else if (carrera.fecha.includes('-')) {
          [year, month, day] = carrera.fecha.split('-');
        } else {
          setStatus('upcoming');
          setTimeRemaining('--');
          return;
        }
        
        const [hrs, mins] = carrera.hora.split(':');
        
        // Convertir a números y validar
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const dayNum = parseInt(day);
        const hoursNum = parseInt(hrs);
        const minsNum = parseInt(mins);
        
        if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum) || isNaN(hoursNum) || isNaN(minsNum)) {
          setStatus('upcoming');
          setTimeRemaining('--');
          return;
        }
        
        const raceDate = new Date(yearNum, monthNum - 1, dayNum, hoursNum, minsNum);
        const now = new Date();
        const diff = raceDate - now;

        if (diff < 0) {
          setStatus('finished');
          setTimeRemaining('Finalizada');
          return;
        }

        // Si faltan menos de 5 minutos
        if (diff < 5 * 60 * 1000) {
          setStatus('live');
          const minutes = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}m ${secs}s`);
          return;
        }

        // Si faltan menos de 30 minutos
        if (diff < 30 * 60 * 1000) {
          setStatus('soon');
          const minutes = Math.floor(diff / 60000);
          setTimeRemaining(`${minutes} minutos`);
          return;
        }

        // Si falta menos de 24 horas
        if (diff < 24 * 60 * 60 * 1000) {
          setStatus('upcoming');
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m`);
          } else {
            setTimeRemaining(`${minutes} minutos`);
          }
          return;
        }

        // Si falta más de 24 horas
        setStatus('upcoming');
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / 3600000);
        if (days > 0) {
          setTimeRemaining(`${days}d ${hours}h`);
        } else {
          setTimeRemaining(`${hours}h`);
        }
      } catch (error) {
        console.error('Error calculando tiempo:', error);
        setStatus('upcoming');
        setTimeRemaining('--');
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [carrera.fecha, carrera.hora]);

  // Colores según el estado
  const getStatusColors = () => {
    switch (status) {
      case 'live':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-400/50',
          text: 'text-red-400',
          icon: 'text-red-400',
          pulse: true
        };
      case 'soon':
        return {
          bg: 'bg-amber-500/20',
          border: 'border-amber-400/50',
          text: 'text-amber-400',
          icon: 'text-amber-400',
          pulse: false
        };
      case 'finished':
        return {
          bg: 'bg-slate-500/20',
          border: 'border-slate-400/50',
          text: 'text-slate-400',
          icon: 'text-slate-400',
          pulse: false
        };
      default:
        return {
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-400/50',
          text: 'text-emerald-400',
          icon: 'text-emerald-400',
          pulse: false
        };
    }
  };

  const statusColors = getStatusColors();
  const isDisabled = status === 'finished';

  return (
    <button
      onClick={() => !isDisabled && onSelect(carrera)}
      disabled={isDisabled}
      className={`group w-full text-left p-3 rounded-xl transition-all duration-300 ${
        isDisabled
          ? "bg-slate-900/20 border border-slate-800/30 opacity-50 cursor-not-allowed"
          : isSelected
          ? "bg-gradient-to-br from-emerald-500/25 via-emerald-600/20 to-slate-800/40 border-2 border-emerald-400/60 shadow-xl shadow-emerald-500/20 scale-[1.02]"
          : "bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
      }`}
    >
      {/* Header con badge y tiempo restante */}
      <div className="flex items-start justify-between mb-2">
        {/* Badge de número de carrera */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${
              isDisabled
                ? "bg-slate-800/30 text-slate-500 border border-slate-700/30"
                : isSelected
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                : "bg-slate-800/50 text-emerald-400 border border-emerald-400/40 group-hover:border-emerald-400/60"
            }`}
          >
            Carrera {carrera.num_carrera}
          </span>
          
          {/* Indicador de selección */}
          {isSelected && !isDisabled && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
          )}
        </div>

        {/* Tiempo restante */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${statusColors.bg} ${statusColors.border}`}>
          <Clock className={`w-3.5 h-3.5 ${statusColors.icon} ${statusColors.pulse ? 'animate-pulse' : ''}`} />
          <span className={`font-bold text-xs ${statusColors.text}`}>
            {status === 'live' && '¡En '}
            {timeRemaining}
            {status === 'live' && '!'}
          </span>
        </div>
      </div>

      {/* Hora y Fecha */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
          isDisabled
            ? "bg-slate-800/30 text-slate-500"
            : isSelected 
            ? "bg-slate-900/50 text-emerald-300" 
            : "bg-slate-800/50 text-slate-300 group-hover:text-emerald-400"
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span className="font-semibold text-xs">{carrera.hora}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
          isDisabled
            ? "bg-slate-800/20 text-slate-500"
            : isSelected 
            ? "bg-slate-900/30 text-slate-300" 
            : "bg-slate-800/30 text-slate-400"
        }`}>
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">{carrera.fecha}</span>
        </div>
      </div>

      {/* Info de caballos */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
        isDisabled
          ? "bg-slate-800/20 border border-slate-700/20"
          : isSelected
          ? "bg-slate-900/40 border border-emerald-500/30"
          : "bg-slate-800/30 border border-slate-700/30 group-hover:border-emerald-500/20"
      }`}>
        <div className={`p-1.5 rounded-md transition-all ${
          isDisabled
            ? "bg-slate-700/30"
            : isSelected 
            ? "bg-emerald-500/20" 
            : "bg-slate-700/50 group-hover:bg-emerald-500/10"
        }`}>
          <Users className={`w-3.5 h-3.5 transition-colors ${
            isDisabled
              ? "text-slate-500"
              : isSelected 
              ? "text-emerald-400" 
              : "text-slate-400 group-hover:text-emerald-400"
          }`} />
        </div>
        <span className={`font-medium text-xs transition-colors ${
          isDisabled
            ? "text-slate-500"
            : isSelected 
            ? "text-emerald-300" 
            : "text-slate-300 group-hover:text-emerald-400"
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
  const [iframeUrl, setIframeUrl] = useState(
    "public/canalcarreras.html?id=USANETWORK"
  );
  const [activeTab, setActiveTab] = useState("hipodromos");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    cargarDatos();
    cargarTransmisiones();
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
        if (jsonData.hipodromos.length > 0) {
          setSelectedHipodromo(jsonData.hipodromos[0].id);
        }
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
    if (!data || !selectedHipodromo) return [];
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

    const hipodromoInfo = getHipodromoInfo(carrera.id_hipodromo);
    const hipodromoNombre =
      hipodromoInfo?.descripcion || "Hipódromo desconocido";

    if (onSelectRace) {
      onSelectRace({
        ...carrera,
        horses: generatedHorses,
        descripcion_hipodromo: hipodromoNombre,
      });
    }
  };

  const handleSelectTransmision = (link) => {
    setIframeUrl(link);
    setIsMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin h-16 w-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="absolute inset-0 h-16 w-16 border-4 border-emerald-300/30 rounded-full mx-auto animate-pulse"></div>
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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
      {/* Main Content */}
      <div className="container mx-auto px-4 py-3 h-full flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Columna Izquierda - Transmisiones */}
          <div className="flex flex-col h-full">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 overflow-hidden flex flex-col h-full">
              {/* Header con botón PIP */}
              <div className="bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 border-b border-slate-800/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-bold text-white">
                      Transmisión en Vivo
                    </h2>
                  </div>
                </div>
              </div>

              {/* Iframe */}
              <div className="aspect-video bg-black flex-shrink-0">
                <iframe
                  src={iframeUrl}
                  className="w-full h-full border-0"
                  title="Visor Web"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>

              {/* Lista de transmisiones */}
              <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  {transmisiones.map((t, i) => {
                    const isActive = iframeUrl === t.link;
                    const isArg =
                      t.descripcion.toUpperCase().includes("ARG") ||
                      t.descripcion.toUpperCase().includes("ARGENTINA");

                    return (
                      <button
                        key={`transmision-${i}-${t.link}`}
                        onClick={() => handleSelectTransmision(t.link)}
                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/20"
                            : "bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`font-medium text-sm ${
                              isActive ? "text-white" : "text-slate-300"
                            }`}
                          >
                            {t.descripcion}
                          </p>
                          {isArg && (
                            <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded-full font-semibold shrink-0">
                              ARG
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Contenido */}
          <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 overflow-hidden flex flex-col h-full">
              <div className="grid grid-cols-3 bg-slate-800/30 flex-shrink-0">
                <button
                  onClick={() => setActiveTab("hipodromos")}
                  className={`py-3 px-4 font-semibold text-sm md:text-base transition-all ${
                    activeTab === "hipodromos"
                      ? "bg-gradient-to-b from-emerald-600 to-emerald-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  Hipódromos
                </button>
                <button
                  onClick={() => setActiveTab("carreras")}
                  className={`py-3 px-4 font-semibold text-sm md:text-base transition-all ${
                    activeTab === "carreras"
                      ? "bg-gradient-to-b from-emerald-600 to-emerald-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  Carreras
                </button>
                <button
                  onClick={() => setActiveTab("apuestas")}
                  className={`py-3 px-4 font-semibold text-sm md:text-base transition-all ${
                    activeTab === "apuestas"
                      ? "bg-gradient-to-b from-emerald-600 to-emerald-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  Apuestas
                </button>
              </div>

              {/* Contenido de Tabs */}
              <div className="p-4 md:p-6 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                {/* TAB: HIPÓDROMOS */}
                {activeTab === "hipodromos" && (
                  <div className="space-y-4">
                    {/* Filtros */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={selectedHipodromo || ""}
                        onChange={(e) => {
                          setSelectedHipodromo(e.target.value || null);
                          setSelectedCarrera(null);
                        }}
                        className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm font-medium cursor-pointer transition-all hover:border-emerald-500/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="">🏟️ Todos los hipódromos</option>
                        {data?.hipodromos.map((hip) => (
                          <option key={hip.id} value={hip.id}>
                            {hip.descripcion}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedFecha || ""}
                        onChange={(e) => {
                          setSelectedFecha(e.target.value || null);
                          setSelectedCarrera(null);
                        }}
                        className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm font-medium cursor-pointer transition-all hover:border-blue-500/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">📅 Todas las fechas</option>
                        {[...new Set(data?.carreras.map((c) => c.fecha))].map(
                          (fecha) => (
                            <option key={fecha} value={fecha}>
                              {fecha}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* Lista de Hipódromos */}
                    <div className="space-y-3">
                      {data?.hipodromos
                        .filter((hip) => {
                          if (selectedHipodromo && hip.id !== selectedHipodromo)
                            return false;
                          if (selectedFecha) {
                            return data.carreras.some(
                              (c) =>
                                c.id_hipodromo === hip.id &&
                                c.fecha === selectedFecha
                            );
                          }
                          return true;
                        })
                        .map((hip) => {
                          const carrerasCount = data.carreras.filter(
                            (c) => c.id_hipodromo === hip.id
                          ).length;
                          const isSelected = selectedHipodromo === hip.id;

                          return (
                            <div
                              key={`hipodromo-${hip.id}`}
                              className={`p-4 rounded-xl transition-all duration-300 ${
                                isSelected
                                  ? "bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                                  : "bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h3 className="font-bold text-white text-lg mb-1">
                                    {hip.descripcion}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>
                                      {carrerasCount} carreras programadas
                                    </span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                    Activo
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* TAB: CARRERAS */}
                {activeTab === "carreras" && (
                  <div className="space-y-4">
                    {carrerasDelHipodromo.length === 0 ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                            <TrendingUp className="w-10 h-10 text-emerald-400" />
                          </div>
                          <p className="text-lg font-semibold text-slate-200 mb-2">
                            No hay carreras disponibles
                          </p>
                          <p className="text-sm text-slate-400">
                            Selecciona un hipódromo en la pestaña Hipódromos
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {carrerasDelHipodromo.map((carrera) => {
                          const isSelected = selectedCarrera?.id === carrera.id;
                          return (
                            <CarreraCard
                              key={`carrera-${carrera.id}`}
                              carrera={carrera}
                              isSelected={isSelected}
                              onSelect={handleSelectCarrera}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: APUESTAS */}
                {activeTab === "apuestas" && (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center max-w-sm">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-600/20 to-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                        <DollarSign className="w-12 h-12 text-emerald-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">
                        Sistema de Apuestas
                      </h3>
                      <p className="text-slate-400 mb-6">
                        Próximamente podrás realizar y gestionar tus apuestas
                        desde aquí
                      </p>
                      <button className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                        Próximamente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
      `}</style>
    </div>
  );
};

export default RacesList;
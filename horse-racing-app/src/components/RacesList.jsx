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
  const [status, setStatus] = useState('upcoming');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      try {
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
          setTimeRemaining('Trasmisión en vivo');
          return;
        }

        if (diff < 5 * 60 * 1000) {
          setStatus('live');
          const minutes = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}m ${secs}s`);
          return;
        }

        if (diff < 30 * 60 * 1000) {
          setStatus('soon');
          const minutes = Math.floor(diff / 60000);
          setTimeRemaining(`${minutes} minutos`);
          return;
        }

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
          bg: 'bg-fuchsia-500/20',
          border: 'border-fuchsia-400/50',
          text: 'text-fuchsia-400',
          icon: 'text-fuchsia-400',
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
          ? "from-fuchsia-500/25 via-fuchsia-600/20 to-slate-800/40 border-2 border-fuchsia-400/60 shadow-xl shadow-fuchsia-500/20 scale-[1.02]"
          : "bg-slate-800/40 border border-slate-700/50 hover:border-fuchsia-500/50 hover:shadow-lg hover:shadow-fuchsia-500/10"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${
              isDisabled
                ? "bg-slate-800/30 text-slate-500 border border-slate-700/30"
                : isSelected
                ? "bg-gradient-to-r from-fuchsia-600 to-fuchsia-900 text-white shadow-lg shadow-fuchsia-500/30"
                : "bg-slate-800/50 text-fuchsia-400 border border-fuchsia-400/40 group-hover:border-fuchsia-400/60"
            }`}
          >
            Carrera {carrera.num_carrera}
          </span>
          
          {isSelected && !isDisabled && (
            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse shadow-lg shadow-fuchsia-400/50" />
          )}
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${statusColors.bg} ${statusColors.border}`}>
          <Clock className={`w-3.5 h-3.5 ${statusColors.icon} ${statusColors.pulse ? 'animate-pulse' : ''}`} />
          <span className={`font-bold text-xs ${statusColors.text}`}>
            {status === 'live' && '¡En '}
            {timeRemaining}
            {status === 'live' && '!'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
          isDisabled
            ? "bg-slate-800/30 text-slate-500"
            : isSelected 
            ? "bg-slate-900/50 text-fuchsia-300" 
            : "bg-slate-800/50 text-slate-300 group-hover:text-fuchsia-400"
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

      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
        isDisabled
          ? "bg-slate-800/20 border border-slate-700/20"
          : isSelected
          ? "bg-slate-900/40 border border-fuchsia-500/30"
          : "bg-slate-800/30 border border-slate-700/30 group-hover:border-fuchsia-500/20"
      }`}>
        <div className={`p-1.5 rounded-md transition-all ${
          isDisabled
            ? "bg-slate-700/30"
            : isSelected 
            ? "bg-fuchsia-500/20" 
            : "bg-slate-700/50 group-hover:bg-fuchsia-500/10"
        }`}>
          <Users className={`w-3.5 h-3.5 transition-colors ${
            isDisabled
              ? "text-slate-500"
              : isSelected 
              ? "text-fuchsia-400" 
              : "text-slate-400 group-hover:text-fuchsia-400"
          }`} />
        </div>
        <span className={`font-medium text-xs transition-colors ${
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
  const [iframeUrl, setIframeUrl] = useState(
    "public/canalcarreras.html?id=channel"
  );
  const [activeTab, setActiveTab] = useState("hipodromos");

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
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
                  }`}
                >
                  Hipódromos y Carreras
                </button>
                <button
                  onClick={() => setActiveTab("apuestas")}
                  className={`py-3 px-4 font-semibold text-sm md:text-base transition-all ${
                    activeTab === "apuestas"
                      ? "bg-gradient-to-b from-fuchsia-600 to-fuchsia-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  Apuestas
                </button>
              </div>

              <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === "hipodromos" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <select
                        value={selectedHipodromo || ""}
                        onChange={(e) => {
                          setSelectedHipodromo(e.target.value || null);
                          setSelectedCarrera(null);
                        }}
                        className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm font-medium cursor-pointer transition-all hover:border-fuchsia-500/50 focus:outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20"
                      >
                        <option value="">🏟️ Selecciona un hipódromo</option>
                        {data?.hipodromos
                          .filter((hip) => {
                            return data.carreras.some(
                              (c) => c.id_hipodromo === hip.id
                            );
                          })
                          .map((hip) => {
                            const carrerasCount = data.carreras.filter(
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
                            Elige un hipódromo del menú desplegable para ver sus carreras
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {data?.hipodromos
                          .filter((hip) => hip.id === selectedHipodromo)
                          .map((hip) => {
                            const carrerasCount = data.carreras.filter(
                              (c) => c.id_hipodromo === hip.id
                            ).length;

                            return (
                              <div
                                key={`hipodromo-${hip.id}`}
                                className="p-5 rounded-xl bg-gradient-to-r from-fuchsia-600/20 to-fuchsia-500/20 border-2 border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/10"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <h3 className="font-bold text-white text-xl mb-2">
                                      {hip.descripcion}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                      <TrendingUp className="w-4 h-4 text-fuchsia-400" />
                                      <span>
                                        {carrerasCount} carreras programadas
                                      </span>
                                    </div>
                                  </div>
                                  <div className="bg-fuchsia-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                    Activo
                                  </div>
                                </div>
                              </div>
                            );
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
                                  No hay carreras disponibles para este hipódromo
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
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "apuestas" && (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center max-w-sm">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-fuchsia-600/20 to-fuchsia-500/20 border-2 border-fuchsia-500/30 flex items-center justify-center mx-auto mb-6">
                        <DollarSign className="w-12 h-12 text-fuchsia-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">
                        Sistema de Apuestas
                      </h3>
                      <p className="text-slate-400 mb-6">
                        Próximamente podrás realizar y gestionar tus apuestas
                        desde aquí
                      </p>
                      <button className="px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white rounded-xl font-semibold hover:from-fuchsia-500 hover:to-fuchsia-400 transition-all shadow-lg shadow-fuchsia-500/20">
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
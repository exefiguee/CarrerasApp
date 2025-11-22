import { useState, useEffect } from "react";
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  MapPin,
  TrendingUp,
  Loader2,
  RefreshCw,
  Filter,
  Search,
} from "lucide-react";
import { db } from "../firebase/config";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

const UserBets = ({ userId }) => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [raceFilter, setRaceFilter] = useState("TODAS");
  const [searchTerm, setSearchTerm] = useState("");

  // 🔧 Utilidad: Verificar si es hoy
  const isToday = (fecha) => {
    if (!fecha) return false;
    try {
      const raceDate = fecha.toDate ? fecha.toDate() : new Date(fecha);
      const today = new Date();
      return (
        raceDate.getDate() === today.getDate() &&
        raceDate.getMonth() === today.getMonth() &&
        raceDate.getFullYear() === today.getFullYear()
      );
    } catch {
      return false;
    }
  };

  // 🔧 Utilidad: Formatear fecha de carrera
  const formatRaceDate = (fechaData) => {
    if (!fechaData) return "Sin fecha";
    
    try {
      // 🔥 ADAPTADO: Manejar la nueva estructura carrera.fechaTimestamp
      let date;
      
      if (fechaData.toDate) {
        // Es un Timestamp de Firebase
        date = fechaData.toDate();
      } else if (typeof fechaData === 'string') {
        // Es una cadena de fecha
        date = new Date(fechaData);
      } else if (fechaData instanceof Date) {
        // Ya es un objeto Date
        date = fechaData;
      } else {
        return "Fecha inválida";
      }

      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  // 🔧 Utilidad: Formatear fecha y hora
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "Fecha desconocida";
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  // 🔧 Calcular estadísticas
  const calculateStats = (betsData) => {
    const total = betsData.length;
    const pendientes = betsData.filter((b) => b.estado === "PENDIENTE").length;
    const ganadas = betsData.filter((b) => b.estado === "GANADA").length;
    const perdidas = betsData.filter((b) => b.estado === "PERDIDA").length;

    // 🔥 ADAPTADO: Usar la nueva estructura montos.montoTotal
    const totalApostado = betsData.reduce(
      (sum, b) => sum + (b.montos?.montoTotal || b.montoApostado || 0),
      0
    );

    // 🔥 ADAPTADO: Usar la nueva estructura resultado.gananciaReal
    const totalGanado = betsData.reduce(
      (sum, b) => sum + (b.resultado?.gananciaReal || b.gananciaReal || 0),
      0
    );

    const balance = totalGanado - totalApostado;
    const winRate = total > 0 ? ((ganadas / total) * 100).toFixed(1) : 0;

    return {
      total,
      pendientes,
      ganadas,
      perdidas,
      totalApostado,
      totalGanado,
      balance,
      winRate,
    };
  };

  // 🔧 Obtener carreras únicas
  const getUniqueRaces = (betsData) => {
    const uniqueRaces = {};
    
    betsData.forEach((bet) => {
      // 🔥 ADAPTADO: Usar la nueva estructura
      const hipodromoNombre = bet.hipodromo?.nombre || bet.hipodromoNombre || "Hipódromo";
      const numeroCarrera = bet.carrera?.numero || bet.numeroCarrera || 0;
      const fecha = bet.carrera?.fechaTimestamp || bet.fecha;
      
      const raceKey = `${hipodromoNombre}-${numeroCarrera}-${formatRaceDate(fecha)}`;
      
      if (!uniqueRaces[raceKey]) {
        uniqueRaces[raceKey] = {
          hipodromo: hipodromoNombre,
          numero: numeroCarrera,
          fecha: fecha,
          key: raceKey,
        };
      }
    });

    return Object.values(uniqueRaces).sort((a, b) => {
      try {
        const dateA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
        const dateB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
        return dateB - dateA;
      } catch {
        return 0;
      }
    });
  };

  // 🔧 Configuración de estados
  const getStatusConfig = (estado) => {
    const configs = {
      PENDIENTE: {
        icon: Clock,
        gradient: "from-yellow-500/20 to-amber-500/20",
        border: "border-yellow-500/40",
        text: "text-yellow-300",
        label: "Pendiente",
        emoji: "⏳",
      },
      GANADA: {
        icon: CheckCircle,
        gradient: "from-green-500/20 to-emerald-500/20",
        border: "border-green-500/40",
        text: "text-green-300",
        label: "Ganada",
        emoji: "✅",
      },
      PERDIDA: {
        icon: XCircle,
        gradient: "from-red-500/20 to-rose-500/20",
        border: "border-red-500/40",
        text: "text-red-300",
        label: "Perdida",
        emoji: "❌",
      },
      CANCELADA: {
        icon: AlertCircle,
        gradient: "from-slate-500/20 to-slate-600/20",
        border: "border-slate-500/40",
        text: "text-slate-300",
        label: "Cancelada",
        emoji: "⚠️",
      },
    };
    return configs[estado] || configs.PENDIENTE;
  };

  // 🔥 Cargar apuestas en tiempo real
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    console.log("🔥 Cargando apuestas para usuario:", userId);

    const betsRef = collection(db, "USUARIOS", userId, "APUESTAS");
    const q = query(betsRef, orderBy("timestamps.creacion", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userBets = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log(`📋 ${userBets.length} apuestas cargadas`);
        setBets(userBets);
        setStats(calculateStats(userBets));
        setLoading(false);
      },
      (error) => {
        console.error("❌ Error al cargar apuestas:", error);
        setLoading(false);
      }
    );

    return () => {
      console.log("🛑 Deteniendo listener de apuestas");
      unsubscribe();
    };
  }, [userId]);

  // 🔧 Filtrado de apuestas
  const filteredBets = bets
    .filter((bet) => {
      // Filtro por estado
      if (statusFilter !== "TODOS" && bet.estado !== statusFilter) return false;

      // Filtro por carrera
      if (raceFilter !== "TODAS") {
        const hipodromoNombre = bet.hipodromo?.nombre || bet.hipodromoNombre || "Hipódromo";
        const numeroCarrera = bet.carrera?.numero || bet.numeroCarrera || 0;
        const fecha = bet.carrera?.fechaTimestamp || bet.fecha;
        const betRaceKey = `${hipodromoNombre}-${numeroCarrera}-${formatRaceDate(fecha)}`;
        
        if (betRaceKey !== raceFilter) return false;
      }

      // Filtro por búsqueda
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const hipodromoNombre = bet.hipodromo?.nombre || bet.hipodromoNombre || "";
        const tipoApuesta = bet.tipoApuesta?.tipo || bet.tipoApuesta || "";
        const caballosTexto = bet.caballos?.texto || bet.caballosTexto || "";
        const numeroCarrera = bet.carrera?.numero || bet.numeroCarrera || "";
        
        return (
          hipodromoNombre.toLowerCase().includes(search) ||
          tipoApuesta.toLowerCase().includes(search) ||
          caballosTexto.toLowerCase().includes(search) ||
          numeroCarrera.toString().includes(search)
        );
      }

      return true;
    })
    .sort((a, b) => {
      try {
        const fechaA = a.carrera?.fechaTimestamp || a.fecha;
        const fechaB = b.carrera?.fechaTimestamp || b.fecha;
        const dateA = fechaA?.toDate ? fechaA.toDate() : new Date(fechaA);
        const dateB = fechaB?.toDate ? fechaB.toDate() : new Date(fechaB);
        return dateB - dateA;
      } catch {
        return 0;
      }
    });

  const races = getUniqueRaces(bets);
  const selectedRaceData = races.find((r) => r.key === raceFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-fuchsia-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Cargando apuestas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 shadow-lg">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Mis Apuestas</h1>
              <p className="text-slate-400 text-sm">Gestión completa de tus apuestas</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-fuchsia-400" />
                <span className="text-slate-400 text-sm">Total</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-slate-500 text-xs mt-1">apuestas realizadas</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <span className="text-slate-400 text-sm">Apostado</span>
              </div>
              <p className="text-2xl font-bold text-blue-300">
                ${stats.totalApostado.toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs mt-1">inversión total</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-slate-400 text-sm">Ganado</span>
              </div>
              <p className="text-2xl font-bold text-green-300">
                ${stats.totalGanado.toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs mt-1">en premios</p>
            </div>

            <div
              className={`bg-slate-800/50 backdrop-blur border rounded-xl p-4 ${
                stats.balance >= 0 ? "border-emerald-500/50" : "border-red-500/50"
              }`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp
                  className={`w-5 h-5 ${
                    stats.balance >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                />
                <span className="text-slate-400 text-sm">Balance</span>
              </div>
              <p
                className={`text-2xl font-bold ${
                  stats.balance >= 0 ? "text-emerald-300" : "text-red-300"
                }`}>
                ${stats.balance.toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs mt-1">{stats.winRate}% efectividad</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por hipódromo, carrera, caballos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Filtro por Estado */}
            <div>
              <label className="text-slate-400 text-sm font-medium mb-2 block">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50">
                <option value="TODOS">Todos los estados ({stats?.total || 0})</option>
                <option value="PENDIENTE">⏳ Pendientes ({stats?.pendientes || 0})</option>
                <option value="GANADA">✅ Ganadas ({stats?.ganadas || 0})</option>
                <option value="PERDIDA">❌ Perdidas ({stats?.perdidas || 0})</option>
              </select>
            </div>

            {/* Filtro por Carrera */}
            <div>
              <label className="text-slate-400 text-sm font-medium mb-2 block">Carrera</label>
              <select
                value={raceFilter}
                onChange={(e) => setRaceFilter(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50">
                <option value="TODAS">Todas las carreras ({races.length})</option>
                {races.map((race) => {
                  const raceBets = bets.filter((bet) => {
                    const hipodromoNombre = bet.hipodromo?.nombre || bet.hipodromoNombre || "";
                    const numeroCarrera = bet.carrera?.numero || bet.numeroCarrera || 0;
                    const fecha = bet.carrera?.fechaTimestamp || bet.fecha;
                    return `${hipodromoNombre}-${numeroCarrera}-${formatRaceDate(fecha)}` === race.key;
                  });
                  
                  return (
                    <option key={race.key} value={race.key}>
                      🏇 {race.hipodromo} - C#{race.numero} - {formatRaceDate(race.fecha)} (
                      {raceBets.length})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Info de carrera seleccionada */}
          {selectedRaceData && (
            <div className="bg-gradient-to-br from-fuchsia-600/20 to-fuchsia-500/20 border border-fuchsia-500/30 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-fuchsia-400" />
                  <span className="text-slate-300">{selectedRaceData.hipodromo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-fuchsia-400" />
                  <span className="text-slate-300">Carrera #{selectedRaceData.numero}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-fuchsia-400" />
                  <span className="text-slate-300">
                    {formatRaceDate(selectedRaceData.fecha)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-fuchsia-300 font-semibold">
                    {
                      bets.filter((b) => {
                        const hipodromoNombre = b.hipodromo?.nombre || b.hipodromoNombre || "";
                        const numeroCarrera = b.carrera?.numero || b.numeroCarrera || 0;
                        const fecha = b.carrera?.fechaTimestamp || b.fecha;
                        return `${hipodromoNombre}-${numeroCarrera}-${formatRaceDate(fecha)}` === raceFilter;
                      }).length
                    }{" "}
                    apuestas
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Apuestas */}
        <div className="space-y-4">
          {filteredBets.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-12 text-center">
              <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400 mb-2">
                No se encontraron apuestas
              </h3>
              <p className="text-sm text-slate-500">
                {searchTerm
                  ? "Intenta con otros términos de búsqueda"
                  : "No hay apuestas que coincidan con los filtros seleccionados"}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm">
                  Mostrando <span className="text-white font-semibold">{filteredBets.length}</span>{" "}
                  de <span className="text-white font-semibold">{stats.total}</span> apuestas
                </p>
              </div>

              {filteredBets.map((bet) => {
                const config = getStatusConfig(bet.estado);
                const StatusIcon = config.icon;
                
                // 🔥 ADAPTADO: Usar nueva estructura
                const hipodromoNombre = bet.hipodromo?.nombre || bet.hipodromoNombre || "Hipódromo";
                const numeroCarrera = bet.carrera?.numero || bet.numeroCarrera || 0;
                const fecha = bet.carrera?.fechaTimestamp || bet.fecha;
                const tipoApuesta = bet.tipoApuesta?.label || bet.tipoApuesta?.tipo || bet.tipoApuesta || "Apuesta";
                const caballosTexto = bet.caballos?.texto || bet.caballosTexto || "No disponible";
                const montoApostado = bet.montos?.montoTotal || bet.montoApostado || 0;
                const gananciaReal = bet.resultado?.gananciaReal || bet.gananciaReal || 0;
                const hasWinnings = bet.estado === "GANADA" && gananciaReal > 0;

                return (
                  <div
                    key={bet.id}
                    className={`bg-gradient-to-br ${config.gradient} border ${config.border} rounded-lg p-3.5 hover:shadow-xl transition-all`}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2.5 gap-3">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className={`p-1.5 rounded-lg bg-slate-900/60 border ${config.border} flex-shrink-0`}>
                          <StatusIcon className={`w-4 h-4 ${config.text}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={`font-bold text-sm ${config.text} mb-1.5`}>
                            {tipoApuesta}
                          </h3>
                          {/* Datos de la Carrera */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Hipódromo:</span>
                              <span className="text-white font-semibold">{hipodromoNombre}</span>
                            </div>
                            <span className="text-slate-600">•</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Carrera:</span>
                              <span className="text-white font-semibold">#{numeroCarrera}</span>
                            </div>
                            <span className="text-slate-600">•</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Fecha:</span>
                              <span className="text-white font-semibold">
                                {formatRaceDate(fecha)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md border ${config.border} ${config.text} text-xs font-semibold mb-1.5 whitespace-nowrap`}>
                          {config.label}
                        </span>
                        <div className="bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 rounded-md px-2.5 py-1.5 border border-fuchsia-500/30">
                          <p className="text-slate-400 text-xs leading-none">Apostado</p>
                          <p className="text-fuchsia-300 font-bold text-base mt-0.5 whitespace-nowrap">
                            ${montoApostado.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Información detallada de la apuesta */}
                    <div className="space-y-2.5 mt-2.5">
                      
                      {/* Caballos Seleccionados */}
                      <div className="bg-slate-900/40 rounded-md px-3 py-2 border border-slate-700/50">
                        <p className="text-slate-500 text-xs mb-1.5 font-semibold">🐴 Caballos seleccionados</p>
                        <p className="text-white text-sm font-semibold leading-snug break-words">
                          {caballosTexto}
                        </p>
                        
                        {/* Mostrar detalles de caballos con jockeys si están disponibles */}
                        {bet.caballos?.seleccionados && bet.caballos.seleccionados.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {bet.caballos.seleccionados.map((caballo, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">
                                  #{caballo.numero} {caballo.nombre}
                                </span>
                                {caballo.jockey && (
                                  <span className="text-slate-500 italic">
                                    {caballo.jockey}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Detalles por Posición (para EXACTA, IMPERFECTA, TRIFECTA, etc) */}
                      {bet.caballos?.detalleGrupos && !bet.esApuestaMultiCarrera && (
                        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-md px-3 py-2 border border-blue-500/30">
                          <p className="text-blue-300 text-xs mb-2 font-semibold">📊 Distribución por posición</p>
                          <div className="space-y-1.5">
                            {Object.entries(bet.caballos.detalleGrupos).map(([position, horses]) => {
                              if (!Array.isArray(horses) || horses.length === 0) return null;
                              const posNum = position.replace('position', '');
                              return (
                                <div key={position} className="flex items-start gap-2">
                                  <span className="text-blue-400 font-bold text-xs min-w-[20px]">
                                    {posNum}°:
                                  </span>
                                  <span className="text-slate-300 text-xs">
                                    {horses.map(h => `#${h.numero} ${h.nombre}`).join(', ')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Detalles Multi-Carrera (para DOBLE, TRIPLO, PICK) */}
                      {bet.esApuestaMultiCarrera && bet.caballos?.detalleGrupos && (
                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-md px-3 py-2 border border-purple-500/30">
                          <p className="text-purple-300 text-xs mb-2 font-semibold">🏇 Apuesta multi-carrera</p>
                          <div className="space-y-2">
                            {Object.entries(bet.caballos.detalleGrupos).map(([raceKey, raceData]) => {
                              if (!raceData?.caballos) return null;
                              const raceNum = raceKey.replace('race', '');
                              return (
                                <div key={raceKey} className="bg-slate-900/40 rounded px-2 py-1.5">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-purple-400 font-bold text-xs">
                                      Carrera {raceData.carrera?.numero || raceNum}:
                                    </span>
                                    {raceData.carrera && (
                                      <span className="text-slate-500 text-xs">
                                        {raceData.carrera.hipodromo} - {raceData.carrera.fecha}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-300 text-xs">
                                    {raceData.caballos.map(h => `#${h.numero} ${h.nombre}`).join(', ')}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Montos y Combinaciones */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Combinaciones */}
                        {bet.montos?.numeroCombinaciones && bet.montos.numeroCombinaciones > 1 && (
                          <div className="bg-amber-500/10 rounded-md px-3 py-2 border border-amber-500/30">
                            <p className="text-slate-400 text-xs leading-none mb-1">Combinaciones</p>
                            <p className="text-amber-300 font-bold text-lg">
                              {bet.montos.numeroCombinaciones}
                            </p>
                          </div>
                        )}
                        
                        {/* Monto por Combinación */}
                        {bet.montos?.montoPorCombinacion && (
                          <div className="bg-blue-500/10 rounded-md px-3 py-2 border border-blue-500/30">
                            <p className="text-slate-400 text-xs leading-none mb-1">
                              {bet.montos.numeroCombinaciones > 1 ? 'Por combinación' : 'Monto base'}
                            </p>
                            <p className="text-blue-300 font-bold text-lg">
                              ${bet.montos.montoPorCombinacion.toLocaleString()}
                            </p>
                          </div>
                        )}

                        {/* Sistema de VALES */}
                        {bet.montos?.usaVales && bet.montos.valesApostados > 0 && (
                          <div className="bg-purple-500/10 rounded-md px-3 py-2 border border-purple-500/30">
                            <p className="text-slate-400 text-xs leading-none mb-1">🎟️ Vales</p>
                            <p className="text-purple-300 font-bold text-lg">
                              {bet.montos.valesApostados}
                            </p>
                            {bet.montos.dividendo && (
                              <p className="text-slate-500 text-xs mt-1">
                                Dividendo: ${bet.montos.dividendo}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Ganancia Potencial */}
                      
                      </div>

                      {/* Cálculo detallado */}
                      {bet.montos?.numeroCombinaciones > 1 && (
                        <div className="bg-slate-900/60 rounded-md px-3 py-2 border border-slate-700/30">
                          <p className="text-slate-500 text-xs">
                            💡 Cálculo: ${bet.montos.montoPorCombinacion.toLocaleString()} × {bet.montos.numeroCombinaciones} combinaciones = ${montoApostado.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {/* Información adicional de la carrera */}
                      {bet.carreraMetadata && (
                        <div className="bg-slate-900/40 rounded-md px-3 py-2 border border-slate-700/50">
                          <p className="text-slate-500 text-xs mb-1.5 font-semibold">ℹ️ Detalles de la carrera</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {bet.carreraMetadata.totalCaballos > 0 && (
                              <div>
                                <span className="text-slate-500">Total caballos:</span>{' '}
                                <span className="text-white font-semibold">{bet.carreraMetadata.totalCaballos}</span>
                              </div>
                            )}
                            {bet.carreraMetadata.distancia && (
                              <div>
                                <span className="text-slate-500">Distancia:</span>{' '}
                                <span className="text-white font-semibold">{bet.carreraMetadata.distancia}</span>
                              </div>
                            )}
                            {bet.carreraMetadata.tipo && (
                              <div>
                                <span className="text-slate-500">Tipo:</span>{' '}
                                <span className="text-white font-semibold">{bet.carreraMetadata.tipo}</span>
                              </div>
                            )}
                            {bet.carreraMetadata.premio && (
                              <div>
                                <span className="text-slate-500">Premio:</span>{' '}
                                <span className="text-white font-semibold">{bet.carreraMetadata.premio}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Ganancia Real (si ganó) */}
                      {hasWinnings && (
                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-md px-3 py-2.5 border-2 border-green-500/50">
                          <p className="text-green-400 text-xs mb-1 font-semibold">🎉 ¡Apuesta Ganadora!</p>
                          <p className="text-green-300 font-bold text-2xl">
                            ${gananciaReal.toLocaleString()}
                          </p>
                          <p className="text-slate-400 text-xs mt-1">
                            Beneficio neto: ${(gananciaReal - montoApostado).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {/* Fecha de creación de la apuesta */}
                      {bet.timestamps?.creacionISO && (
                        <div className="text-center">
                          <p className="text-slate-500 text-xs">
                            Apuesta realizada: {formatDateTime(bet.timestamps.unix || Date.now())}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserBets;
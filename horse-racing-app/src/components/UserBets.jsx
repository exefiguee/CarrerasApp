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
import { collection, query, onSnapshot } from "firebase/firestore";

const UserBets = ({ userId }) => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [raceFilter, setRaceFilter] = useState("TODAS");
  const [searchTerm, setSearchTerm] = useState("");

  // Utilidades
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

  const formatRaceDate = (fechaTimestamp) => {
    if (!fechaTimestamp) return "Sin fecha";
    try {
      const date = fechaTimestamp.toDate ? fechaTimestamp.toDate() : new Date(fechaTimestamp);
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Fecha inválida";
    }
  };

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

  const calculateStats = (betsData) => {
    const total = betsData.length;
    const pendientes = betsData.filter((b) => b.estado === "PENDIENTE").length;
    const ganadas = betsData.filter((b) => b.estado === "GANADA").length;
    const perdidas = betsData.filter((b) => b.estado === "PERDIDA").length;
    const totalApostado = betsData.reduce((sum, b) => sum + (b.montoApostado || 0), 0);
    const totalGanado = betsData.reduce((sum, b) => sum + (b.gananciaReal || 0), 0);
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

  const getUniqueRaces = (betsData) => {
    const uniqueRaces = {};
    betsData.forEach((bet) => {
      const raceKey = `${bet.hipodromoNombre}-${bet.numeroCarrera}-${formatRaceDate(bet.fecha)}`;
      if (!uniqueRaces[raceKey]) {
        uniqueRaces[raceKey] = {
          hipodromo: bet.hipodromoNombre,
          numero: bet.numeroCarrera,
          fecha: bet.fecha,
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

  // Configuración de estados
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

  // Cargar apuestas
  useEffect(() => {
    if (!userId) return;

    const betsRef = collection(db, "USUARIOS", userId, "APUESTAS");
    const q = query(betsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userBets = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBets(userBets);
        setStats(calculateStats(userBets));
        setLoading(false);
      },
      (error) => {
        console.error("Error al cargar apuestas:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Filtrado de apuestas
  const filteredBets = bets
    .filter((bet) => {
      // Filtro por estado
      if (statusFilter !== "TODOS" && bet.estado !== statusFilter) return false;

      // Filtro por carrera
      if (raceFilter !== "TODAS") {
        const betRaceKey = `${bet.hipodromoNombre}-${bet.numeroCarrera}-${formatRaceDate(bet.fecha)}`;
        if (betRaceKey !== raceFilter) return false;
      }

      // Filtro por búsqueda
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          bet.hipodromoNombre?.toLowerCase().includes(search) ||
          bet.tipoApuesta?.toLowerCase().includes(search) ||
          bet.caballosTexto?.toLowerCase().includes(search) ||
          bet.numeroCarrera?.toString().includes(search)
        );
      }

      return true;
    })
    .sort((a, b) => {
      try {
        const dateA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
        const dateB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
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
          {/* <button
            onClick={() => window.location.reload()}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all">
            <RefreshCw className="w-5 h-5" />
          </button> */}
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

            <div className={`bg-slate-800/50 backdrop-blur border rounded-xl p-4 ${stats.balance >= 0 ? "border-emerald-500/50" : "border-red-500/50"
              }`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-5 h-5 ${stats.balance >= 0 ? "text-emerald-400" : "text-red-400"}`} />
                <span className="text-slate-400 text-sm">Balance</span>
              </div>
              <p className={`text-2xl font-bold ${stats.balance >= 0 ? "text-emerald-300" : "text-red-300"}`}>
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
                  const raceBets = bets.filter(
                    (bet) => `${bet.hipodromoNombre}-${bet.numeroCarrera}-${formatRaceDate(bet.fecha)}` === race.key
                  );
                  return (
                    <option key={race.key} value={race.key}>
                      🏇 {race.hipodromo} - C#{race.numero} - {formatRaceDate(race.fecha)} ({raceBets.length})
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
                  <span className="text-slate-300">{formatRaceDate(selectedRaceData.fecha)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-fuchsia-300 font-semibold">
                    {bets.filter(b => `${b.hipodromoNombre}-${b.numeroCarrera}-${formatRaceDate(b.fecha)}` === raceFilter).length} apuestas
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
              <h3 className="text-xl font-bold text-slate-400 mb-2">No se encontraron apuestas</h3>
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
                  Mostrando <span className="text-white font-semibold">{filteredBets.length}</span> de{" "}
                  <span className="text-white font-semibold">{stats.total}</span> apuestas
                </p>
              </div>

              {filteredBets.map((bet) => {
                const config = getStatusConfig(bet.estado);
                const StatusIcon = config.icon;
                const hasWinnings = bet.estado === "GANADA" && bet.gananciaReal > 0;

                return (
                  <div key={bet.id} className={`bg-gradient-to-br ${config.gradient} border ${config.border} rounded-lg p-3.5 hover:shadow-xl transition-all`}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2.5 gap-3">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className={`p-1.5 rounded-lg bg-slate-900/60 border ${config.border} flex-shrink-0`}>
                          <StatusIcon className={`w-4 h-4 ${config.text}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={`font-bold text-sm ${config.text} mb-1.5`}>{bet.tipoApuesta}</h3>

                          {/* Datos de la Carrera */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Hipódromo:</span>
                              <span className="text-white font-semibold">{bet.hipodromoNombre}</span>
                            </div>
                            <span className="text-slate-600">•</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Carrera:</span>
                              <span className="text-white font-semibold">#{bet.numeroCarrera}</span>
                            </div>
                            <span className="text-slate-600">•</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Fecha:</span>
                              <span className="text-white font-semibold">{formatRaceDate(bet.fecha)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block px-2.5 py-1 rounded-md border ${config.border} ${config.text} text-xs font-semibold mb-1.5 whitespace-nowrap`}>
                          {config.label}
                        </span>
                        <div className="bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 rounded-md px-2.5 py-1.5 border border-fuchsia-500/30">
                          <p className="text-slate-400 text-xs leading-none">Apostado</p>
                          <p className="text-fuchsia-300 font-bold text-base mt-0.5 whitespace-nowrap">${bet.montoApostado?.toLocaleString() || "0"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Caballos */}
                    <div className="bg-slate-900/40 rounded-md px-3 py-2 border border-slate-700/50">
                      <p className="text-slate-500 text-xs mb-1">Caballos seleccionados</p>
                      <p className="text-white text-sm font-semibold leading-snug break-words">{bet.caballosTexto || "No disponible"}</p>
                    </div>

                    {/* Ganancia */}
                    {hasWinnings && (
                      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-md px-3 py-2 border border-green-500/30 mt-2.5">
                        <p className="text-slate-400 text-xs mb-1">Ganancia obtenida</p>
                        <p className="text-green-300 font-bold text-lg">${bet.gananciaReal?.toLocaleString() || "0"}</p>
                      </div>
                    )}
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
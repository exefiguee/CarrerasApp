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
  CalendarDays,
  History,
} from "lucide-react";
import { db } from "../firebase/config";
import { collection, query, onSnapshot } from "firebase/firestore";

const UserBets = ({ userId }) => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("TODOS");
  const [selectedRace, setSelectedRace] = useState("TODAS");
  const [races, setRaces] = useState([]);
  const [activeTab, setActiveTab] = useState("todas");

  // Funciones de utilidad primero
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
      if (
        fechaTimestamp.toDate &&
        typeof fechaTimestamp.toDate === "function"
      ) {
        const date = fechaTimestamp.toDate();
        return date.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }

      if (typeof fechaTimestamp === "number") {
        const date = new Date(fechaTimestamp);
        return date.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }

      if (typeof fechaTimestamp === "string") {
        const date = new Date(fechaTimestamp);
        return date.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }

      return "Fecha no disponible";
    } catch (error) {
      console.error("Error al formatear fecha de carrera:", error);
      return "Fecha inválida";
    }
  };

  const updateStats = (betsData) => {
    const total = betsData.length;
    const pendientes = betsData.filter((b) => b.estado === "PENDIENTE").length;
    const ganadas = betsData.filter((b) => b.estado === "GANADA").length;
    const perdidas = betsData.filter((b) => b.estado === "PERDIDA").length;
    const totalApostado = betsData.reduce(
      (sum, b) => sum + (b.montoApostado || 0),
      0
    );
    const totalGanado = betsData.reduce(
      (sum, b) => sum + (b.gananciaReal || 0),
      0
    );

    // Calcular stats filtradas según el tab activo
    const filteredByTab = betsData.filter((bet) => {
      if (activeTab === "hoy") return isToday(bet.fecha);
      if (activeTab === "jugadas") return bet.estado !== "PENDIENTE";
      return true;
    });

    const filteredPendientes = filteredByTab.filter(
      (b) => b.estado === "PENDIENTE"
    ).length;
    const filteredGanadas = filteredByTab.filter(
      (b) => b.estado === "GANADA"
    ).length;
    const filteredPerdidas = filteredByTab.filter(
      (b) => b.estado === "PERDIDA"
    ).length;

    setStats({
      total,
      pendientes,
      ganadas,
      perdidas,
      totalApostado,
      totalGanado,
      filteredPendientes,
      filteredGanadas,
      filteredPerdidas,
    });

    // Extraer carreras únicas
    const uniqueRaces = {};
    betsData.forEach((bet) => {
      const raceKey = `${bet.hipodromoNombre}-${
        bet.numeroCarrera
      }-${formatRaceDate(bet.fecha)}`;
      if (!uniqueRaces[raceKey]) {
        uniqueRaces[raceKey] = {
          hipodromo: bet.hipodromoNombre,
          numero: bet.numeroCarrera,
          fecha: bet.fecha,
          hora: bet.hora,
          key: raceKey,
        };
      }
    });

    setRaces(
      Object.values(uniqueRaces).sort((a, b) => {
        try {
          const dateA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
          const dateB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
          return dateB - dateA;
        } catch {
          return 0;
        }
      })
    );
  };

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
        updateStats(userBets);
        setLoading(false);
      },
      (error) => {
        console.error("Error al escuchar apuestas:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (bets.length > 0) {
      updateStats(bets);
    }
  }, [activeTab]);

  const getStatusConfig = (estado) => {
    const configs = {
      PENDIENTE: {
        icon: Clock,
        bg: "from-yellow-500/20 to-amber-500/20",
        border: "border-yellow-500/40",
        text: "text-yellow-300",
        label: "Pendiente",
      },
      GANADA: {
        icon: CheckCircle,
        bg: "from-green-500/20 to-emerald-500/20",
        border: "border-green-500/40",
        text: "text-green-300",
        label: "Ganada",
      },
      PERDIDA: {
        icon: XCircle,
        bg: "from-red-500/20 to-rose-500/20",
        border: "border-red-500/40",
        text: "text-red-300",
        label: "Perdida",
      },
      CANCELADA: {
        icon: AlertCircle,
        bg: "from-slate-500/20 to-slate-600/20",
        border: "border-slate-500/40",
        text: "text-slate-300",
        label: "Cancelada",
      },
    };
    return configs[estado] || configs.PENDIENTE;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Fecha desconocida";

    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Fecha inválida";
    }
  };

  const filteredBets = bets
    .filter((bet) => {
      if (activeTab === "hoy" && !isToday(bet.fecha)) return false;
      if (activeTab === "jugadas" && bet.estado === "PENDIENTE") return false;
      if (filter !== "TODOS" && bet.estado !== filter) return false;
      if (selectedRace !== "TODAS") {
        const betRaceKey = `${bet.hipodromoNombre}-${
          bet.numeroCarrera
        }-${formatRaceDate(bet.fecha)}`;
        if (betRaceKey !== selectedRace) return false;
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

  const todayRaces = races.filter((race) => isToday(race.fecha));
  const playedRaces = races.filter((race) => {
    const raceBets = bets.filter(
      (bet) =>
        `${bet.hipodromoNombre}-${bet.numeroCarrera}-${formatRaceDate(
          bet.fecha
        )}` === race.key
    );
    return raceBets.some((bet) => bet.estado !== "PENDIENTE");
  });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 shadow-lg">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-2xl font-bold text-white">
                Mis Apuestas
              </h1>
              <p className="text-slate-400 text-sm">Actualizadas en vivo 🔥</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 transition-all">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className="w-4 h-4 text-fuchsia-400" />
                <span className="text-slate-300 text-xs font-medium">
                  Total
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-slate-400 text-[10px] mt-0.5">apuestas</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300 text-xs font-medium">
                  Apostado
                </span>
              </div>
              <p className="text-xl font-bold text-blue-300">
                ${stats.totalApostado.toLocaleString()}
              </p>
              <p className="text-slate-400 text-[10px] mt-0.5">inversión</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-slate-300 text-xs font-medium">
                  Ganado
                </span>
              </div>
              <p className="text-xl font-bold text-green-300">
                ${stats.totalGanado.toLocaleString()}
              </p>
              <p className="text-slate-400 text-[10px] mt-0.5">ganancias</p>
            </div>

            <div
              className={`bg-gradient-to-br ${
                stats.totalGanado - stats.totalApostado >= 0
                  ? "from-emerald-500/20 to-green-500/20 border-emerald-500/30"
                  : "from-red-500/20 to-rose-500/20 border-red-500/30"
              } border rounded-lg p-3`}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp
                  className={`w-4 h-4 ${
                    stats.totalGanado - stats.totalApostado >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                />
                <span className="text-slate-300 text-xs font-medium">
                  Balance
                </span>
              </div>
              <p
                className={`text-xl font-bold ${
                  stats.totalGanado - stats.totalApostado >= 0
                    ? "text-emerald-300"
                    : "text-red-300"
                }`}>
                ${(stats.totalGanado - stats.totalApostado).toLocaleString()}
              </p>
              <p className="text-slate-400 text-[10px] mt-0.5">
                {stats.total > 0
                  ? `${((stats.ganadas / stats.total) * 100).toFixed(
                      1
                    )}% ganadas`
                  : "sin datos"}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700/50 pb-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("todas");
              setSelectedRace("TODAS");
              setFilter("TODOS");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "todas"
                ? "bg-fuchsia-500/20 text-fuchsia-300 border-b-2 border-fuchsia-500"
                : "text-slate-400 hover:text-slate-300"
            }`}>
            <Trophy className="w-4 h-4" />
            Todas las Carreras
          </button>
          <button
            onClick={() => {
              setActiveTab("hoy");
              setSelectedRace("TODAS");
              setFilter("TODOS");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "hoy"
                ? "bg-blue-500/20 text-blue-300 border-b-2 border-blue-500"
                : "text-slate-400 hover:text-slate-300"
            }`}>
            <CalendarDays className="w-4 h-4" />
            Carreras de Hoy
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Estado Filter */}
          <div>
            <label className="text-slate-400 text-xs font-medium mb-2 block">
              Filtrar por estado
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {["TODOS", "PENDIENTE", "GANADA", "PERDIDA"].map((status) => {
                let count = 0;
                if (status === "PENDIENTE")
                  count = stats?.filteredPendientes || 0;
                else if (status === "GANADA")
                  count = stats?.filteredGanadas || 0;
                else if (status === "PERDIDA")
                  count = stats?.filteredPerdidas || 0;

                return (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs whitespace-nowrap transition-all ${
                      filter === status
                        ? "bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white shadow-lg"
                        : "bg-slate-800/50 text-slate-300 border border-slate-700/50"
                    }`}>
                    {status === "TODOS" ? "Todas" : status}
                    {status !== "TODOS" && (
                      <span className="ml-1 opacity-75">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Carrera Filter */}
          {((activeTab === "todas" && races.length > 0) ||
            (activeTab === "hoy" && todayRaces.length > 0) ||
            (activeTab === "jugadas" && playedRaces.length > 0)) && (
            <div>
              <label className="text-slate-400 text-xs font-medium mb-2 block">
                Filtrar por carrera
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                <button
                  onClick={() => setSelectedRace("TODAS")}
                  className={`p-2 rounded-lg text-left transition-all ${
                    selectedRace === "TODAS"
                      ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg"
                      : "bg-slate-800/50 text-slate-300 border border-slate-700/50"
                  }`}>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs truncate">Todas</p>
                      <p className="text-[10px] opacity-75">
                        {activeTab === "todas"
                          ? races.length
                          : activeTab === "hoy"
                          ? todayRaces.length
                          : playedRaces.length}{" "}
                        carreras
                      </p>
                    </div>
                  </div>
                </button>

                {(activeTab === "todas"
                  ? races
                  : activeTab === "hoy"
                  ? todayRaces
                  : playedRaces
                ).map((race) => {
                  const raceBets = bets.filter(
                    (bet) =>
                      `${bet.hipodromoNombre}-${
                        bet.numeroCarrera
                      }-${formatRaceDate(bet.fecha)}` === race.key
                  );
                  return (
                    <button
                      key={race.key}
                      onClick={() => setSelectedRace(race.key)}
                      className={`p-3 rounded-lg transition-all w-full ${
                        selectedRace === race.key
                          ? "bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white shadow-lg"
                          : "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:border-fuchsia-500/30"
                      }`}>
                      <div className="flex flex-col gap-2">
                        {/* Hipódromo */}
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 opacity-80 flex-shrink-0" />
                          <span className="font-bold text-sm truncate">
                            {race.hipodromo}
                          </span>
                        </div>

                        {/* Carrera */}
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 opacity-80" />
                          <span className="font-semibold text-sm">
                            Carrera #{race.numero}
                          </span>
                        </div>

                        {/* Fecha */}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 opacity-80" />
                          <span className="text-sm">
                            {formatRaceDate(race.fecha)}
                          </span>
                        </div>

                        {/* Cantidad de apuestas */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-slate-700/40 px-2 py-0.5 rounded-md">
                            {raceBets.length} apuestas
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bets List */}
        <div className="space-y-3">
          {filteredBets.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-8 text-center">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-400 mb-2">
                No hay apuestas
              </h3>
              <p className="text-sm text-slate-500">
                {activeTab === "hoy"
                  ? "No tienes apuestas para carreras de hoy"
                  : activeTab === "jugadas"
                  ? "Aún no has realizado ninguna apuesta"
                  : `No tienes apuestas con estado: ${filter}`}
              </p>
            </div>
          ) : (
            filteredBets.map((bet) => {
              const statusConfig = getStatusConfig(bet.estado);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={bet.id}
                  className={`bg-gradient-to-br ${statusConfig.bg} border ${statusConfig.border} rounded-xl p-4 space-y-3 hover:shadow-xl transition-all`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-lg bg-slate-900/70 border ${statusConfig.border}`}>
                        <StatusIcon
                          className={`w-4 h-4 ${statusConfig.text}`}
                        />
                      </div>
                      <div>
                        <h3
                          className={`font-bold text-sm ${statusConfig.text}`}>
                          {bet.tipoApuesta}
                        </h3>
                        <p className="text-slate-400 text-[10px] flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDate(bet.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-lg border ${statusConfig.border} ${statusConfig.text} text-[10px] font-bold`}>
                      {statusConfig.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        <p className="text-slate-500 text-[10px]">Hipódromo</p>
                      </div>
                      <p className="text-white font-bold text-xs truncate">
                        {bet.hipodromoNombre}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Trophy className="w-3 h-3 text-purple-400" />
                        <p className="text-slate-500 text-[10px]">Carrera</p>
                      </div>
                      <p className="text-white font-bold text-xs">
                        #{bet.numeroCarrera}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar className="w-3 h-3 text-fuchsia-400" />
                        <p className="text-slate-500 text-[10px]">Fecha</p>
                      </div>
                      <p className="text-white font-bold text-[10px] truncate">
                        {formatRaceDate(bet.fecha)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                    <p className="text-slate-400 text-[10px] mb-1">Caballos:</p>
                    <p className="text-white font-semibold text-xs">
                      {bet.caballosTexto || "No disponible"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 rounded-lg p-2 border border-fuchsia-500/30">
                      <p className="text-slate-400 text-[10px] mb-0.5">
                        Apostado
                      </p>
                      <p className="text-fuchsia-300 font-bold text-lg">
                        ${bet.montoApostado?.toLocaleString() || "0"}
                      </p>
                    </div>

                    {bet.estado === "GANADA" && bet.gananciaReal > 0 && (
                      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-2 border border-green-500/30">
                        <p className="text-slate-400 text-[10px] mb-0.5">
                          Ganancia
                        </p>
                        <p className="text-green-300 font-bold text-lg">
                          ${bet.gananciaReal?.toLocaleString() || "0"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default UserBets;

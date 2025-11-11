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
} from "lucide-react";
import betService from "../services/betService";

const UserBets = ({ userId }) => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("TODOS");

  useEffect(() => {
    loadBets();
  }, [userId]);

  const loadBets = async () => {
    setLoading(true);
    try {
      const userBets = await betService.getUserBets(userId);
      const userStats = await betService.getUserBetStats(userId);
      setBets(userBets);
      setStats(userStats);
    } catch (error) {
      console.error("Error al cargar apuestas:", error);
    } finally {
      setLoading(false);
    }
  };

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
    const date = new Date(timestamp);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredBets = bets.filter(
    (bet) => filter === "TODOS" || bet.estado === filter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-fuchsia-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Cargando apuestas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Mis Apuestas</h1>
              <p className="text-slate-400">
                Historial completo de tus apuestas
              </p>
            </div>
          </div>
          <button
            onClick={loadBets}
            className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 transition-all">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Estadísticas */}
        {/* {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-fuchsia-400" />
                <span className="text-slate-400 text-sm">Total Apuestas</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-slate-400 text-sm">Pendientes</span>
              </div>
              <p className="text-2xl font-bold text-yellow-300">
                {stats.pendientes}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-slate-400 text-sm">Ganadas</span>
              </div>
              <p className="text-2xl font-bold text-green-300">
                {stats.ganadas}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-slate-400 text-sm">Perdidas</span>
              </div>
              <p className="text-2xl font-bold text-red-300">
                {stats.perdidas}
              </p>
            </div>
          </div>
        )} */}

        {/* Resumen financiero */}
        {stats && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-fuchsia-500/20 to-slate-800/40 border border-fuchsia-500/30 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-fuchsia-400" />
                  <span className="text-slate-300 font-semibold">
                    Total Apostado
                  </span>
                </div>
                <p className="text-2xl font-bold text-fuchsia-300">
                  ${stats.totalApostado.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <span className="text-slate-300 font-semibold">
                    Total Ganado
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-300">
                  ${stats.totalGanado.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        {/* <div className="flex gap-2 overflow-x-auto pb-2">
          {["TODOS", "PENDIENTE", "GANADA", "PERDIDA"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                filter === status
                  ? "bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white shadow-lg"
                  : "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:border-fuchsia-500/50"
              }`}>
              {status === "TODOS" ? "Todas" : status}
            </button>
          ))}
        </div> */}

        {/* Lista de apuestas */}
        <div className="space-y-4">
          {filteredBets.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-12 text-center">
              <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400 mb-2">
                No hay apuestas
              </h3>
              <p className="text-slate-500">
                {filter === "TODOS"
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
                  className={`bg-gradient-to-br ${statusConfig.bg} border-2 ${statusConfig.border} rounded-xl p-5 space-y-4 hover:shadow-xl transition-all`}>
                  {/* Header de la apuesta */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg bg-slate-800/50 border ${statusConfig.border}`}>
                        <StatusIcon className={`w-5 h-5 ${statusConfig.text}`} />
                      </div>
                      <div>
                        <h3 className={`font-bold text-lg ${statusConfig.text}`}>
                          {bet.tipoApuesta}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {formatDate(bet.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-lg border ${statusConfig.border} ${statusConfig.text} text-sm font-bold`}>
                      {statusConfig.label}
                    </div>
                  </div>

                  {/* Detalles de la carrera */}
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-slate-500 text-xs">Hipódromo</p>
                        <p className="text-white font-semibold text-sm">
                          {bet.hipodromoNombre}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-slate-500 text-xs">Carrera</p>
                        <p className="text-white font-semibold text-sm">
                          #{bet.numeroCarrera}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-slate-500 text-xs">Fecha</p>
                        <p className="text-white font-semibold text-sm">
                          {bet.fecha} • {bet.hora}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Caballos seleccionados */}
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs mb-2">
                      Caballos apostados:
                    </p>
                    <p className="text-white font-semibold">{bet.caballosTexto}</p>
                  </div>

                  {/* Montos */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                      <p className="text-slate-400 text-xs mb-1">Apostado</p>
                      <p className="text-fuchsia-300 font-bold text-xl">
                        ${bet.montoApostado.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                      <p className="text-slate-400 text-xs mb-1">
                        {bet.estado === "GANADA"
                          ? "Ganancia Real"
                          : "Ganancia Potencial"}
                      </p>
                      <p
                        className={`font-bold text-xl ${
                          bet.estado === "GANADA"
                            ? "text-green-300"
                            : "text-slate-300"
                        }`}>
                        $
                        {(
                          bet.gananciaReal || bet.gananciaPotencial
                        ).toLocaleString()}
                      </p>
                    </div>
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
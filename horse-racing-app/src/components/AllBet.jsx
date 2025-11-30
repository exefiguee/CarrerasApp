import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter,
  getDocs 
} from "firebase/firestore";
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Clock,
  User,
  DollarSign,
  Trophy,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

function AllBets() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const BETS_PER_PAGE = 10;

  // Cargar primera página
  useEffect(() => {
    loadBets();
  }, []);

  const loadBets = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError("");

      // Query base
      let q = query(
        collection(db, "APUESTAS_GLOBAL"),
        orderBy("timestamps.creacion", "desc"),
        limit(BETS_PER_PAGE)
      );

      // Si es "cargar más", usar el último documento como punto de inicio
      if (loadMore && lastVisible) {
        q = query(
          collection(db, "APUESTAS_GLOBAL"),
          orderBy("timestamps.creacion", "desc"),
          startAfter(lastVisible),
          limit(BETS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        if (loadMore) {
          setHasMore(false);
        } else {
          setBets([]);
        }
        return;
      }

      const newBets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Actualizar estado
      if (loadMore) {
        setBets(prev => [...prev, ...newBets]);
        setCurrentPage(prev => prev + 1);
      } else {
        setBets(newBets);
        setCurrentPage(1);
      }

      // Guardar último documento para paginación
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      
      // Verificar si hay más documentos
      setHasMore(snapshot.docs.length === BETS_PER_PAGE);

    } catch (err) {
      console.error("Error al cargar apuestas:", err);
      setError("Error al cargar las apuestas. Intenta nuevamente.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado?.toUpperCase()) {
      case "GANADA":
        return "bg-green-500/20 border-green-500/40 text-green-300";
      case "PERDIDA":
        return "bg-red-500/20 border-red-500/40 text-red-300";
      case "PENDIENTE":
        return "bg-yellow-500/20 border-yellow-500/40 text-yellow-300";
      default:
        return "bg-gray-500/20 border-gray-500/40 text-gray-300";
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado?.toUpperCase()) {
      case "GANADA":
        return <CheckCircle className="w-4 h-4" />;
      case "PERDIDA":
        return <XCircle className="w-4 h-4" />;
      case "PENDIENTE":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatFecha = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatMonto = (monto) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0
    }).format(monto || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-fuchsia-950 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-fuchsia-500 mx-auto mb-4" />
          <p className="text-slate-200 text-lg">Cargando apuestas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-fuchsia-950 to-slate-950 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-fuchsia-400" />
            <h1 className="text-3xl font-bold text-white">Todas las Apuestas</h1>
          </div>
          <p className="text-slate-300">
            Visualización completa de todas las apuestas realizadas
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="px-3 py-1 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300">
              Total cargadas: {bets.length}
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800/50 border border-slate-700/30 text-slate-300">
              Página: {currentPage}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/40">
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}

        {/* Lista de Apuestas */}
        {bets.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No hay apuestas registradas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => (
              <div
                key={bet.id}
                className="bg-slate-900/80 backdrop-blur-sm border border-fuchsia-900/30 rounded-xl p-5 hover:border-fuchsia-500/50 transition-all">
                
                {/* Header de la apuesta */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-700/50">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-fuchsia-400">
                        ID: {bet.id}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">
                        {bet.usuario?.email || "Usuario desconocido"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">
                        {formatFecha(bet.timestamps?.creacion)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${getEstadoColor(bet.estado)}`}>
                      {getEstadoIcon(bet.estado)}
                      <span className="font-semibold text-sm">
                        {bet.estado || "DESCONOCIDO"}
                      </span>
                    </div>

                    <div className="px-3 py-1.5 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/40 text-center">
                      <span className="text-xs text-fuchsia-300 block">Tipo</span>
                      <span className="font-bold text-fuchsia-200">
                        {bet.tipoApuesta?.tipo || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información de la carrera */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-fuchsia-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Hipódromo & Carrera
                    </h4>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-white font-semibold">
                        {bet.hipodromo?.nombre || bet.carrera?.hipodromo || "N/A"}
                      </p>
                      <p className="text-sm text-slate-400">
                        Carrera #{bet.carrera?.numero || "N/A"} - {bet.carrera?.hora || ""}
                      </p>
                      <p className="text-xs text-slate-500">
                        {bet.carrera?.fecha || ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-fuchsia-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Montos
                    </h4>
                    <div className="bg-slate-800/50 rounded-lg p-3 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-400">Apostado:</span>
                        <span className="text-sm font-bold text-white">
                          {formatMonto(bet.montos?.montoTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-400">Potencial:</span>
                        <span className="text-sm font-bold text-green-400">
                          {formatMonto(bet.montos?.gananciaPotencial)}
                        </span>
                      </div>
                      {bet.resultado?.gananciaReal > 0 && (
                        <div className="flex justify-between pt-1 border-t border-slate-700">
                          <span className="text-xs text-slate-400">Ganancia:</span>
                          <span className="text-sm font-bold text-green-300">
                            {formatMonto(bet.resultado?.gananciaReal)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs pt-1 border-t border-slate-700/50">
                        <span className="text-slate-500">Combinaciones:</span>
                        <span className="text-slate-300">{bet.montos?.numeroCombinaciones || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Caballos seleccionados */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-fuchsia-300 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Caballos Seleccionados
                  </h4>
                  
                  {bet.esApuestaMultiCarrera && bet.detalleGrupos ? (
                    // Apuesta multi-carrera (DOBLE, TRIFECTA, etc)
                    <div className="space-y-3">
                      {Object.entries(bet.detalleGrupos).map(([raceKey, raceData]) => (
                        <div key={raceKey} className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-xs text-fuchsia-400 mb-2 font-semibold">
                            Carrera #{raceData.carrera?.numero || raceKey} - {raceData.carrera?.hipodromo || ""}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {raceData.caballos?.map((caballo, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-1.5 bg-fuchsia-900/30 border border-fuchsia-700/30 rounded-lg">
                                <span className="text-sm font-bold text-fuchsia-300">
                                  #{caballo.numero}
                                </span>
                                <span className="text-xs text-slate-300 ml-2">
                                  {caballo.nombre}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : bet.seleccionados?.length > 0 ? (
                    // Apuesta simple
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="flex flex-wrap gap-2">
                        {bet.seleccionados.map((caballo, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1.5 bg-fuchsia-900/30 border border-fuchsia-700/30 rounded-lg">
                            <span className="text-sm font-bold text-fuchsia-300">
                              #{caballo.numero}
                            </span>
                            <span className="text-xs text-slate-300 ml-2">
                              {caballo.nombre}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">
                      {bet.texto || "Sin información de caballos"}
                    </p>
                  )}
                </div>

                {/* Metadata adicional */}
                {bet.metadata && (
                  <div className="pt-3 border-t border-slate-700/50">
                    <details className="group">
                      <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                        Ver detalles técnicos
                      </summary>
                      <div className="mt-2 text-xs text-slate-600 bg-slate-950/50 rounded p-2 font-mono">
                        <p>App: {bet.metadata.app || "N/A"}</p>
                        <p>Versión: {bet.metadata.version || "N/A"}</p>
                        <p className="truncate">Device: {bet.metadata.dispositivo || "N/A"}</p>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Botón cargar más */}
        {hasMore && bets.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => loadBets(true)}
              disabled={loadingMore}
              className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 mx-auto ${
                loadingMore
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 hover:from-fuchsia-500 hover:to-fuchsia-600 hover:scale-105"
              } text-white shadow-lg shadow-fuchsia-500/20`}>
              {loadingMore ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <ChevronRight className="w-5 h-5" />
                  Cargar 10 más
                </>
              )}
            </button>
          </div>
        )}

        {!hasMore && bets.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-slate-500">
              ✅ Todas las apuestas cargadas ({bets.length} total)
            </p>
          </div>
        )}
      </div>
    </div>
  );
  
}

export default AllBets;
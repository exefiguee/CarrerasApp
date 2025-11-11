import { useState, useEffect } from "react";
import { auth } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import RacesList from "./components/RacesList";
import BetModal from "./components/BetModal";
import Login from "./components/Login";
import { Menu, X, TrendingUp, Calendar, LogOut } from "lucide-react";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState(null);
  const [betData, setBetData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      cargarDatos();
      cargarTransmisiones();
    });

    return () => unsubscribe();
  }, []);

  const handleSelectRace = (race) => {
    setSelectedRace(race);
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

  const handleConfirmBet = async (data) => {
    if (!user) {
      alert("Debes iniciar sesión para apostar");
      return;
    }
    // Lógica de apuesta aquí
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-700 border-t-emerald-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-emerald-500/20 mx-auto blur-sm"></div>
          </div>
          <p className="text-slate-300 text-xl font-semibold">
            Cargando sistema...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header Responsivo */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl">
        <div className="container mx-auto px-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-4">
            {/* Logo y Título */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-xl md:text-2xl">🏇</span>
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">
                  Racing System
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
                  <p className="text-xs md:text-sm text-slate-400">
                    {data?.fecha_del_dia || "Cargando..."}
                  </p>
                  <span className="hidden sm:flex items-center gap-1.5 ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs text-emerald-400 font-medium">
                      En Vivo
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop: Stats + User Info */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Stats Cards */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <p className="text-xs text-slate-400">Hipódromos</p>
                  <p className="text-lg font-bold text-white text-center">
                    {data?.hipodromos.length || 0}
                  </p>
                </div>
                <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <p className="text-xs text-slate-400">Carreras</p>
                  <p className="text-lg font-bold text-emerald-400 text-center">
                    {data?.carreras.length || 0}
                  </p>
                </div>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 pl-4 border-l border-slate-700/50">
                <div className="text-right">
                  <p className="text-sm text-slate-300 font-medium">
                    {user.email}
                  </p>
                  <p className="text-xs text-slate-500">Usuario</p>
                </div>
                <button
                  onClick={() => auth.signOut()}
                  className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-all">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile: Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 border-t border-slate-800/50 pt-4 animate-in slide-in-from-top">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
                  <p className="text-xs text-slate-400 mb-1">Hipódromos</p>
                  <p className="text-xl font-bold text-white">
                    {data?.hipodromos.length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
                  <p className="text-xs text-slate-400 mb-1">Carreras</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {data?.carreras.length || 0}
                  </p>
                </div>
              </div>

              {/* User Info */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div>
                  <p className="text-sm text-slate-300 font-medium">
                    {user.email}
                  </p>
                  <p className="text-xs text-slate-500">Usuario conectado</p>
                </div>
                <button
                  onClick={() => auth.signOut()}
                  className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-all flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </div>

              {/* Live Indicator */}
              <div className="mt-3 flex items-center justify-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm text-emerald-400 font-medium">
                  Sistema en vivo
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <RacesList onSelectRace={handleSelectRace} />
      </main>

      {/* Modals */}
      {selectedRace && (
        <BetModal
          race={selectedRace}
          onClose={() => setSelectedRace(null)}
          onConfirmBet={handleConfirmBet}
        />
      )}

      {showPaymentModal && betData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              Procesando pago...
            </h3>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

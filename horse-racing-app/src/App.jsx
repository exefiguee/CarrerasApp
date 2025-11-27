import { useState, useEffect } from "react";
import { auth, db } from "./firebase/config";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import RacesList from "./components/RacesList";
import BetModal from "./components/BetModal";
import Crear123 from "./components/CreateUser";
import AllBet from "./components/AllBet";
import { Menu, X, Calendar, LogOut, User, Wallet, Plus, UserPlus, List } from "lucide-react";
import "./App.css";
import logoCaballo from "./assets/logocaballo.png";

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState(null);
  const [data, setData] = useState(null);
  const [transmisiones, setTransmisiones] = useState([]);
  const [error, setError] = useState(null);
  const [selectedHipodromo, setSelectedHipodromo] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showAllBetsModal, setShowAllBetsModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  const userId = user ? user.uid : null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // ✅ Escuchar desde la colección "users" (minúsculas)
        const unsubscribeUserData = onSnapshot(
          doc(db, "users", currentUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              
              // ✅ Mapear los campos nuevos a los antiguos para compatibilidad
              setUserData({
                EMAIL: data.email,
                SALDO: data.balance,
                ID: currentUser.uid,
                // Campos nuevos también disponibles
                name: data.name,
                role: data.role,
                totalBet: data.totalBet || 0,
                totalWon: data.totalWon || 0,
                totalLost: data.totalLost || 0,
              });

              console.log("✅ Datos usuario cargados:", {
                email: data.email,
                balance: data.balance,
                role: data.role
              });
            } else {
              console.warn("⚠️ Usuario no encontrado en colección 'users'");
              setUserData(null);
            }
          },
          (error) => {
            console.error("❌ Error al cargar datos del usuario:", error);
          }
        );
        
        return () => unsubscribeUserData();
      } else {
        setUserData(null);
      }
    });

    cargarDatos();
    cargarTransmisiones();

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

  const handleConfirmBet = async () => {
    if (!user) {
      alert("Debes iniciar sesión para apostar");
      return;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setShowLoginModal(false);
      setLoginEmail("");
      setLoginPassword("");
    } catch (error) {
      console.error("Error login:", error);
      
      let errorMsg = "Correo o contraseña incorrectos";
      if (error.code === 'auth/user-not-found') {
        errorMsg = "Usuario no encontrado. Contacta al administrador.";
      } else if (error.code === 'auth/wrong-password') {
        errorMsg = "Contraseña incorrecta";
      } else if (error.code === 'auth/invalid-credential') {
        errorMsg = "Credenciales inválidas";
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = "Demasiados intentos. Intenta más tarde.";
      }
      
      setLoginError(errorMsg);
    }
  };

  const handleCreateAccount = () => {
    window.open(
      "https://wa.me/543813444655?text=Hola,%20quiero%20crear%20una%20cuenta",
      "_blank"
    );
  };

  const handleAddBalance = () => {
    if (user && userData) {
      const mensaje = `Hola, quiero agregar saldo a mi cuenta.%0A%0AID de Usuario: ${user.uid}%0AEmail: ${userData.EMAIL}%0ASaldo actual: $${userData.SALDO || 0}`;
      window.open(`https://wa.me/543813444655?text=${mensaje}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-950">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-fuchsia-900 border-t-fuchsia-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-fuchsia-500/20 mx-auto blur-sm"></div>
          </div>
          <p className="text-slate-200 text-xl font-semibold">
            Cargando sistema...
          </p>
        </div>
      </div>
    );
  }

  // Si showAllBetsModal está activo, mostrar AllBets en pantalla completa
  if (showAllBetsModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-fuchsia-950 to-slate-950">
        {/* Header simple con botón de volver */}
        <header className="bg-slate-900/95 backdrop-blur-xl border-b border-fuchsia-900/30 shadow-2xl shadow-fuchsia-900/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <button
              onClick={() => setShowAllBetsModal(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-fuchsia-900/30 hover:border-fuchsia-500/40 text-slate-300 hover:text-white transition-all">
              <X className="w-5 h-5" />
              <span className="font-semibold">Volver</span>
            </button>
          </div>
        </header>
        <AllBet />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-fuchsia-950 to-slate-950">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-xl border-b border-fuchsia-900/30 shadow-2xl shadow-fuchsia-900/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 md:w-20 md:h-20">
                <img
                  src={logoCaballo}
                  alt="TURF424.BET"
                  className="w-full h-full object-contain rounded-2xl"
                />
              </div>

              <div>
                <div className="flex items-center">
                  <img
                    src="/title.png"
                    alt="TURF424.BET"
                    className="w-auto h-10 md:h-10 object-contain drop-shadow-[0_0_10px_rgba(255,0,255,0.5)]"
                  />
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 text-fuchsia-400" />
                  <p className="text-xs md:text-sm text-slate-300">
                    {data?.fecha_del_dia || "Cargando..."}
                  </p>
                  <span className="hidden sm:flex items-center gap-1.5 ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse"></span>
                    <span className="text-xs text-fuchsia-400 font-medium">
                      En Vivo
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-fuchsia-900/30">
                  <p className="text-xs text-slate-400">Hipódromos</p>
                  <p className="text-lg font-bold text-white text-center">
                    {data?.hipodromos.length || 0}
                  </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-fuchsia-900/30">
                  <p className="text-xs text-slate-400">Carreras</p>
                  <p className="text-lg font-bold text-fuchsia-400 text-center">
                    {data?.carreras.length || 0}
                  </p>
                </div>
                
                {/* 🆕 Botón Ver Todas las Apuestas - Desktop */}
                <button
                  onClick={() => setShowAllBetsModal(true)}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 backdrop-blur-sm border border-blue-500/40 text-white transition-all shadow-lg shadow-blue-500/20 hover:scale-105"
                  title="Ver Todas las Apuestas">
                  <List className="w-5 h-5" />
                </button>

                {/* Botón Crear Usuario - Desktop */}
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 backdrop-blur-sm border border-green-500/40 text-white transition-all shadow-lg shadow-green-500/20 hover:scale-105"
                  title="Crear Usuario">
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>

              {user ? (
                <div className="flex items-center gap-3 pl-4 border-l border-fuchsia-900/30">
                  <div className="px-4 py-2 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-600/20 backdrop-blur-sm border border-fuchsia-400/40 shadow-lg shadow-fuchsia-500/10">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-fuchsia-400" />
                      <div>
                        <p className="text-xs text-slate-300">Tu Saldo</p>
                        <p className="text-lg font-bold text-fuchsia-400">
                          ${userData?.SALDO?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="p-2.5 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-fuchsia-900/30 text-slate-300 hover:text-fuchsia-400 hover:bg-slate-800 hover:border-fuchsia-500/40 transition-all"
                    title="Ver Perfil">
                    <User className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 pl-4 border-l border-fuchsia-900/30">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="p-2.5 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-fuchsia-900/30 text-slate-300 hover:text-fuchsia-400 hover:bg-slate-800 hover:border-fuchsia-500/40 transition-all"
                    title="Iniciar Sesión">
                    <User className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-fuchsia-900/30 text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 border-t border-fuchsia-900/30 pt-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-fuchsia-900/30 text-center">
                  <p className="text-xs text-slate-400 mb-1">Hipódromos</p>
                  <p className="text-xl font-bold text-white">
                    {data?.hipodromos.length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-fuchsia-900/30 text-center">
                  <p className="text-xs text-slate-400 mb-1">Carreras</p>
                  <p className="text-xl font-bold text-fuchsia-400">
                    {data?.carreras.length || 0}
                  </p>
                </div>
              </div>

              {/* Botones Admin - Mobile */}
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => setShowAllBetsModal(true)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 backdrop-blur-sm border border-blue-500/40 text-white transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 font-semibold">
                  <List className="w-5 h-5" />
                  Ver Todas las Apuestas
                </button>

                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 backdrop-blur-sm border border-green-500/40 text-white transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 font-semibold">
                  <UserPlus className="w-5 h-5" />
                  Crear Usuario
                </button>
              </div>

              {user ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-600/20 backdrop-blur-sm border border-fuchsia-400/40 shadow-lg shadow-fuchsia-500/10">
                      <Wallet className="w-6 h-6 text-fuchsia-400" />
                      <div className="text-left">
                        <p className="text-xs text-slate-300 mb-0.5 whitespace-nowrap">
                          Tu saldo
                        </p>
                        <p className="text-2xl font-bold text-fuchsia-400 whitespace-nowrap">
                          ${userData?.SALDO?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-fuchsia-900/30 text-slate-300 hover:text-fuchsia-400 hover:border-fuchsia-500/40 text-sm font-semibold transition-all flex items-center justify-center gap-2">
                      <User className="w-4 h-4" />
                      Perfil
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-2">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full px-4 py-2.5 rounded-xl bg-fuchsia-500/20 backdrop-blur-sm border border-fuchsia-400/40 text-fuchsia-300 hover:bg-fuchsia-500/30 text-sm font-semibold transition-all shadow-lg shadow-fuchsia-500/10">
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={handleCreateAccount}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 text-sm font-semibold transition-all">
                    Crear Cuenta
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <RacesList onSelectRace={handleSelectRace} />
      </main>

      {/* Modal Crear Usuario */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-3">
          <div className="bg-fuchsia-950/35 backdrop-blur-xl rounded-2xl p-5 max-w-4xl w-full border border-fuchsia-500/30 shadow-2xl shadow-fuchsia-900/30 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateUserModal(false)}
              className="absolute top-3 right-3 p-2 rounded-lg bg-fuchsia-900/60 backdrop-blur-sm border border-fuchsia-700/30 text-fuchsia-200 hover:text-white hover:bg-fuchsia-900/80 transition-all z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 mb-3 border-2 border-white/10">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-0.5">Crear Usuario</h3>
              <p className="text-xs text-fuchsia-300">
                Administrar usuarios del sistema
              </p>
            </div>

            <Crear123 />
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && user && userData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-3">
          <div className="bg-fuchsia-950/35 backdrop-blur-xl rounded-2xl p-5 max-w-sm w-full border border-fuchsia-500/30 shadow-2xl shadow-fuchsia-900/30 relative scale-95">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-3 right-3 p-2 rounded-lg bg-fuchsia-900/60 backdrop-blur-sm border border-fuchsia-700/30 text-fuchsia-200 hover:text-white hover:bg-fuchsia-900/80 transition-all">
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/30 mb-3 border-2 border-white/10">
                <User className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-0.5">Mi Perfil</h3>
              <p className="text-xs text-fuchsia-300">
                Información de tu cuenta
              </p>
            </div>

            <div className="space-y-2.5 mb-4">
              <div className="p-3 rounded-xl bg-fuchsia-900/40 backdrop-blur-sm border border-fuchsia-700/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-fuchsia-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[10px] text-fuchsia-300 mb-0.5 font-medium">
                      Email
                    </p>
                    <p className="text-xs text-white font-semibold break-all">
                      {userData.EMAIL}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-fuchsia-900/40 backdrop-blur-sm border border-fuchsia-700/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-fuchsia-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[10px] text-fuchsia-300 mb-0.5 font-medium">
                      ID de Usuario
                    </p>
                    <p className="text-[10px] text-fuchsia-100 font-mono break-all">
                      {userData.ID}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-fuchsia-400/40 shadow-lg shadow-fuchsia-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-fuchsia-500/30 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-fuchsia-300" />
                    </div>
                    <div>
                      <p className="text-[11px] text-fuchsia-200 mb-0.5 font-medium">
                        Saldo disponible
                      </p>
                      <p className="text-2xl font-bold text-fuchsia-300">
                        ${userData.SALDO?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleAddBalance}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-fuchsia-600 to-fuchsia-600 hover:from-fuchsia-400 hover:to-fuchsia-400 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-fuchsia-500/20 hover:scale-[1.05]">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => auth.signOut()}
                className="w-full py-2.5 bg-fuchsia-900/40 hover:bg-fuchsia-900/60 backdrop-blur-sm border border-red-500/40 text-red-400 rounded-lg font-bold text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-3">
          <div className="bg-fuchsia-950/35 backdrop-blur-xl rounded-xl p-4 max-w-sm w-full border border-fuchsia-500/30 shadow-2xl shadow-fuchsia-900/30 relative">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setLoginError("");
                setLoginEmail("");
                setLoginPassword("");
              }}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-fuchsia-900/60 backdrop-blur-sm border border-fuchsia-700/30 text-fuchsia-200 hover:text-white hover:bg-fuchsia-900/80 transition-all">
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-fuchsia-500/20 mb-3 border border-fuchsia-400/20">
                <img
                  src="/logo.png"
                  alt="Racing System Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Iniciar Sesión
              </h3>
              <p className="text-xs text-fuchsia-300">Accede a tu cuenta</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-fuchsia-200 mb-1">
                  <svg
                    className="w-3.5 h-3.5 text-fuchsia-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-fuchsia-900/40 backdrop-blur-sm border border-fuchsia-700/30 rounded-lg text-white text-sm placeholder-fuchsia-400 focus:outline-none focus:border-fuchsia-500 focus:bg-fuchsia-900/60 transition-all"
                  placeholder="tu@correo.com"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-fuchsia-200 mb-1">
                  <svg
                    className="w-3.5 h-3.5 text-fuchsia-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-fuchsia-900/40 backdrop-blur-sm border border-fuchsia-700/30 rounded-lg text-white text-sm placeholder-fuchsia-400 focus:outline-none focus:border-fuchsia-500 focus:bg-fuchsia-900/60 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {loginError && (
                <div className="p-2 rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-500/40">
                  <p className="text-xs text-red-300 font-medium text-center">
                    {loginError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-fuchsia-600 to-fuchsia-600 hover:from-fuchsia-500 hover:to-fuchsia-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-fuchsia-500/20 hover:scale-[1.02]">
                Iniciar Sesión
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-fuchsia-700/30"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-fuchsia-950 px-3 text-xs font-semibold text-fuchsia-400">
                  ¿No tienes cuenta?
                </span>
              </div>
            </div>

            <button
              onClick={handleCreateAccount}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-lg font-bold text-xs transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Crear cuenta por WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Bet Modal */}
      {selectedRace && (
        <BetModal
          race={selectedRace}
          onClose={() => setSelectedRace(null)}
          onConfirmBet={handleConfirmBet}
          user={user}
          userSaldo={userData?.SALDO || 0}
        />
      )}
    </div>
  );
}

export default App;
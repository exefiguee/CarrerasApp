import { useState, useEffect } from "react";
import { auth } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import RacesList from "./components/RacesList";
import BetModal from "./components/BetModal";
import Login from "./components/Login";
import "./App.css";

//import PaymentModal from './components/PaymentModal';
// import { betService } from './services/betService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState(null);
  const [betData, setBetData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);


  const [data, setData] = useState(null);
  const [transmisiones, setTransmisiones] = useState([]);
  // const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHipodromo, setSelectedHipodromo] = useState(null);
  const [selectedCarrera, setSelectedCarrera] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(
    "public/canalcarreras.html?id=USANETWORK"
  );
  const [activeTab, setActiveTab] = useState("hipodromos"); // hipodromos, carreras, apuestas

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

  // ────────────────────────────────
  // 🔹 CARGA DE TRANSMISIONES
  // ────────────────────────────────
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

  // ────────────────────────────────
  // 🔹 FUNCIONES AUXILIARES
  // ────────────────────────────────
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

    if (onSelectRace) {
      onSelectRace({
        ...carrera,
        horses: generatedHorses,
      });
    }
  };

  const handleSelectTransmision = (link) => {
    setIframeUrl(link);
  };

  const handleConfirmBet = async (data) => {
    if (!user) {
      alert("Debes iniciar sesión para apostar");
      return;
    }

    // Calcular ganancia potencial
    const potentialWin = betService.calculatePotentialWin(
      data.betType,
      data.selections,
      data.amount
    );

    // Crear apuesta en Firebase
    try {
      const bet = await betService.createBet(user.uid, {
        ...data,
        potentialWin,
      });

      // Preparar datos para el pago
      setBetData({
        ...data,
        betId: bet.id,
        userId: user.uid,
        potentialWin,
      });

      // Cerrar modal de apuesta
      setSelectedRace(null);

      // Abrir modal de pago
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Error creating bet:", error);
      alert("Error al crear la apuesta. Intentá nuevamente.");
    }
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    setBetData(null);
    alert("¡Pago procesado! Recibirás un email de confirmación.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header Compacto */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-2xl flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex justify-between items-center">
            {/* <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <span className="text-xl">🏇</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Horse Racing Bet
                </h1>
                <p className="text-xs text-slate-400">Carreras de Argentina</p>
              </div>
            </div> */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <span className="text-2xl">🏇</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Racing Management System
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-emerald-400">📅</span>
                  <p className="text-sm text-slate-400">{data?.fecha_del_dia}</p>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-2"></span>
                  <span className="text-xs text-emerald-400 font-medium">
                    En Vivo
                  </span>
                </div>
              </div>
            </div>


            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-center">
                  <p className="text-xs text-slate-400">Hipódromos</p>
                  <p className="text-xl font-bold text-white">
                    {data?.hipodromos.length}
                  </p>
                </div>
                <div className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-center">
                  <p className="text-xs text-slate-400">Carreras</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {data?.carreras.length}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">👤 {user.email}</p>
                <button
                  onClick={() => auth.signOut()}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors">
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Sin padding, ocupando todo el espacio */}
      <main className="flex-1 overflow-y-auto bg-slate-900">
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
        <PaymentModal
          betData={betData}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}

export default App;
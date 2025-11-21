import { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  Check,
  Trophy,
  Target,
  Medal,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import BetTypeSelector from "./BetTypeSelector";
import HorseSelector from "./HorseSelector";
import BetAmount from "./BetAmount";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

const BetModal = ({ race, onClose, onConfirmBet, user, userSaldo }) => {
  const [step, setStep] = useState(1);
  const [betType, setBetType] = useState(null);
  const [selectedHorses, setSelectedHorses] = useState([]);
  const [amount, setAmount] = useState(0);
  const [betTypes, setBetTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentRaceData, setCurrentRaceData] = useState(race);

  // 🔥 Orden de tipos de apuesta
  const BET_TYPE_ORDER = [
    "GANADOR",
    "SEGUNDO",
    "TERCERO",
    "TIRA(1,2,3)",
    "EXACTA",
    "IMPERFECTA",
    "IMPERFECTA C",
    "TRIFECTA D",
    "TRIFECTA C",
    "CUATRIFECTA D",
    "CUATRIFECTA C",
    "QUINTEX D",
    "QUINTEX C",
    "DOBLE",
    "TRIPLO",
    "PICK 4",
    "PICK 5",
    "PICK 6",
  ];

  // 🔥 Listener en tiempo real para la carrera seleccionada
  useEffect(() => {
    if (!race || !race.firebaseId) {
      console.warn("⚠️ No hay firebaseId en la carrera");
      setCurrentRaceData(race);
      return;
    }

    console.log("🔥 Iniciando listener para carrera:", race.firebaseId);

    const carreraRef = doc(db, "carreras1", race.firebaseId);

    const unsubscribe = onSnapshot(
      carreraRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const updatedRace = {
            ...docSnapshot.data(),
            firebaseId: docSnapshot.id,
            horses: race.horses,
          };
          console.log("🔄 Carrera actualizada:", updatedRace);
          setCurrentRaceData(updatedRace);
        } else {
          console.warn("⚠️ La carrera ya no existe");
        }
      },
      (error) => {
        console.error("❌ Error en listener de carrera:", error);
      }
    );

    return () => {
      console.log("🛑 Deteniendo listener de carrera");
      unsubscribe();
    };
  }, [race?.firebaseId]);

  // 🔥 Cargar tipos de apuesta desde Firestore
  useEffect(() => {
    if (!currentRaceData || !currentRaceData.tiposApuestas) {
      console.warn("⚠️ No hay tiposApuestas en la carrera");
      setLoading(false);
      return;
    }

    console.log("📊 Cargando tipos de apuesta desde Firestore");

    // Configuración de cada tipo de apuesta
    const betTypeConfig = {
      GANADOR: {
        maxHorses: 1,
        minHorses: 1,
        type: "simple",
        description: "Selecciona 1 caballo a ganador",
      },
      SEGUNDO: {
        maxHorses: 1,
        minHorses: 1,
        type: "simple",
        description: "Selecciona 1 caballo a segundo",
      },
      TERCERO: {
        maxHorses: 1,
        minHorses: 1,
        type: "simple",
        description: "Selecciona 1 caballo a tercero",
      },
      "TIRA(1,2,3)": {
        maxHorses: 3,
        minHorses: 1,
        type: "tira",
        description: "1 caballo a los 3 puestos (ganador, segundo y tercero)",
      },
      EXACTA: {
        maxHorses: 10,
        minHorses: 2,
        type: "combinada",
        positions: 2,
        description: "Caballos para 1° y 2° puesto (en orden)",
      },
      IMPERFECTA: {
        maxHorses: 10,
        minHorses: 2,
        type: "combinada",
        positions: 2,
        ordered: false,
        description: "Caballos para 1° y 2° puesto (sin orden)",
      },
      "IMPERFECTA C": {
        maxHorses: 10,
        minHorses: 2,
        type: "combinada-multiple",
        positions: 2,
        ordered: false,
        description: "Varios caballos para 1° y 2° (combinaciones)",
      },
      "TRIFECTA D": {
        maxHorses: 3,
        minHorses: 3,
        type: "directa",
        positions: 3,
        description: "3 caballos en orden: 1°, 2° y 3°",
      },
      "TRIFECTA C": {
        maxHorses: 10,
        minHorses: 3,
        type: "combinada-multiple",
        positions: 3,
        description: "Varios caballos para los 3 primeros puestos",
      },
      "CUATRIFECTA D": {
        maxHorses: 4,
        minHorses: 4,
        type: "directa",
        positions: 4,
        description: "4 caballos en orden: 1°, 2°, 3° y 4°",
      },
      "CUATRIFECTA C": {
        maxHorses: 10,
        minHorses: 4,
        type: "combinada-multiple",
        positions: 4,
        description: "Varios caballos para los 4 primeros puestos",
      },
      "QUINTEX D": {
        maxHorses: 5,
        minHorses: 5,
        type: "directa",
        positions: 5,
        description: "5 caballos en orden: 1°, 2°, 3°, 4° y 5°",
      },
      "QUINTEX C": {
        maxHorses: 10,
        minHorses: 5,
        type: "combinada-multiple",
        positions: 5,
        description: "Varios caballos para los 5 primeros puestos",
      },
      DOBLE: {
        maxHorses: 10,
        minHorses: 1,
        type: "multiple-races",
        races: 2,
        description: "Ganadores de 2 carreras seguidas",
      },
      TRIPLO: {
        maxHorses: 10,
        minHorses: 1,
        type: "multiple-races",
        races: 3,
        description: "Ganadores de 3 carreras seguidas",
      },
      "PICK 4": {
        maxHorses: 10,
        minHorses: 1,
        type: "multiple-races",
        races: 4,
        description: "Ganadores de 4 carreras seguidas",
      },
      "PICK 5": {
        maxHorses: 10,
        minHorses: 1,
        type: "multiple-races",
        races: 5,
        description: "Ganadores de 5 carreras seguidas",
      },
      "PICK 6": {
        maxHorses: 10,
        minHorses: 1,
        type: "multiple-races",
        races: 6,
        description: "Ganadores de 6 carreras seguidas",
      },
    };

    // Filtrar solo los tipos habilitados en Firestore
    const enabledTypesTemp = {};

    Object.entries(currentRaceData.tiposApuestas).forEach(
      ([key, isEnabled]) => {
        if (isEnabled !== true) {
          console.log(`❌ ${key} está en FALSE - NO se mostrará`);
          return;
        }

        if (betTypeConfig[key]) {
          const normalizedKey = key.replace(/[(),\s]/g, "_").toUpperCase();
          const keyWithOne = key.replace(/\s/g, "") + "1";

          const limites = currentRaceData.limitesApuestas?.[keyWithOne] || {
            apuestaMinima: 200,
            apuestaMaxima: 50000,
          };

          enabledTypesTemp[normalizedKey] = {
            label: key,
            originalKey: key,
            ...betTypeConfig[key],
            apuestaMinima: limites.apuestaMinima || 200,
            apuestaMaxima: limites.apuestaMaxima || 50000,
          };
          console.log(`✅ ${key} habilitado con límites:`, limites);
        }
      }
    );

    // Ordenar según BET_TYPE_ORDER
    const orderedBetTypes = {};
    BET_TYPE_ORDER.forEach((originalKey) => {
      const normalizedKey = originalKey.replace(/[(),\s]/g, "_").toUpperCase();
      if (enabledTypesTemp[normalizedKey]) {
        orderedBetTypes[normalizedKey] = enabledTypesTemp[normalizedKey];
      }
    });

    console.log("🎯 Tipos habilitados y ordenados:", orderedBetTypes);
    setBetTypes(orderedBetTypes);
    setLoading(false);
  }, [currentRaceData]);

  const handleBetTypeSelect = (type) => {
    console.log("🎯 Tipo seleccionado:", type);
    setBetType(type);
    setSelectedHorses([]);
    setStep(2);
  };

  const handleHorsesSelected = (horses) => {
    console.log("🐴 Caballos seleccionados:", horses);
    setSelectedHorses(horses);
    setStep(3);
  };

  const handleConfirmBet = () => {
    console.log("✅ Apuesta confirmada:", {
      betType,
      selectedHorses,
      amount,
    });
    onClose();
  };

  const canProceed = () => {
    if (step === 2) {
      const config = betTypes[betType];
      return (
        selectedHorses.length >= config.minHorses &&
        selectedHorses.length <= config.maxHorses
      );  
    }
    if (step === 3) {
      const config = betTypes[betType];
      const minAmount = config?.apuestaMinima || 200;
      const maxAmount = config?.apuestaMaxima || 50000;
      return (
        amount >= minAmount && amount <= maxAmount && amount <= (userSaldo || 0)
      );
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-fuchsia-600/20 via-fuchsia-500/20 to-slate-800/40 border-b border-slate-800/50 p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                {step === 1 && "Selecciona tu Apuesta"}
                {step === 2 && `${betTypes[betType]?.label}`}
                {step === 3 && `Confirma tu ${betTypes[betType]?.label}`}
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-fuchsia-500/20 border border-fuchsia-500/30 rounded text-fuchsia-300 font-semibold">
                  Paso {step}/3
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
              <X className="w-6 h-6 text-slate-400 hover:text-white" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span>🇦🇷</span>
              <span className="font-semibold">
                {currentRaceData.venue || currentRaceData.descripcion_hipodromo}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                Carrera{" "}
                {currentRaceData.raceNumber || currentRaceData.num_carrera}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {currentRaceData.date || currentRaceData.fecha_texto} -{" "}
              {currentRaceData.time || currentRaceData.hora}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)] custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400">Cargando tipos de apuesta...</p>
            </div>
          ) : Object.keys(betTypes).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Trophy className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-400 text-center">
                No hay tipos de apuesta habilitados para esta carrera
              </p>
            </div>
          ) : (
            <>
              {step === 1 && (
                <BetTypeSelector
                  betTypes={betTypes}
                  onSelect={handleBetTypeSelect}
                />
              )}

              {step === 2 && (
                <HorseSelector
                  horses={currentRaceData.horses}
                  betType={betType}
                  betTypeConfig={betTypes[betType]}
                  selectedHorses={selectedHorses}
                  onSelect={setSelectedHorses}
                  onBack={() => setStep(1)}
                  onNext={handleHorsesSelected}
                  canProceed={canProceed()}
                  race={currentRaceData}
                />
              )}

              {step === 3 && (
                <BetAmount
                  betType={betType}
                  selectedHorses={selectedHorses}
                  amount={amount}
                  onAmountChange={setAmount}
                  onBack={() => setStep(2)}
                  onConfirm={handleConfirmBet}
                  canProceed={canProceed()}
                  raceData={currentRaceData}
                  user={user}
                  userSaldo={userSaldo}
                  maxBetAmount={betTypes[betType]?.apuestaMaxima}
                  minBetAmount={betTypes[betType]?.apuestaMinima}
                  betTypeConfig={betTypes[betType]}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900/50 border-t border-slate-800/50 p-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white font-semibold rounded-xl transition-all">
            Cerrar
          </button>
        </div>
      </div>

      {/* Custom Scrollbar */}
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
        @keyframes in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-in {
          animation: in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BetModal;

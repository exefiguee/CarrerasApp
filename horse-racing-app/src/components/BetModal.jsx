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

const BetModal = ({ race, onClose, onConfirmBet, user, userSaldo }) => {
  const [step, setStep] = useState(1);
  const [betType, setBetType] = useState(null);
  const [selectedHorses, setSelectedHorses] = useState([]);
  const [selectedRace, setSelectedRace] = useState([]);
  const [amount, setAmount] = useState(0);
  const [betTypes, setBetTypes] = useState({});
  const [loading, setLoading] = useState(true);

  // 🔥 Orden CORRECTO de tipos de apuesta (del más simple al más complejo)
  const BET_TYPE_ORDER = [
    "GANADOR",
    "SEGUNDO",
    "TERCERO",
    "EXACTA",
    "IMPERFECTA",
    "TIRA(1,2)",
    "TIRA(1,2,3)",
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

  // 🔥 Cargar tipos de apuesta DIRECTAMENTE desde race.tiposApuestas de Firestore
  useEffect(() => {
    if (!race || !race.tiposApuestas) {
      console.warn("⚠️ No hay tiposApuestas en la carrera");
      setLoading(false);
      return;
    }

    console.log("📊 Datos de la carrera desde Firestore:", race);
    console.log("🎯 tiposApuestas desde Firestore:", race.tiposApuestas);

    // Mapeo de configuración para cada tipo de apuesta
    const betTypeConfig = {
      GANADOR: { maxHorses: 1, minHorses: 1, tope: 30000 },
      SEGUNDO: { maxHorses: 1, minHorses: 1, tope: 15000 },
      TERCERO: { maxHorses: 1, minHorses: 1, tope: 10000 },
      "TIRA(1,2)": { maxHorses: 2, minHorses: 2, tope: 50000 },
      "TIRA(1,2,3)": { maxHorses: 3, minHorses: 3, tope: 75000 },
      EXACTA: { maxHorses: 2, minHorses: 2, tope: 75000 },
      IMPERFECTA: { maxHorses: 2, minHorses: 2, tope: 50000 },
      "TRIFECTA D": { maxHorses: 3, minHorses: 3, tope: 100000 },
      "CUATRIFECTA D": { maxHorses: 4, minHorses: 4, tope: 150000 },
      "QUINTEX D": { maxHorses: 5, minHorses: 5, tope: 200000 },
      "TRIFECTA C": { maxHorses: 3, minHorses: 3, tope: 100000 },
      "CUATRIFECTA C": { maxHorses: 4, minHorses: 4, tope: 150000 },
      "QUINTEX C": { maxHorses: 5, minHorses: 5, tope: 200000 },
      DOBLE: { maxHorses: 1, minHorses: 1, tope: 50000 },
      TRIPLO: { maxHorses: 1, minHorses: 1, tope: 75000 },
      "PICK 4": { maxHorses: 1, minHorses: 1, tope: 100000 },
      "PICK 5": { maxHorses: 1, minHorses: 1, tope: 150000 },
      "PICK 6": { maxHorses: 1, minHorses: 1, tope: 200000 },
    };

    // 🔥 Filtrar SOLO los tipos de apuesta que están en TRUE en Firestore
    const enabledTypesTemp = {};

    Object.entries(race.tiposApuestas).forEach(([key, isEnabled]) => {
      console.log(`🔍 Verificando ${key}: ${isEnabled}`);

      // Si está en FALSE, NO lo incluimos
      if (isEnabled !== true) {
        console.log(`❌ ${key} está en FALSE - NO se mostrará`);
        return;
      }

      // Si está en TRUE y existe configuración, lo agregamos
      if (betTypeConfig[key]) {
        const normalizedKey = key.replace(/[(),\s]/g, "_").toUpperCase();
        enabledTypesTemp[normalizedKey] = {
          label: key,
          originalKey: key, // 🔥 Guardar la clave original para ordenar
          ...betTypeConfig[key],
        };
        console.log(`✅ ${key} está en TRUE - se mostrará`);
      }
    });

    // 🔥 ORDENAR según BET_TYPE_ORDER
    const orderedBetTypes = {};

    BET_TYPE_ORDER.forEach((originalKey) => {
      const normalizedKey = originalKey.replace(/[(),\s]/g, "_").toUpperCase();
      if (enabledTypesTemp[normalizedKey]) {
        orderedBetTypes[normalizedKey] = enabledTypesTemp[normalizedKey];
      }
    });

    console.log(
      "🎯 Tipos de apuesta HABILITADOS Y ORDENADOS:",
      orderedBetTypes
    );
    console.log(
      "📊 Total de tipos habilitados:",
      Object.keys(orderedBetTypes).length
    );
    console.log(
      "📋 Orden de tipos:",
      Object.keys(orderedBetTypes).map((key) => orderedBetTypes[key].label)
    );

    setBetTypes(orderedBetTypes);
    setLoading(false);
  }, [race]);

  const handleBetTypeSelect = (type) => {
    console.log("🎯 Tipo de apuesta seleccionado:", type);
    setBetType(type);
    setSelectedHorses([]);
    setStep(2);
  };

  const handleHorsesSelected = (horses) => {
    console.log("🐴 Caballos seleccionados en modal:", horses);
    setSelectedHorses(horses);
    setStep(3);
  };

  const handleConfirmBet = () => {
    console.log("✅ Confirmando apuesta con:", {
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
      return amount >= 200 && amount <= 50000 && amount <= (userSaldo || 0);
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
                {race.venue || race.descripcion_hipodromo}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                Carrera {race.raceNumber || race.num_carrera}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {race.date || race.fecha_texto} - {race.time || race.hora}
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
                  horses={race.horses}
                  betType={betType}
                  betTypeConfig={betTypes[betType]}
                  selectedHorses={selectedHorses}
                  onSelect={setSelectedHorses}
                  onBack={() => setStep(1)}
                  onNext={handleHorsesSelected}
                  canProceed={canProceed()}
                  race={race}
                />
              )}

              {step === 3 && (
                <BetAmount
                  selectedRace={selectedRace}
                  betType={betType}
                  selectedHorses={selectedHorses}
                  amount={amount}
                  onAmountChange={setAmount}
                  onBack={() => setStep(2)}
                  onConfirm={handleConfirmBet}
                  canProceed={canProceed()}
                  raceData={race}
                  user={user}
                  userSaldo={userSaldo}
                  maxBetAmount={betTypes[betType]?.tope}
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

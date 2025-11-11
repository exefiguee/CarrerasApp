import { useState } from "react";
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

  const betTypes = {
    GANADOR: { label: "GANADOR", maxHorses: 1, minHorses: 1 },
    SEGUNDO: { label: "SEGUNDO", maxHorses: 1, minHorses: 1 },
    TERCERO: { label: "TERCERO", maxHorses: 1, minHorses: 1 },
    EXACTA: { label: "EXACTA", maxHorses: 2, minHorses: 2 },
    TRIFECTA_D: { label: "TRIFECTA D", maxHorses: 1, minHorses: 1 },
    TIRA_1_2: { label: "TIRA(1,2)", maxHorses: 2, minHorses: 2 },
    TIRA_1_2_3: { label: "TIRA(1,2,3)", maxHorses: 3, minHorses: 3 },
    TRIFECTA_C: { label: "TRIFECTA C", maxHorses: 3, minHorses: 3 },
  };

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
    console.log("✅ Confirmando apuesta con:", { betType, selectedHorses, amount });
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
              {race.date || race.fecha} - {race.time || race.hora}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)] custom-scrollbar">
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
            />
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

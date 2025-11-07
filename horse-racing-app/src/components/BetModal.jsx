import { useState } from 'react';
import BetTypeSelector from './BetTypeSelector';
import HorseSelector from './HorseSelector';
import BetAmount from './BetAmount';

const BetModal = ({ race, onClose, onConfirmBet }) => {
  const [step, setStep] = useState(1); // 1: tipo, 2: caballos, 3: monto
  const [betType, setBetType] = useState(null);
  const [selectedHorses, setSelectedHorses] = useState([]);
  const [amount, setAmount] = useState(0);

  const betTypes = {
    GANADOR: { label: 'GANADOR', maxHorses: 1, minHorses: 1 },
    SEGUNDO: { label: 'SEGUNDO', maxHorses: 1, minHorses: 1 },
    TERCERO: { label: 'TERCERO', maxHorses: 1, minHorses: 1 },
    EXACTA: { label: 'EXACTA', maxHorses: 2, minHorses: 2 },
    'TRIFECTA_D': { label: 'TRIFECTA D', maxHorses: 1, minHorses: 1 },
    'TIRA_1_2': { label: 'TIRA(1,2)', maxHorses: 2, minHorses: 2 },
    'TIRA_1_2_3': { label: 'TIRA(1,2,3)', maxHorses: 3, minHorses: 3 },
    'TRIFECTA_C': { label: 'TRIFECTA C', maxHorses: 3, minHorses: 3 }
  };

  const handleBetTypeSelect = (type) => {
    setBetType(type);
    setSelectedHorses([]);
    setStep(2);
  };

  const handleHorsesSelected = (horses) => {
    setSelectedHorses(horses);
    setStep(3);
  };

  const handleConfirmBet = () => {
    const betData = {
      raceId: race.id,
      raceName: `${race.venue} - Carrera ${race.raceNumber}`,
      venue: race.venue,
      raceNumber: race.raceNumber,
      betType: betType,
      selections: selectedHorses,
      amount: amount
    };
    onConfirmBet(betData);
  };

  const canProceed = () => {
    if (step === 2) {
      const config = betTypes[betType];
      return selectedHorses.length >= config.minHorses && 
             selectedHorses.length <= config.maxHorses;
    }
    if (step === 3) {
      return amount >= 200 && amount <= 50000;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary text-white p-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">
              {step === 1 && 'SELECCIÓN DE APUESTA'}
              {step === 2 && `APUESTA A: ${betTypes[betType]?.label}`}
              {step === 3 && `APUESTA A: ${betTypes[betType]?.label}`}
            </h2>
            <button 
              onClick={onClose}
              className="text-2xl hover:text-gray-200"
            >
              ×
            </button>
          </div>
          
          <div className="mt-2 text-sm">
            <div className="flex items-center space-x-2">
              <span>🇦🇷</span>
              <span className="font-semibold">{race.venue}</span>
            </div>
            <div className="text-xs opacity-90">
              Carrera {race.raceNumber} | {race.date} - {race.time}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
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
              betType={betType}
              selectedHorses={selectedHorses}
              amount={amount}
              onAmountChange={setAmount}
              onBack={() => setStep(2)}
              onConfirm={handleConfirmBet}
              canProceed={canProceed()}
            />
          )}
        </div>

        {/* Footer - Botón Cerrar */}
        <div className="bg-gray-50 p-4 border-t">
          <button 
            onClick={onClose}
            className="w-full bg-secondary hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default BetModal;
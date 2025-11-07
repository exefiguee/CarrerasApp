import betService from "../services/betService";

const BetAmount = ({
  betType,
  selectedHorses,
  amount,
  onAmountChange,
  onBack,
  onConfirm,
  canProceed,
}) => {
  const minAmount = 200;
  const maxAmount = 50000;

  const potentialWin = betService.calculatePotentialWin(
    betType,
    selectedHorses,
    amount
  );

  const handleAmountInput = (value) => {
    const numValue = parseInt(value) || 0;
    onAmountChange(Math.min(Math.max(numValue, 0), maxAmount));
  };

  return (
    <div>
      <div className="mb-6">
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">
            CABALLOS: {selectedHorses.length}
          </p>
          <p className="text-sm text-gray-600">CANTIDAD DE APUESTAS: 1</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ingrese monto a <span className="text-primary">APOSTAR.</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">(por apuesta)</p>

          <input
            type="number"
            value={amount || ""}
            onChange={(e) => handleAmountInput(e.target.value)}
            placeholder="0"
            className="w-full text-4xl font-bold text-center border-2 border-gray-300 rounded-lg p-4 focus:border-primary focus:outline-none"
            min={minAmount}
            max={maxAmount}
          />
        </div>

        <div className="bg-secondary text-white rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Importe de la APUESTA</span>
            <span className="text-2xl font-bold">
              ARS {amount.toLocaleString()}
            </span>
          </div>

          {amount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ganancia Potencial</span>
                <span className="text-xl font-bold text-green-400">
                  ARS {potentialWin.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            <strong>Monto mínimo de apuesta:</strong> ARS{" "}
            {minAmount.toLocaleString()}
          </p>
          <p className="text-xs text-yellow-800 mt-1">
            <strong>Monto máximo de apuesta:</strong> ARS{" "}
            {maxAmount.toLocaleString()}
          </p>
          <p className="text-xs text-yellow-800 mt-1">(Tope de apuestas: 2)</p>
        </div>
      </div>

      {/* Botones */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onBack}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors">
          ATRÁS
        </button>
        <button
          onClick={onConfirm}
          disabled={!canProceed}
          className={`font-medium py-3 rounded-lg transition-colors ${
            canProceed
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}>
          SIGUIENTE
        </button>
      </div>

      <button
        onClick={() => onAmountChange(0)}
        className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition-colors">
        CANCELAR APUESTA
      </button>
    </div>
  );
};

export default BetAmount;

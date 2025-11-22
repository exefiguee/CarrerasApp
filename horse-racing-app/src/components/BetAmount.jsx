import { useState } from "react";
import {
  ChevronLeft,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Check,
  Eye,
} from "lucide-react";
import CombinationsViewer from "./CombinationsViewer";

const BetAmount = ({
  betType,
  selectedHorses,
  amount,
  onAmountChange,
  onBack,
  onConfirm,
  canProceed,
  raceData,
  user,
  userSaldo,
  maxBetAmount,
  minBetAmount,
  betTypeConfig,
}) => {
  const [customAmount, setCustomAmount] = useState("");
  const [showCombinations, setShowCombinations] = useState(false);

  console.log("💰 BetAmount - Config:", {
    betType,
    selectedHorses,
    minBetAmount,
    maxBetAmount,
    userSaldo,
  });

  // 🎯 Detectar si selectedHorses es un objeto agrupado o un array
  const isGroupedSelection = selectedHorses?.grouped === true;
  const horsesArray = isGroupedSelection
    ? (() => {
        const positions = betTypeConfig?.positions || 2;
        const allHorses = [];
        for (let i = 1; i <= positions; i++) {
          allHorses.push(...(selectedHorses[`position${i}`] || []));
        }
        return allHorses;
      })()
    : Array.isArray(selectedHorses)
    ? selectedHorses
    : [];

  // 🎯 Calcular combinaciones
  const calculateCombinations = () => {
    const selectionMode = betTypeConfig?.selectionMode;

    // 🔥 Para grupos por posición (EXACTA, IMPERFECTA, TRIFECTA D, CUATRIFECTA D)
    if (selectionMode === "grouped-positions" && isGroupedSelection) {
      const positions = betTypeConfig?.positions || 2;
      let total = 1;

      // Multiplicar TODAS las posiciones
      for (let i = 1; i <= positions; i++) {
        const count = selectedHorses[`position${i}`]?.length || 0;
        if (count === 0) return 0;
        total *= count;
      }

      console.log(
        `💡 Combinaciones calculadas (${positions} posiciones):`,
        total
      );
      return total;
    }

    const n = horsesArray.length;
    if (n === 0) return 0;

    // Simple (1 caballo = 1 apuesta)
    if (selectionMode === "single") {
      return 1;
    }

    // TIRA (1 caballo = 3 apuestas)
    if (betTypeConfig.type === "tira") {
      return 3;
    }

    // TRIFECTA D, CUATRIFECTA D (Directa - 1 sola apuesta)
    if (selectionMode === "ordered-direct") {
      return 1;
    }

    // TRIFECTA C (3 posiciones): P(n,3)
    if (
      selectionMode === "ordered-combination" &&
      betTypeConfig.positions === 3
    ) {
      if (n < 3) return 0;
      return factorial(n) / factorial(n - 3);
    }

    // CUATRIFECTA C (4 posiciones): P(n,4)
    if (
      selectionMode === "ordered-combination" &&
      betTypeConfig.positions === 4
    ) {
      if (n < 4) return 0;
      return factorial(n) / factorial(n - 4);
    }

    // Múltiples carreras: DOBLE, TRIPLO, PICK 4, PICK 5
    if (selectionMode === "multi-race") {
      return Math.pow(n, betTypeConfig.races || 1);
    }

    return 1;
  };

  const factorial = (n) => {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  const combinaciones = calculateCombinations();

  // 🎯 Calcular el monto total de la apuesta
  const calculateTotalAmount = (baseAmount) => {
    if (!baseAmount || baseAmount <= 0) return 0;

    const multiplier = betTypeConfig.multiplier || 1;
    return baseAmount * combinaciones * multiplier;
  };

  const totalAmount = calculateTotalAmount(amount);

  // 🔥 NUEVO: Validar tope de combinaciones
  const isWithinCombinationLimit = () => {
    const betTypeKey = betTypeConfig?.originalKey?.replace(/\s/g, "") + "1";
    const limites = raceData?.limitesApuestas?.[betTypeKey];
    const topeCombinaciones = limites?.topedeconbinaciones;

    if (!topeCombinaciones) return true;

    if (combinaciones > topeCombinaciones) {
      console.log(
        `⚠️ Límite de combinaciones superado: ${combinaciones} > ${topeCombinaciones}`
      );
      return false;
    }

    return true;
  };

  // 🎯 Validaciones
  const isAmountValid = () => {
    if (amount < minBetAmount) return false;
    if (amount > maxBetAmount) return false;
    if (totalAmount > userSaldo) return false;
    if (!isWithinCombinationLimit()) return false; // 🔥 NUEVO
    return true;
  };

  const getValidationMessage = () => {
    if (amount < minBetAmount) {
      return `La apuesta mínima es $${minBetAmount.toLocaleString("es-AR")}`;
    }
    if (amount > maxBetAmount) {
      return `La apuesta máxima es $${maxBetAmount.toLocaleString("es-AR")}`;
    }
    if (totalAmount > userSaldo) {
      return `No tenés saldo suficiente. Total necesario: $${totalAmount.toLocaleString(
        "es-AR"
      )}`;
    }

    // 🔥 NUEVO: Mensaje para tope de combinaciones
    if (!isWithinCombinationLimit()) {
      const betTypeKey = betTypeConfig?.originalKey?.replace(/\s/g, "") + "1";
      const limites = raceData?.limitesApuestas?.[betTypeKey];
      const topeCombinaciones = limites?.topedeconbinaciones;
      return `Esta apuesta supera el límite de ${topeCombinaciones} combinaciones permitidas. Actualmente tenés ${combinaciones} combinaciones.`;
    }

    return "";
  };

  // 🎯 Montos sugeridos
  const suggestedAmounts = [
    minBetAmount,
    minBetAmount * 2,
    minBetAmount * 5,
    minBetAmount * 10,
  ].filter((amt) => {
    const total = calculateTotalAmount(amt);
    return amt <= maxBetAmount && total <= userSaldo;
  });

  const handleSuggestedAmount = (suggestedAmount) => {
    setCustomAmount("");
    onAmountChange(suggestedAmount);
  };

  const handleCustomAmount = (value) => {
    setCustomAmount(value);
    const numValue = parseFloat(value) || 0;
    onAmountChange(numValue);
  };

  const handleConfirm = () => {
    if (isAmountValid()) {
      console.log("✅ Confirmando apuesta:", {
        betType,
        selectedHorses,
        baseAmount: amount,
        combinaciones,
        totalAmount,
      });
      onConfirm();
    }
  };

  // 🎯 Función para renderizar los caballos seleccionados
  const renderSelectedHorses = () => {
    if (isGroupedSelection) {
      const positions = betTypeConfig?.positions || 2;

      return (
        <div className="space-y-2">
          {Array.from({ length: positions }, (_, index) => {
            const positionKey = `position${index + 1}`;
            const positionHorses = selectedHorses[positionKey] || [];

            return (
              <div
                key={positionKey}
                className="flex justify-between items-start">
                <span className="text-slate-400">{index + 1}° puesto:</span>
                <span className="text-white font-semibold text-right">
                  {positionHorses.length > 0
                    ? positionHorses.map((h) => `#${h.number}`).join(", ")
                    : "-"}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    // Para apuestas normales (array)
    return (
      <div className="flex justify-between items-center">
        <span className="text-slate-400">Caballos seleccionados:</span>
        <span className="text-white font-semibold">
          {horsesArray.map((h) => `#${h.number}`).join(", ")}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Resumen de la apuesta */}
      <div className="bg-gradient-to-r from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-fuchsia-300 font-semibold mb-3 flex items-center gap-2">
          <Check className="w-5 h-5" />
          Resumen de tu apuesta
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Tipo de apuesta:</span>
            <span className="text-white font-semibold">
              {betTypeConfig?.label || betType}
            </span>
          </div>

          {/* Renderizado dinámico de caballos */}
          {renderSelectedHorses()}

          {betTypeConfig.type === "tira" && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Se jugará a:</span>
              <span className="text-amber-300 font-semibold text-xs">
                Ganador + Segundo + Tercero
              </span>
            </div>
          )}

          {/* Para apuestas agrupadas, mostrar desglose */}
          {isGroupedSelection && (
            <div className="pt-2 border-t border-slate-700/50 text-xs text-slate-400">
              <p>
                💡 Se generan {combinaciones} combinaciones:
                {` ${(() => {
                  const positions = betTypeConfig?.positions || 2;
                  const counts = [];
                  for (let i = 1; i <= positions; i++) {
                    counts.push(
                      `${selectedHorses[`position${i}`]?.length || 0} (${i}°)`
                    );
                  }
                  return counts.join(" × ");
                })()}`}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
            <span className="text-slate-400">
              {combinaciones === 1 ? "Apuesta única:" : "Combinaciones:"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-amber-300 font-bold text-lg">
                {combinaciones}
              </span>
              {combinaciones > 1 && (
                <button
                  onClick={() => setShowCombinations(true)}
                  className="px-2 py-1 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-500/30 hover:border-fuchsia-500/50 rounded-lg text-fuchsia-300 text-xs font-semibold transition-all flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Ver
                </button>
              )}
            </div>
          </div>

          {/* 🔥 NUEVO: Información de tope de combinaciones */}
          {(() => {
            const betTypeKey =
              betTypeConfig?.originalKey?.replace(/\s/g, "") + "1";
            const limites = raceData?.limitesApuestas?.[betTypeKey];
            const topeCombinaciones = limites?.topedeconbinaciones;

            if (topeCombinaciones && combinaciones > 0) {
              const percentage = (combinaciones / topeCombinaciones) * 100;
              const isNearLimit = percentage > 80;
              const isOverLimit = combinaciones > topeCombinaciones;

              return (
                <div
                  className={`pt-2 border-t border-slate-700/50 text-xs ${
                    isOverLimit
                      ? "text-red-400"
                      : isNearLimit
                      ? "text-amber-400"
                      : "text-slate-400"
                  }`}>
                  <p className="flex items-center gap-2">
                    {isOverLimit ? "🚫" : isNearLimit ? "⚠️" : "💡"}
                    <span>
                      Límite: {combinaciones} / {topeCombinaciones}
                      {isOverLimit && " - ¡Superado!"}
                      {isNearLimit && !isOverLimit && " - Cerca del límite"}
                    </span>
                  </p>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Selector de monto */}
      <div className="bg-gradient-to-r from-fuchsia-500/20 to-slate-800/40 border border-fuchsia-500/30 rounded-xl p-4">
        <h3 className="text-fuchsia-300 font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Monto por combinación
        </h3>

        {/* Montos sugeridos */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {suggestedAmounts.map((suggestedAmount) => (
            <button
              key={suggestedAmount}
              onClick={() => handleSuggestedAmount(suggestedAmount)}
              className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                amount === suggestedAmount && !customAmount
                  ? "bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20"
                  : "bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300"
              }`}>
              ${suggestedAmount.toLocaleString("es-AR")}
            </button>
          ))}
        </div>

        {/* Monto personalizado */}
        <div className="space-y-2">
          <label className="text-slate-400 text-sm">Monto personalizado:</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
              $
            </span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => handleCustomAmount(e.target.value)}
              placeholder={`Mínimo ${minBetAmount}`}
              min={minBetAmount}
              max={maxBetAmount}
              className="w-full pl-8 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white font-semibold focus:border-fuchsia-500/50 focus:outline-none transition-colors"
            />
          </div>
          <p className="text-slate-500 text-xs">
            Rango permitido: ${minBetAmount.toLocaleString("es-AR")} - $
            {maxBetAmount.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      {/* Cálculo del total */}
      <div className="bg-gradient-to-br from-amber-500/20 to-slate-800/40 border-2 border-amber-500/40 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-amber-300 font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Total a pagar
          </span>
          <span className="text-2xl font-bold text-white">
            ${totalAmount.toLocaleString("es-AR")}
          </span>
        </div>

        {combinaciones > 1 && amount > 0 && (
          <div className="text-xs text-slate-400 space-y-1">
            <p>
              💡 ${amount.toLocaleString("es-AR")} por combinación ×{" "}
              {combinaciones} combinaciones
            </p>
            {betTypeConfig.multiplier && betTypeConfig.multiplier > 1 && (
              <p>
                × {betTypeConfig.multiplier} (multiplicador de{" "}
                {betTypeConfig.label})
              </p>
            )}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between">
          <span className="text-slate-400 text-sm">Tu saldo disponible:</span>
          <span
            className={`font-bold ${
              totalAmount > userSaldo ? "text-red-400" : "text-emerald-400"
            }`}>
            ${userSaldo.toLocaleString("es-AR")}
          </span>
        </div>

        {totalAmount > 0 && totalAmount <= userSaldo && (
          <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between">
            <span className="text-slate-400 text-sm">Saldo después:</span>
            <span className="font-bold text-white">
              ${(userSaldo - totalAmount).toLocaleString("es-AR")}
            </span>
          </div>
        )}
      </div>

      {/* Mensaje de validación */}
      {amount > 0 && !isAmountValid() && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{getValidationMessage()}</p>
        </div>
      )}

      {/* Mensaje de éxito */}
      {amount > 0 && isAmountValid() && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm">
            ¡Listo! Tu apuesta está lista para confirmar
          </p>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white font-semibold rounded-xl transition-all">
          <ChevronLeft className="w-5 h-5" />
          Volver
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canProceed || !isAmountValid()}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${
            canProceed && isAmountValid()
              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20"
              : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
          }`}>
          <Check className="w-5 h-5" />
          Confirmar Apuesta
        </button>
      </div>

      {/* Modal de Combinaciones */}
      <CombinationsViewer
        selectedHorses={selectedHorses}
        betTypeConfig={betTypeConfig}
        isOpen={showCombinations}
        onClose={() => setShowCombinations(false)}
      />
    </div>
  );
};

export default BetAmount;

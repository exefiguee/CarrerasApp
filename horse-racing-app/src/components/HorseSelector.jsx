import { useState } from "react";
import { X, ChevronLeft, Check, Trophy, AlertCircle } from "lucide-react";

const HorseSelector = ({
  horses,
  betType,
  betTypeConfig,
  selectedHorses,
  onSelect,
  onBack,
  onNext,
  canProceed,
  race,
}) => {
  console.log("🐴 HorseSelector - Tipo de apuesta:", betType);
  console.log("🔧 Configuración:", betTypeConfig);

  // 🎯 Determinar el modo de selección
  const isSimple = ["GANADOR", "SEGUNDO", "TERCERO"].includes(betType);
  const isTira = betType === "TIRA(1,2,3)";
  const isDirecta = betTypeConfig?.type === "directa";
  const isCombinada =
    betTypeConfig?.type === "combinada" ||
    betTypeConfig?.type === "combinada-multiple";
  const isMultipleRaces = betTypeConfig?.type === "multiple-races";

  // 🔥 Verificar si un caballo está habilitado
  const isHorseEnabled = (horse) => {
    const key = `caballo_${horse.number}`;
    return race?.caballitos?.[key] === true;
  };

  const toggleHorse = (horse) => {
    if (!isHorseEnabled(horse)) {
      console.log(`⛔ Caballo ${horse.number} no corre`);
      return;
    }

    const isSelected = selectedHorses.some((h) => h.number === horse.number);

    if (isSelected) {
      const newSelection = selectedHorses.filter(
        (h) => h.number !== horse.number
      );
      console.log("❌ Caballo deseleccionado:", newSelection);
      onSelect(newSelection);
    } else {
      if (selectedHorses.length < betTypeConfig.maxHorses) {
        const newSelection = [...selectedHorses, horse];
        console.log("✅ Caballo seleccionado:", newSelection);
        onSelect(newSelection);
      } else {
        console.log("⚠️ Límite alcanzado:", betTypeConfig.maxHorses);
      }
    }
  };

  const handleNext = () => {
    if (selectedHorses.length >= betTypeConfig.minHorses) {
      console.log("➡️ Continuando con caballos:", selectedHorses);
      onNext(selectedHorses);
    } else {
      console.error("⚠️ Selección insuficiente");
    }
  };

  // 🎯 Calcular combinaciones
  const calculateCombinations = (numCaballos, config) => {
    if (isSimple || isTira || isDirecta) return 1;

    const positions = config.positions || 2;

    if (config.type === "combinada-multiple") {
      if (betType === "IMPERFECTA C") {
        // Combinaciones: C(n, 2)
        return (
          factorial(numCaballos) /
          (factorial(positions) * factorial(numCaballos - positions))
        );
      }
      // Permutaciones: P(n, k)
      return factorial(numCaballos) / factorial(numCaballos - positions);
    }

    if (isMultipleRaces) {
      return numCaballos;
    }

    return 1;
  };

  const factorial = (n) => {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  };

  const combinaciones = calculateCombinations(
    selectedHorses.length,
    betTypeConfig
  );

  // 🎯 Texto de instrucciones según el tipo de apuesta
  const getInstructions = () => {
    if (isSimple) {
      return "Selecciona 1 caballo";
    }
    if (isTira) {
      return "Selecciona 1 caballo (se jugará a ganador, segundo y tercero)";
    }
    if (isDirecta) {
      const positions = betTypeConfig.positions;
      return `Selecciona ${positions} caballos en orden (1°, 2°, 3°${
        positions > 3 ? ", 4°" : ""
      }${positions > 4 ? ", 5°" : ""})`;
    }
    if (isCombinada) {
      return `Selecciona de ${betTypeConfig.minHorses} a ${betTypeConfig.maxHorses} caballos (se generarán todas las combinaciones)`;
    }
    if (isMultipleRaces) {
      return `Selecciona caballos ganadores para ${betTypeConfig.races} carreras`;
    }
    return "Selecciona los caballos para tu apuesta";
  };

  return (
    <div className="space-y-4">
      {/* Información de selección */}
      <div className="bg-gradient-to-r from-fuchsia-500/20 to-slate-800/40 border border-fuchsia-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-fuchsia-300 font-semibold">
            {isCombinada
              ? "Apuesta Combinada"
              : isDirecta
              ? "Apuesta Directa"
              : isMultipleRaces
              ? "Múltiples Carreras"
              : "Selección Simple"}
          </span>
          <span className="px-3 py-1 bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-lg text-fuchsia-300 text-sm font-bold">
            {selectedHorses.length}/{betTypeConfig.maxHorses}
          </span>
        </div>
        <p className="text-slate-300 text-sm mb-2">{getInstructions()}</p>

        {isCombinada && selectedHorses.length >= betTypeConfig.minHorses && (
          <div className="mt-3 pt-3 border-t border-fuchsia-500/20">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">
                Combinaciones generadas:
              </span>
              <span className="text-amber-300 font-bold text-lg">
                {combinaciones}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lista de caballos */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {horses.map((horse) => {
          const isEnabled = isHorseEnabled(horse);
          const isSelected = selectedHorses.some(
            (h) => h.number === horse.number
          );
          const selectionIndex = selectedHorses.findIndex(
            (h) => h.number === horse.number
          );
          const reachedLimit =
            !isSelected && selectedHorses.length >= betTypeConfig.maxHorses;

          return (
            <button
              key={horse.number}
              onClick={() => toggleHorse(horse)}
              disabled={!isEnabled || reachedLimit}
              className={`group w-full text-left p-4 rounded-xl transition-all duration-300 ${
                !isEnabled
                  ? "bg-slate-800/20 border border-red-900/30 opacity-60 cursor-not-allowed"
                  : isSelected
                  ? "bg-gradient-to-br from-fuchsia-500/25 via-fuchsia-600/20 to-slate-800/40 border-2 border-fuchsia-400/60 shadow-lg shadow-fuchsia-500/20"
                  : reachedLimit
                  ? "bg-slate-800/20 border border-slate-700/30 opacity-50 cursor-not-allowed"
                  : "bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 hover:border-fuchsia-500/50 hover:shadow-lg hover:shadow-fuchsia-500/10"
              }`}>
              <div className="flex items-center gap-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
                    !isEnabled
                      ? "bg-slate-700/30 text-slate-600 border border-slate-700/50"
                      : isSelected
                      ? "bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30"
                      : "bg-slate-800/50 text-slate-400 border border-slate-700/50 group-hover:border-fuchsia-500/50"
                  }`}>
                  {horse.number}
                </div>

                <div className="flex-1">
                  <h3
                    className={`font-bold text-lg transition-colors ${
                      !isEnabled
                        ? "text-slate-600"
                        : isSelected
                        ? "text-fuchsia-300"
                        : "text-slate-300 group-hover:text-white"
                    }`}>
                    {horse.name}
                  </h3>
                  {!isEnabled && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-red-900/30 border border-red-800/50 rounded text-red-400 text-xs font-bold">
                      NO CORRE
                    </span>
                  )}
                </div>

                {isSelected && isEnabled && (
                  <div className="flex items-center gap-2">
                    {isDirecta && (
                      <span className="px-3 py-1 bg-fuchsia-500 text-white rounded-lg text-sm font-bold">
                        {selectionIndex + 1}° puesto
                      </span>
                    )}
                    <div className="w-6 h-6 rounded-full bg-fuchsia-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Botones de navegación */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white font-semibold rounded-xl transition-all">
          <ChevronLeft className="w-5 h-5" />
          Volver
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${
            canProceed
              ? "bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-400 text-white shadow-lg shadow-fuchsia-500/20"
              : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
          }`}>
          Continuar
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
      </div>
    </div>
  );
};

export default HorseSelector;

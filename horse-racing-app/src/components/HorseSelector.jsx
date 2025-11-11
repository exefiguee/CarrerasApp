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

const HorseSelector = ({
  horses,
  betType,
  betTypeConfig,
  selectedHorses,
  onSelect,
  onBack,
  onNext,
  canProceed,
}) => {
  const toggleHorse = (horse) => {
    console.log("🐴 Caballo clickeado:", horse);
    const isSelected = selectedHorses.some((h) => h.number === horse.number);

    if (isSelected) {
      const newSelection = selectedHorses.filter((h) => h.number !== horse.number);
      console.log("❌ Caballo deseleccionado. Nueva selección:", newSelection);
      onSelect(newSelection);
    } else {
      if (selectedHorses.length < betTypeConfig.maxHorses) {
        const newSelection = [...selectedHorses, horse];
        console.log("✅ Caballo seleccionado. Nueva selección:", newSelection);
        onSelect(newSelection);
      }
    }
  };

  const handleNext = () => {
    console.log("➡️ Continuando con caballos:", selectedHorses);
    if (selectedHorses.length > 0) {
      onNext(selectedHorses);  // ✅ Ahora SÍ pasa los caballos
    } else {
      console.error("⚠️ No hay caballos seleccionados");
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-fuchsia-500/20 to-slate-800/40 border border-fuchsia-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-fuchsia-300 font-semibold">
            Selección de Caballos
          </span>
          <span className="px-3 py-1 bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-lg text-fuchsia-300 text-sm font-bold">
            {selectedHorses.length}/{betTypeConfig.maxHorses}
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          {betTypeConfig.minHorses === betTypeConfig.maxHorses
            ? `Debes seleccionar exactamente ${betTypeConfig.minHorses} ${betTypeConfig.minHorses === 1 ? "caballo" : "caballos"
            }`
            : `Selecciona entre ${betTypeConfig.minHorses} y ${betTypeConfig.maxHorses} caballos`}
        </p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {horses.map((horse) => {
          const isSelected = selectedHorses.some(
            (h) => h.number === horse.number
          );
          const selectionIndex = selectedHorses.findIndex(
            (h) => h.number === horse.number
          );

          return (
            <button
              key={horse.number}
              onClick={() => toggleHorse(horse)}
              disabled={
                !isSelected && selectedHorses.length >= betTypeConfig.maxHorses
              }
              className={`group w-full text-left p-4 rounded-xl transition-all duration-300 ${isSelected
                ? "bg-gradient-to-br from-fuchsia-500/25 via-fuchsia-600/20 to-slate-800/40 border-2 border-fuchsia-400/60 shadow-lg shadow-fuchsia-500/20"
                : selectedHorses.length >= betTypeConfig.maxHorses
                  ? "bg-slate-800/20 border border-slate-700/30 opacity-50 cursor-not-allowed"
                  : "bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 hover:border-fuchsia-500/50 hover:shadow-lg hover:shadow-fuchsia-500/10"
                }`}>
              <div className="flex items-center gap-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${isSelected
                    ? "bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700/50 group-hover:border-fuchsia-500/50"
                    }`}>
                  {horse.number}
                </div>

                <div className="flex-1">
                  <h3
                    className={`font-bold text-lg transition-colors ${isSelected
                      ? "text-fuchsia-300"
                      : "text-slate-300 group-hover:text-white"
                      }`}>
                    {horse.name}
                  </h3>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-fuchsia-500 text-white rounded-lg text-sm font-bold">
                      #{selectionIndex + 1}
                    </span>
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

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white font-semibold rounded-xl transition-all">
          <ChevronLeft className="w-5 h-5" />
          Volver
        </button>
        <button
          // onClick={onNext}
          onClick={handleNext}
          disabled={!canProceed}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${canProceed
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

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

const BetTypeSelector = ({ betTypes, onSelect }) => {
  return (
    <div className="space-y-3">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl mb-3">
          <Trophy className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-300 font-semibold">
            Tipos de Apuesta
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          Selecciona el tipo de apuesta que deseas realizar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(betTypes).map(([key, config]) => {
          const icons = {
            GANADOR: Trophy,
            SEGUNDO: Medal,
            TERCERO: Target,
            EXACTA: Sparkles,
            TRIFECTA_D: Trophy,
            TIRA_1_2: ArrowRight,
            TIRA_1_2_3: ArrowRight,
            TRIFECTA_C: Sparkles,
          };
          const Icon = icons[key] || Trophy;

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="group relative p-4 rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 text-left overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

              <div className="relative flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 group-hover:bg-emerald-500/30 transition-colors">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg mb-1 group-hover:text-emerald-300 transition-colors">
                    {config.label}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {config.minHorses === config.maxHorses
                      ? `Selecciona ${config.minHorses} ${
                          config.minHorses === 1 ? "caballo" : "caballos"
                        }`
                      : `${config.minHorses} a ${config.maxHorses} caballos`}
                  </p>
                </div>

                <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 rotate-180 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BetTypeSelector;

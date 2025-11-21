import { useState } from "react";
import {
  X,
  ChevronLeft,
  Check,
  Trophy,
  Target,
  Medal,
  Sparkles,
  Calculator,
  AlertCircle,
  Wallet,
  Ticket,
  TrendingUp,
  Zap,
  Layers,
} from "lucide-react";

const BetTypeSelector = ({ betTypes, onSelect }) => {
  // Categorizar tipos de apuesta
  const categories = {
    simples: {
      title: "Apuestas Simples",
      icon: Target,
      color: "emerald",
      types: ["GANADOR", "SEGUNDO", "TERCERO"],
    },
    derechas: {
      title: "Apuestas Derechas",
      icon: Trophy,
      color: "blue",
      types: [
        "EXACTA",
        "IMPERFECTA",
        "TRIFECTA D",
        "CUATRIFECTA D",
        "QUINTEX D",
      ],
    },
    combinadas: {
      title: "Apuestas Combinadas",
      icon: Layers,
      color: "purple",
      types: [
        "TIRA(1,2,3)",
        "IMPERFECTA C",
        "TRIFECTA C",
        "CUATRIFECTA C",
        "QUINTEX C",
      ],
    },
    multipleRaces: {
      title: "Múltiples Carreras",
      icon: Zap,
      color: "amber",
      types: ["DOBLE", "TRIPLO", "PICK 4", "PICK 5", "PICK 6"],
    },
  };

  const getBetTypesByCategory = (categoryTypes) => {
    return Object.entries(betTypes).filter(([key, config]) =>
      categoryTypes.some((type) => config.label === type)
    );
  };

  const getColorClasses = (color, isHovered = false) => {
    const colors = {
      emerald: {
        bg: "from-emerald-500/20 to-emerald-600/20",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        icon: "bg-emerald-500/20 border-emerald-500/30",
        hover: "hover:border-emerald-500/50",
      },
      blue: {
        bg: "from-blue-500/20 to-blue-600/20",
        border: "border-blue-500/30",
        text: "text-blue-400",
        icon: "bg-blue-500/20 border-blue-500/30",
        hover: "hover:border-blue-500/50",
      },
      purple: {
        bg: "from-purple-500/20 to-purple-600/20",
        border: "border-purple-500/30",
        text: "text-purple-400",
        icon: "bg-purple-500/20 border-purple-500/30",
        hover: "hover:border-purple-500/50",
      },
      amber: {
        bg: "from-amber-500/20 to-amber-600/20",
        border: "border-amber-500/30",
        text: "text-amber-400",
        icon: "bg-amber-500/20 border-amber-500/30",
        hover: "hover:border-amber-500/50",
      },
    };
    return colors[color];
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-xl mb-3">
          <Trophy className="w-5 h-5 text-fuchsia-400" />
          <span className="text-fuchsia-300 font-semibold">
            Tipos de Apuesta
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          Selecciona el tipo de apuesta que deseas realizar
        </p>
      </div>

      {Object.entries(categories).map(([categoryKey, category]) => {
        const betsInCategory = getBetTypesByCategory(category.types);
        if (betsInCategory.length === 0) return null;

        const CategoryIcon = category.icon;
        const colorClasses = getColorClasses(category.color);

        return (
          <div key={categoryKey} className="space-y-3">
            {/* Título de categoría */}
            <div
              className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${colorClasses.bg} border ${colorClasses.border} rounded-xl`}>
              <CategoryIcon className={`w-4 h-4 ${colorClasses.text}`} />
              <span className={`font-bold text-sm ${colorClasses.text}`}>
                {category.title}
              </span>
            </div>

            {/* Tipos de apuesta en esta categoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {betsInCategory.map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => onSelect(key)}
                  className={`group relative p-4 rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border ${colorClasses.border} ${colorClasses.hover} hover:shadow-lg transition-all duration-300 text-left overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fuchsia-500/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                  <div className="relative flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-lg ${colorClasses.icon} group-hover:bg-fuchsia-500/30 transition-colors`}>
                      <CategoryIcon
                        className={`w-5 h-5 ${colorClasses.text}`}
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1 group-hover:text-fuchsia-300 transition-colors">
                        {config.label}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {config.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-slate-800/50 border border-slate-700/50 rounded text-slate-400">
                          Min: ${config.apuestaMinima?.toLocaleString()}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800/50 border border-slate-700/50 rounded text-slate-400">
                          Máx: ${config.apuestaMaxima?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-fuchsia-400 rotate-180 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BetTypeSelector;

import { useState } from "react";
import { X, Eye, Layers } from "lucide-react";

const CombinationsViewer = ({
  selectedHorses,
  betTypeConfig,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  // 🎯 Detectar si es selección agrupada
  const isGroupedSelection = selectedHorses?.grouped === true;

  // 🎯 Generar combinaciones según el tipo de apuesta
  const generateCombinations = () => {
    const combinations = [];

    // Para GRUPOS POR POSICIÓN (EXACTA, IMPERFECTA, TRIFECTA D, CUATRIFECTA D)
    if (
      isGroupedSelection &&
      betTypeConfig?.selectionMode === "grouped-positions"
    ) {
      const positions = betTypeConfig?.positions || 2;

      // Obtener arrays de cada posición
      const positionArrays = [];
      for (let i = 1; i <= positions; i++) {
        const horses = selectedHorses[`position${i}`] || [];
        positionArrays.push(horses);
      }

      // Generar combinaciones mediante producto cartesiano
      const cartesianProduct = (arrays) => {
        if (arrays.length === 0) return [[]];

        const [first, ...rest] = arrays;
        const restProduct = cartesianProduct(rest);

        return first.flatMap((item) =>
          restProduct.map((combo) => [item, ...combo])
        );
      };

      const allCombinations = cartesianProduct(positionArrays);

      allCombinations.forEach((combo, index) => {
        combinations.push({
          id: index + 1,
          horses: combo,
        });
      });

      return combinations;
    }

    // Para COMBINADAS (TRIFECTA C, CUATRIFECTA C)
    if (betTypeConfig?.selectionMode === "ordered-combination") {
      const positions = betTypeConfig?.positions || 3;
      const horses = Array.isArray(selectedHorses) ? selectedHorses : [];

      // Generar permutaciones de K elementos
      const generatePermutations = (arr, size) => {
        if (size === 1) return arr.map((el) => [el]);

        const result = [];
        arr.forEach((el, i) => {
          const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
          const perms = generatePermutations(rest, size - 1);
          perms.forEach((perm) => result.push([el, ...perm]));
        });

        return result;
      };

      const allPerms = generatePermutations(horses, positions);

      allPerms.forEach((perm, index) => {
        combinations.push({
          id: index + 1,
          horses: perm,
        });
      });

      return combinations;
    }

    // Para MULTI-RACE
    if (betTypeConfig?.selectionMode === "multi-race") {
      const horses = Array.isArray(selectedHorses) ? selectedHorses : [];
      const races = betTypeConfig?.races || 2;

      // Generar producto cartesiano para múltiples carreras
      const generateMultiRaceCombinations = (arr, n) => {
        if (n === 1) return arr.map((el) => [el]);

        const result = [];
        const smaller = generateMultiRaceCombinations(arr, n - 1);

        arr.forEach((el) => {
          smaller.forEach((combo) => {
            result.push([el, ...combo]);
          });
        });

        return result;
      };

      const allCombos = generateMultiRaceCombinations(horses, races);

      allCombos.forEach((combo, index) => {
        combinations.push({
          id: index + 1,
          horses: combo,
        });
      });

      return combinations;
    }

    return [];
  };

  const combinations = generateCombinations();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/50 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-fuchsia-600/20 via-fuchsia-500/20 to-slate-800/40 border-b border-slate-800/50 p-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-fuchsia-500/20 rounded-lg border border-fuchsia-500/30">
                <Layers className="w-5 h-5 text-fuchsia-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Combinaciones Generadas
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  {betTypeConfig?.label} - Total: {combinations.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
              <X className="w-6 h-6 text-slate-400 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)] custom-scrollbar">
          {combinations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">
                No hay combinaciones para mostrar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {combinations.map((combo) => (
                <div
                  key={combo.id}
                  className="flex items-center gap-3 p-3 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-fuchsia-500/30 rounded-xl transition-all group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-slate-800/40 border border-fuchsia-500/30 flex items-center justify-center">
                    <span className="text-fuchsia-300 font-bold text-sm">
                      #{combo.id}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center gap-2 flex-wrap">
                    {combo.horses.map((horse, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <div className="px-3 py-1.5 bg-slate-900/50 border border-slate-700/50 rounded-lg group-hover:border-fuchsia-500/30 transition-colors">
                          <span className="text-white font-semibold text-sm">
                            #{horse.number}
                          </span>
                        </div>
                        {index < combo.horses.length - 1 && (
                          <span className="text-slate-600 font-bold">→</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {isGroupedSelection && (
                    <div className="flex-shrink-0 text-xs text-slate-500 font-medium">
                      {combo.horses.map((h, i) => `${i + 1}°`).join(" → ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900/50 border-t border-slate-800/50 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Total de combinaciones:
              <span className="ml-2 text-amber-300 font-bold text-lg">
                {combinations.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white font-semibold rounded-xl transition-all">
              Cerrar
            </button>
          </div>
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

export default CombinationsViewer;

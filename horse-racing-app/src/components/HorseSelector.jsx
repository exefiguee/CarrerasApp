import { useState } from "react";
import { ChevronLeft, Check, AlertCircle, Info } from "lucide-react";

const HorseSelector = ({
  horses,
  betType,
  betTypeConfig,
  selectedHorses = [], // ✅ Valor por defecto
  onSelect,
  onBack,
  onNext,
  race,
}) => {
  // 🎯 Estado para selección por posiciones (TRIFECTA D, CUATRIFECTA D)
  const [currentPosition, setCurrentPosition] = useState(1);

  // 🎯 Estado para grupos por posición (EXACTA, IMPERFECTA, TRIFECTA D, CUATRIFECTA D)
  const [groupedPositions, setGroupedPositions] = useState({
    position1: [],
    position2: [],
    position3: [],
    position4: [],
  });

  console.log("🐴 HorseSelector - Tipo de apuesta:", betType);
  console.log("🔧 Configuración:", betTypeConfig);
  console.log("🐴 Caballos seleccionados:", selectedHorses);
  console.log("📊 Grupos por posición:", groupedPositions);

  // 🔥 Validación de datos
  if (!horses || horses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-16 h-16 text-slate-600 mb-4" />
        <p className="text-slate-400 text-center">
          No hay caballos disponibles para esta carrera
        </p>
      </div>
    );
  }

  if (!betTypeConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-16 h-16 text-slate-600 mb-4" />
        <p className="text-slate-400 text-center">
          Error en la configuración de la apuesta
        </p>
      </div>
    );
  }

  // 🎯 Determinar el modo de selección
  const selectionMode = betTypeConfig?.selectionMode || "single";
  const isSimple = selectionMode === "single";
  const isOrderedDirect = selectionMode === "ordered-direct"; // YA NO SE USA
  const isGroupedPositions = selectionMode === "grouped-positions"; // EXACTA, IMPERFECTA, TRIFECTA D, CUATRIFECTA D
  const isOrderedCombination = selectionMode === "ordered-combination"; // TRIFECTA C, CUATRIFECTA C
  const isMultiRace = selectionMode === "multi-race";

  // 🔥 Verificar si un caballo está habilitado
  const isHorseEnabled = (horse) => {
    const key = `caballo_${horse.number}`;
    return race?.caballitos?.[key] === true;
  };

  // 🎯 Toggle caballo según el tipo de apuesta
  const toggleHorse = (horse) => {
    if (!isHorseEnabled(horse)) {
      console.log(`⛔ Caballo ${horse.number} no corre`);
      return;
    }

    // 🔥 Para apuestas con GRUPOS POR POSICIÓN (EXACTA, IMPERFECTA, TRIFECTA D, CUATRIFECTA D)
    if (isGroupedPositions) {
      const positionKey = `position${currentPosition}`;
      const currentGroup = groupedPositions[positionKey] || [];

      const group1Count = groupedPositions.position1?.length || 0;

      // 🎯 Determinar el número total de posiciones
      const totalPositions = betTypeConfig?.positions || 2;

      // 🎯 Solo aplicar restricción de "no repetir" si group1 tiene exactamente 1 caballo
      if (group1Count === 1) {
        const otherPositions = Object.keys(groupedPositions).filter(
          (key) => key !== positionKey
        );
        const isInOtherPosition = otherPositions.some((key) =>
          groupedPositions[key]?.some((h) => h.number === horse.number)
        );

        if (isInOtherPosition) {
          alert(
            `⚠️ El caballo #${horse.number} ya está seleccionado en otra posición. Con 1 solo caballo en 1° puesto, no puedes repetir caballos.`
          );
          return;
        }
      }

      const maxAllowedInPosition =
        group1Count === 1 && currentPosition > 1 ? 1 : 10;
      const currentGroupCount = currentGroup.length;
      const isInCurrentGroup = currentGroup.some(
        (h) => h.number === horse.number
      );

      if (isInCurrentGroup) {
        const newGroup = currentGroup.filter((h) => h.number !== horse.number);
        setGroupedPositions({
          ...groupedPositions,
          [positionKey]: newGroup,
        });
        console.log(
          `❌ Caballo #${horse.number} removido de posición ${currentPosition}`
        );
      } else {
        if (currentGroupCount >= maxAllowedInPosition) {
          alert(
            `⚠️ Solo puedes seleccionar ${maxAllowedInPosition} caballo(s) en ${currentPosition}° puesto cuando tienes ${group1Count} en 1° puesto`
          );
          return;
        }

        const newGroup = [...currentGroup, horse];
        setGroupedPositions({
          ...groupedPositions,
          [positionKey]: newGroup,
        });
        console.log(
          `✅ Caballo #${horse.number} agregado a posición ${currentPosition}`
        );
      }
      return;
    }

    // 🔥 Para apuestas DIRECTAS (TRIFECTA D, CUATRIFECTA D)
    if (isOrderedDirect) {
      const newSelection = [...selectedHorses];
      const positionIndex = currentPosition - 1;
      newSelection[positionIndex] = horse;

      onSelect(newSelection);
      console.log(
        `✅ Caballo #${horse.number} asignado a posición ${currentPosition}`
      );

      if (currentPosition < betTypeConfig.positions) {
        setCurrentPosition(currentPosition + 1);
      }
      return;
    }

    // 🔥 Para apuestas SIMPLES (GANADOR, SEGUNDO, TERCERO, TIRA)
    if (isSimple || betTypeConfig?.type === "tira") {
      if (selectedHorses.some((h) => h.number === horse.number)) {
        onSelect([]);
        console.log(`❌ Caballo #${horse.number} deseleccionado`);
      } else {
        onSelect([horse]);
        console.log(`✅ Caballo #${horse.number} seleccionado`);
      }
      return;
    }

    // 🔥 Para apuestas COMBINADAS (TRIFECTA C, CUATRIFECTA C) y MULTI-RACE
    if (isOrderedCombination || isMultiRace) {
      const isSelected = selectedHorses.some((h) => h.number === horse.number);

      if (isSelected) {
        const newSelection = selectedHorses.filter(
          (h) => h.number !== horse.number
        );
        onSelect(newSelection);
        console.log(`❌ Caballo #${horse.number} removido`);
      } else {
        if (selectedHorses.length >= betTypeConfig.maxHorses) {
          alert(
            `⚠️ Solo puedes seleccionar hasta ${betTypeConfig.maxHorses} caballos`
          );
          return;
        }

        const newSelection = [...selectedHorses, horse];
        onSelect(newSelection);
        console.log(`✅ Caballo #${horse.number} agregado`);
      }
      return;
    }

    // 🔥 FALLBACK
    const isSelected = selectedHorses.some((h) => h.number === horse.number);

    if (isSelected) {
      const newSelection = selectedHorses.filter(
        (h) => h.number !== horse.number
      );
      onSelect(newSelection);
    } else {
      if (selectedHorses.length >= betTypeConfig.maxHorses) {
        alert(
          `⚠️ Solo puedes seleccionar hasta ${betTypeConfig.maxHorses} caballos`
        );
        return;
      }
      const newSelection = [...selectedHorses, horse];
      onSelect(newSelection);
    }
  };

  // 🎯 Calcular combinaciones
  const calculateCombinations = () => {
    // Para grupos por posición (EXACTA, IMPERFECTA, TRIFECTA D, CUATRIFECTA D)
    if (isGroupedPositions) {
      const positions = betTypeConfig?.positions || 2;
      let total = 1;

      for (let i = 1; i <= positions; i++) {
        const count = groupedPositions[`position${i}`]?.length || 0;
        if (count === 0) return 0;
        total *= count;
      }

      return total;
    }

    // Asegurar que selectedHorses sea un array
    const horsesArray = Array.isArray(selectedHorses) ? selectedHorses : [];
    const n = horsesArray.length;

    if (n === 0) return 0;

    if (isSimple) return 1;
    if (betTypeConfig?.type === "tira") return 3;
    if (selectionMode === "ordered-direct") return 1;

    if (selectionMode === "ordered-combination") {
      const positions = betTypeConfig?.positions || 3;
      if (n < positions) return 0;

      // Permutaciones: P(n,r) = n! / (n-r)!
      return factorial(n) / factorial(n - positions);
    }

    if (isMultiRace) {
      return Math.pow(n, betTypeConfig?.races || 1);
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

  // 🎯 Texto de instrucciones según el tipo de apuesta
  const getInstructions = () => {
    if (isSimple) return "Selecciona 1 caballo";
    if (betTypeConfig?.type === "tira")
      return "Selecciona 1 caballo (se jugará automáticamente a ganador, segundo Y tercero = 3 apuestas)";

    if (isGroupedPositions) {
      const positions = betTypeConfig?.positions || 2;
      if (positions === 2) {
        return "Selecciona varios caballos para 1° puesto y varios para 2° puesto. Se generan combinaciones: (1° × 2°)";
      } else if (positions === 3) {
        return "Selecciona varios caballos para cada uno de los 3 primeros puestos. Se generan combinaciones: (1° × 2° × 3°)";
      } else if (positions === 4) {
        return "Selecciona varios caballos para cada uno de los 4 primeros puestos. Se generan combinaciones: (1° × 2° × 3° × 4°)";
      }
      return "Selecciona varios caballos por posición";
    }

    if (isOrderedDirect) {
      const positions = betTypeConfig?.positions || 0;
      if (positions === 3)
        return `Selecciona 1 caballo por cada posición. Click en los botones arriba para cambiar de posición.`;
      if (positions === 4)
        return `Selecciona 1 caballo para cada uno de los 4 primeros puestos. Usa los botones de posición para navegar.`;
    }

    if (isOrderedCombination) {
      const positions = betTypeConfig?.positions || 3;
      const positionsText =
        positions === 3 ? "3 primeros puestos" : "4 primeros puestos";
      return `Selecciona ${positions} o más caballos. Se generarán todas las combinaciones EN ORDEN para los ${positionsText}`;
    }

    if (isMultiRace) {
      const racesText =
        betTypeConfig?.races === 2
          ? "2 carreras"
          : betTypeConfig?.races === 3
          ? "3 carreras"
          : betTypeConfig?.races === 4
          ? "4 carreras"
          : betTypeConfig?.races === 5
          ? "5 carreras"
          : `${betTypeConfig?.races || 0} carreras`;
      return `Selecciona de 1 a ${
        betTypeConfig?.maxHorses || 10
      } caballos ganadores para ${racesText} consecutivas`;
    }

    return `Selecciona de ${betTypeConfig?.minHorses || 1} a ${
      betTypeConfig?.maxHorses || 10
    } caballos`;
  };

  const handleNext = () => {
    if (isGroupedPositions) {
      const positions = betTypeConfig?.positions || 2;
      const groups = {};

      for (let i = 1; i <= positions; i++) {
        const group = groupedPositions[`position${i}`] || [];
        if (group.length === 0) {
          alert(`⚠️ Debes seleccionar al menos 1 caballo en la posición ${i}°`);
          return;
        }
        groups[`position${i}`] = group;
      }

      console.log("➡️ Continuando con grupos:", groups);
      onNext({ grouped: true, ...groups });
      return;
    }

    if (isOrderedDirect) {
      const requiredPositions = betTypeConfig?.positions || 0;
      if (selectedHorses.length < requiredPositions) {
        alert(
          `⚠️ Debes seleccionar ${requiredPositions} caballos (uno por cada posición)`
        );
        return;
      }
      console.log("➡️ Continuando con selección directa:", selectedHorses);
      onNext(selectedHorses);
      return;
    }

    const minHorses = betTypeConfig?.minHorses || 1;
    if (selectedHorses.length >= minHorses) {
      console.log("➡️ Continuando con caballos:", selectedHorses);
      onNext(selectedHorses);
    } else {
      console.error("⚠️ Selección insuficiente");
    }
  };

  // 🎯 Función para validar si se puede continuar
  const canProceed = () => {
    if (isGroupedPositions) {
      const positions = betTypeConfig?.positions || 2;
      for (let i = 1; i <= positions; i++) {
        const count = groupedPositions[`position${i}`]?.length || 0;
        if (count < 1) return false;
      }
      return true;
    }

    if (isOrderedDirect) {
      const requiredPositions = betTypeConfig?.positions || 0;
      return selectedHorses.length >= requiredPositions;
    }

    const minHorses = betTypeConfig?.minHorses || 1;
    return selectedHorses.length >= minHorses;
  };

  const changePosition = (position) => {
    setCurrentPosition(position);
  };

  return (
    <div className="space-y-4">
      {/* Información de selección */}
      <div className="bg-gradient-to-r from-fuchsia-500/20 to-slate-800/40 border border-fuchsia-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-fuchsia-300 font-semibold flex items-center gap-2">
            {betTypeConfig?.label || betType}
            <Info className="w-4 h-4 text-slate-400" />
          </span>
          <span className="px-3 py-1 bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-lg text-fuchsia-300 text-sm font-bold">
            {isGroupedPositions
              ? (() => {
                  const positions = betTypeConfig?.positions || 2;
                  const counts = [];
                  for (let i = 1; i <= positions; i++) {
                    counts.push(groupedPositions[`position${i}`]?.length || 0);
                  }
                  return counts.join("+");
                })()
              : `${Array.isArray(selectedHorses) ? selectedHorses.length : 0}/${
                  betTypeConfig.maxHorses
                }`}
          </span>
        </div>

        <p className="text-slate-300 text-sm mb-2">{getInstructions()}</p>

        {betTypeConfig?.description && (
          <p className="text-slate-400 text-xs italic mt-2">
            ℹ️ {betTypeConfig.description}
          </p>
        )}

        {/* SELECTOR DE POSICIONES para apuestas con grupos */}
        {isGroupedPositions && (
          <div className="mt-3 pt-3 border-t border-fuchsia-500/20">
            <p className="text-slate-400 text-xs mb-2">
              Seleccionando caballos para:
            </p>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: betTypeConfig?.positions || 2 }, (_, i) => {
                const position = i + 1;
                const count =
                  groupedPositions[`position${position}`]?.length || 0;
                return (
                  <button
                    key={position}
                    onClick={() => changePosition(position)}
                    className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                      currentPosition === position
                        ? "bg-fuchsia-500 text-white shadow-lg"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                    }`}>
                    {position}° puesto
                    {count > 0 && (
                      <span className="ml-2 text-xs">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SELECTOR DE POSICIONES para apuestas directas */}
        {isOrderedDirect && betTypeConfig?.positions && (
          <div className="mt-3 pt-3 border-t border-fuchsia-500/20">
            <p className="text-slate-400 text-xs mb-2">
              Seleccionando caballo para:
            </p>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: betTypeConfig.positions }, (_, i) => {
                const position = i + 1;
                const horse = selectedHorses[i];
                return (
                  <button
                    key={position}
                    onClick={() => changePosition(position)}
                    className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                      currentPosition === position
                        ? "bg-fuchsia-500 text-white shadow-lg"
                        : horse
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                        : "bg-slate-800/50 text-slate-400 border border-slate-700/50"
                    }`}>
                    {position}° puesto
                    {horse && (
                      <span className="ml-2 text-xs">(#{horse.number})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mostrar combinaciones generadas */}
        {((isGroupedPositions && combinaciones > 0) ||
          (!isGroupedPositions &&
            selectedHorses.length >= betTypeConfig.minHorses &&
            combinaciones > 0)) && (
          <div className="mt-3 pt-3 border-t border-fuchsia-500/20">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">
                  {betTypeConfig.type === "tira"
                    ? "Apuestas incluidas:"
                    : combinaciones === 1
                    ? "Apuesta directa:"
                    : "Combinaciones generadas:"}
                </span>
                <span className="text-amber-300 font-bold text-lg">
                  {combinaciones}
                </span>
              </div>

              {betTypeConfig.type === "tira" && (
                <div className="text-xs text-slate-400 space-y-1 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                    <span>1 apuesta a Ganador</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                    <span>1 apuesta a Segundo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                    <span>1 apuesta a Tercero</span>
                  </div>
                </div>
              )}

              {isGroupedPositions && combinaciones > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  💡{" "}
                  {(() => {
                    const positions = betTypeConfig?.positions || 2;
                    const parts = [];
                    for (let i = 1; i <= positions; i++) {
                      parts.push(
                        `${
                          groupedPositions[`position${i}`]?.length || 0
                        } (${i}°)`
                      );
                    }
                    return (
                      parts.join(" × ") + ` = ${combinaciones} combinaciones`
                    );
                  })()}
                </p>
              )}

              {isOrderedCombination &&
                (() => {
                  const horsesArray = Array.isArray(selectedHorses)
                    ? selectedHorses
                    : [];
                  const positions = betTypeConfig?.positions || 3;
                  return horsesArray.length >= positions;
                })() && (
                  <p className="text-xs text-slate-400 mt-2">
                    💡 Con{" "}
                    {Array.isArray(selectedHorses) ? selectedHorses.length : 0}{" "}
                    caballos seleccionados, se generan{" "}
                    <strong className="text-amber-300">{combinaciones}</strong>{" "}
                    combinaciones ordenadas diferentes para los{" "}
                    {betTypeConfig?.positions || 3} primeros puestos
                  </p>
                )}

              {isOrderedDirect &&
                (() => {
                  const horsesArray = Array.isArray(selectedHorses)
                    ? selectedHorses
                    : [];
                  return horsesArray.length === (betTypeConfig?.positions || 0);
                })() && (
                  <p className="text-xs text-emerald-400 mt-2">
                    ✅ Selección completa:{" "}
                    {Array.isArray(selectedHorses)
                      ? selectedHorses
                          .map((h, i) => `${i + 1}°: #${h.number} ${h.name}`)
                          .join(" • ")
                      : ""}
                  </p>
                )}

              {isMultiRace &&
                (() => {
                  const horsesArray = Array.isArray(selectedHorses)
                    ? selectedHorses
                    : [];
                  return horsesArray.length >= 1;
                })() && (
                  <p className="text-xs text-slate-400 mt-2">
                    💡 Con{" "}
                    {Array.isArray(selectedHorses) ? selectedHorses.length : 0}{" "}
                    {(Array.isArray(selectedHorses)
                      ? selectedHorses.length
                      : 0) === 1
                      ? "caballo"
                      : "caballos"}
                    , tienes {combinaciones}{" "}
                    {combinaciones === 1 ? "combinación" : "combinaciones"} para
                    las {betTypeConfig?.races || 0} carreras
                  </p>
                )}
            </div>
          </div>
        )}

        {!isGroupedPositions &&
          (() => {
            const horsesArray = Array.isArray(selectedHorses)
              ? selectedHorses
              : [];
            return (
              horsesArray.length > 0 &&
              horsesArray.length < betTypeConfig.minHorses
            );
          })() && (
            <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center gap-2 text-amber-400 text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>
                Faltan{" "}
                {betTypeConfig.minHorses -
                  (Array.isArray(selectedHorses)
                    ? selectedHorses.length
                    : 0)}{" "}
                caballo(s) más
              </span>
            </div>
          )}
      </div>

      {/* Lista de caballos */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {horses.map((horse) => {
          const isEnabled = isHorseEnabled(horse);

          let isSelected = false;
          let selectedInPosition = null;

          if (isGroupedPositions) {
            const positions = betTypeConfig?.positions || 2;
            for (let i = 1; i <= positions; i++) {
              if (
                groupedPositions[`position${i}`]?.some(
                  (h) => h.number === horse.number
                )
              ) {
                isSelected = true;
                selectedInPosition = i;
                break;
              }
            }
          } else {
            // Asegurar que selectedHorses sea un array antes de usar métodos de array
            const horsesArray = Array.isArray(selectedHorses)
              ? selectedHorses
              : [];

            const isSelectedInCurrentPosition =
              isOrderedDirect &&
              horsesArray[currentPosition - 1]?.number === horse.number;

            isSelected = isOrderedDirect
              ? isSelectedInCurrentPosition
              : horsesArray.some((h) => h.number === horse.number);
          }

          // Usar array seguro para findIndex
          const horsesArray = Array.isArray(selectedHorses)
            ? selectedHorses
            : [];
          const selectionIndex = horsesArray.findIndex(
            (h) => h.number === horse.number
          );

          // Usar array seguro para verificar límite
          const horsesArrayForLimit = Array.isArray(selectedHorses)
            ? selectedHorses
            : [];
          const reachedLimit =
            !isOrderedDirect &&
            !isGroupedPositions &&
            !isSelected &&
            horsesArrayForLimit.length >= betTypeConfig.maxHorses;

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
                      🚫 NO CORRE
                    </span>
                  )}
                  {horse.jockey && isEnabled && (
                    <p className="text-slate-500 text-sm mt-1">
                      {horse.jockey}
                    </p>
                  )}
                </div>

                {isSelected && isEnabled && (
                  <div className="flex items-center gap-2">
                    {isGroupedPositions && selectedInPosition && (
                      <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm font-bold">
                        {selectedInPosition}° puesto
                      </span>
                    )}
                    {isOrderedDirect && (
                      <span className="px-3 py-1 bg-fuchsia-500 text-white rounded-lg text-sm font-bold">
                        {selectionIndex + 1}° puesto
                      </span>
                    )}
                    {isOrderedCombination && (
                      <span className="px-3 py-1 bg-amber-500 text-white rounded-lg text-sm font-bold">
                        #{selectionIndex + 1}
                      </span>
                    )}
                    <div className="w-6 h-6 rounded-full bg-fuchsia-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {isOrderedDirect && !isSelected && isEnabled && (
                  <div className="px-3 py-1 bg-slate-700/50 text-slate-400 rounded-lg text-xs">
                    Click para {currentPosition}°
                  </div>
                )}

                {isGroupedPositions && !isSelected && isEnabled && (
                  <div className="px-3 py-1 bg-slate-700/50 text-slate-400 rounded-lg text-xs">
                    Para {currentPosition}° puesto
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
          disabled={!canProceed()}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${
            canProceed()
              ? "bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-400 text-white shadow-lg shadow-fuchsia-500/20"
              : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
          }`}>
          Continuar
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
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
      `}</style>
    </div>
  );
};

export default HorseSelector;

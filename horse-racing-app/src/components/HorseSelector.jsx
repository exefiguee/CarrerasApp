import { useState, useEffect } from "react";
import { ChevronLeft, Check, AlertCircle, Info } from "lucide-react";
import { db } from "../firebase/config";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

const HorseSelector = ({
  horses,
  betType,
  betTypeConfig,
  selectedHorses = [],
  onSelect,
  onBack,
  onNext,
  race,
}) => {
  const [currentPosition, setCurrentPosition] = useState(1);
  const [groupedPositions, setGroupedPositions] = useState({
    position1: [],
    position2: [],
    position3: [],
    position4: [],
  });

  const [currentRace, setCurrentRace] = useState(1);
  const [groupedRaces, setGroupedRaces] = useState({
    race1: [],
    race2: [],
    race3: [],
    race4: [],
    race5: [],
  });
  const [nextRaces, setNextRaces] = useState([]);
  const [loadingNextRaces, setLoadingNextRaces] = useState(false);

  console.log("🐴 HorseSelector - Tipo de apuesta:", betType);
  console.log("🔧 Configuración:", betTypeConfig);
  console.log("🐴 Caballos seleccionados:", selectedHorses);
  console.log("📊 Grupos por posición:", groupedPositions);
  console.log("🏇 Grupos por carrera:", groupedRaces);
  console.log("📋 Carreras siguientes:", nextRaces);

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

  const selectionMode = betTypeConfig?.selectionMode || "single";
  const isSimple = selectionMode === "single";
  const isOrderedDirect = selectionMode === "ordered-direct";
  const isGroupedPositions = selectionMode === "grouped-positions";
  const isOrderedCombination = selectionMode === "ordered-combination";
  const isGroupedRaces = selectionMode === "grouped-races";

  // 🔥 Cargar carreras siguientes
  useEffect(() => {
    if (!isGroupedRaces || !race) return;

    const loadNextRaces = async () => {
      setLoadingNextRaces(true);
      try {
        const numRaces = betTypeConfig?.races || 2;
        const currentRaceNum = parseInt(race.raceNumber || race.num_carrera);
        const venue = race.venue || race.descripcion_hipodromo;
        const fecha = race.date || race.fecha_texto;

        console.log(
          "📥 Cargando " + (numRaces - 1) + " carreras siguientes..."
        );
        console.log(
          "📍 Carrera actual: " +
            currentRaceNum +
            " (tipo: " +
            typeof currentRaceNum +
            ") en " +
            venue
        );
        console.log("📍 Fecha: " + fecha);

        const racesToLoad = [];

        for (let i = 1; i < numRaces; i++) {
          const nextRaceNum = currentRaceNum + i;
          const nextRaceNumStr = String(nextRaceNum);

          console.log("🔍 Buscando carrera siguiente...");
          console.log("   Carrera actual: " + currentRaceNum);
          console.log("   i: " + i);
          console.log(
            "   nextRaceNum calculado: " +
              nextRaceNum +
              ' → String: "' +
              nextRaceNumStr +
              '"'
          );
          console.log('   Venue: "' + venue + '"');
          console.log('   Fecha: "' + fecha + '"');

          const q = query(
            collection(db, "carreras1"),
            where("num_carrera", "==", nextRaceNumStr),
            where("descripcion_hipodromo", "==", venue),
            where("fecha_texto", "==", fecha),
            limit(1)
          );

          const snapshot = await getDocs(q);

          console.log("   Resultados encontrados: " + snapshot.size);

          if (snapshot.empty) {
            console.log("   ❌ NO ENCONTRADA con los filtros exactos");
            console.log(
              '   🔍 Buscando TODAS las carreras de "' +
                venue +
                '" el "' +
                fecha +
                '"...'
            );

            const debugQuery = query(
              collection(db, "carreras1"),
              where("descripcion_hipodromo", "==", venue),
              where("fecha_texto", "==", fecha)
            );
            const debugSnapshot = await getDocs(debugQuery);
            console.log(
              "   📋 Total carreras encontradas: " + debugSnapshot.size
            );

            debugSnapshot.forEach((doc) => {
              const data = doc.data();
              console.log(
                '      → Carrera num_carrera="' +
                  data.num_carrera +
                  '" (tipo: ' +
                  typeof data.num_carrera +
                  ")"
              );
            });
          }

          if (!snapshot.empty) {
            const raceData = snapshot.docs[0].data();
            console.log("   ✅ Encontrada carrera " + nextRaceNumStr);
            console.log("   📦 Datos de la carrera:", raceData);

            const horsesArray = [];

            // 🔥 OPCIÓN 1: Intentar obtener de limitesApuestas (si existe info detallada)
            if (raceData.limitesApuestas) {
              console.log("   🐴 Extrayendo desde 'limitesApuestas'");
              Object.entries(raceData.limitesApuestas).forEach(
                ([betType, betData]) => {
                  if (betData.caballos) {
                    Object.entries(betData.caballos).forEach(
                      ([key, horseData]) => {
                        if (key.startsWith("caballo_")) {
                          const horseNum = parseInt(
                            key.replace("caballo_", "")
                          );
                          if (!horsesArray.some((h) => h.number === horseNum)) {
                            horsesArray.push({
                              number: horseNum,
                              name: horseData.nombre || `Caballo ${horseNum}`,
                              jockey: horseData.jockey || "",
                            });
                          }
                        }
                      }
                    );
                  }
                }
              );
            }

            // 🔥 OPCIÓN 2: Si no hay info detallada, usar caballitos (solo números)
            if (horsesArray.length === 0 && raceData.caballitos) {
              console.log("   🐴 Extrayendo desde 'caballitos' (solo números)");
              Object.entries(raceData.caballitos).forEach(([key, value]) => {
                if (key.startsWith("caballo_")) {
                  const horseNum = parseInt(key.replace("caballo_", ""));
                  horsesArray.push({
                    number: horseNum,
                    name: `Caballo ${horseNum}`,
                    jockey: "",
                  });
                }
              });
            }

            console.log(
              "   ✅ Total caballos extraídos: " + horsesArray.length
            );
            console.log("   📋 Caballos:", horsesArray);
            horsesArray.sort((a, b) => a.number - b.number);

            racesToLoad.push({
              ...raceData,
              id: snapshot.docs[0].id,
              horses: horsesArray,
              raceNumber: raceData.num_carrera,
            });
          } else {
            console.warn("   ⚠️ No se encontró la carrera " + nextRaceNumStr);
          }
        }

        if (racesToLoad.length === numRaces - 1) {
          setNextRaces(racesToLoad);
          console.log(
            "✅ Todas las carreras siguientes cargadas:",
            racesToLoad
          );
        } else {
          setNextRaces([]);
          console.warn(
            "❌ No se pudieron cargar todas las " +
              (numRaces - 1) +
              " carreras necesarias"
          );
        }
      } catch (error) {
        console.error("❌ Error cargando carreras siguientes:", error);
        alert(
          "Error al cargar las carreras siguientes. Por favor, intentá de nuevo."
        );
      } finally {
        setLoadingNextRaces(false);
      }
    };

    loadNextRaces();
  }, [isGroupedRaces, race, betTypeConfig]);

  const isHorseEnabled = (horse, raceToCheck = race) => {
    const key = `caballo_${horse.number}`;
    return raceToCheck?.caballitos?.[key] === true;
  };

  const factorial = (n) => {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  const calculateGroupedCombinations = (tempGroupedPositions) => {
    const positions = betTypeConfig?.positions || 2;
    let total = 1;

    for (let i = 1; i <= positions; i++) {
      const count = tempGroupedPositions[`position${i}`]?.length || 0;
      if (count === 0) return 0;
      total *= count;
    }

    return total;
  };

  const calculateGroupedRacesCombinations = (tempGroupedRaces) => {
    const numRaces = betTypeConfig?.races || 2;
    let total = 1;

    for (let i = 1; i <= numRaces; i++) {
      const allHorses = tempGroupedRaces[`race${i}`] || [];
      const horsesQueCorren = allHorses.filter(
        (h) => !h.noCorre && !h.scratched
      );
      const count = horsesQueCorren.length;

      if (count === 0) return 0;
      total *= count;
    }

    return total;
  };

  const validateCombinationLimit = (newCombinations) => {
    const betTypeKey = betTypeConfig?.originalKey?.replace(/\s/g, "") + "1";
    const limites = race?.limitesApuestas?.[betTypeKey];
    const topeCombinaciones = limites?.topedeconbinaciones;

    if (!topeCombinaciones) return true;

    return newCombinations <= topeCombinaciones;
  };
  const toggleHorse = (horse) => {
    // 🔥 Definir raceToCheck al inicio para todo el scope
    const raceToCheck =
      isGroupedRaces && currentRace > 1 ? nextRaces[currentRace - 2] : race;

    // 🔥 VALIDAR que el caballo esté habilitado ANTES de hacer cualquier cosa
    if (isGroupedRaces) {
      if (!isHorseEnabled(horse, raceToCheck)) {
        console.log(`⛔ Caballo ${horse.number} no corre en esta carrera`);
        alert(
          `⚠️ El caballo #${horse.number} no está corriendo en esta carrera.`
        );
        return;
      }
    } else {
      if (!isHorseEnabled(horse)) {
        console.log(`⛔ Caballo ${horse.number} no corre`);
        alert(`⚠️ El caballo #${horse.number} no está corriendo.`);
        return;
      }
    }

    // 🏇 APUESTAS MULTI-CARRERA (DOBLE, TRIPLO, PICK)
    if (isGroupedRaces) {
      const raceKey = `race${currentRace}`;
      const currentGroup = groupedRaces[raceKey] || [];
      const isInCurrentGroup = currentGroup.some(
        (h) => h.number === horse.number
      );

      if (isInCurrentGroup) {
        // Remover caballo
        const newGroup = currentGroup.filter((h) => h.number !== horse.number);
        setGroupedRaces({
          ...groupedRaces,
          [raceKey]: newGroup,
        });
        console.log(
          `❌ Caballo #${horse.number} removido de carrera ${currentRace}`
        );
      } else {
        // Agregar caballo
        if (currentGroup.length >= betTypeConfig.maxHorses) {
          alert(
            `⚠️ Solo puedes seleccionar hasta ${betTypeConfig.maxHorses} caballos por carrera`
          );
          return;
        }

        const tempGroupedRaces = {
          ...groupedRaces,
          [raceKey]: [
            ...currentGroup,
            {
              ...horse,
              // 🔥 FIX: NO marcar como "noCorre" si el caballo está habilitado
              noCorre: false,
              scratched: false,
            },
          ],
        };

        const newCombinations =
          calculateGroupedRacesCombinations(tempGroupedRaces);

        if (!validateCombinationLimit(newCombinations)) {
          const betTypeKey =
            betTypeConfig?.originalKey?.replace(/\s/g, "") + "1";
          const limites = race?.limitesApuestas?.[betTypeKey];
          const topeCombinaciones = limites?.topedeconbinaciones;

          alert(
            `🚫 No puedes agregar este caballo.\n\n` +
              `Se superaría el límite de ${topeCombinaciones} combinaciones permitidas.\n` +
              `Combinaciones actuales: ${calculateGroupedRacesCombinations(
                groupedRaces
              )}\n` +
              `Si agregas este caballo: ${newCombinations} combinaciones`
          );
          return;
        }

        setGroupedRaces(tempGroupedRaces);
        console.log(
          `✅ Caballo #${horse.number} agregado a carrera ${currentRace} (${newCombinations} combinaciones)`
        );
      }
      return;
    }

    // 🎯 APUESTAS AGRUPADAS POR POSICIÓN (EXACTA, IMPERFECTA, TRIFECTA D, CUATRIFECTA D)
    if (isGroupedPositions) {
      const positionKey = `position${currentPosition}`;
      const currentGroup = groupedPositions[positionKey] || [];
      const group1Count = groupedPositions.position1?.length || 0;

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
        // Remover caballo
        const newGroup = currentGroup.filter((h) => h.number !== horse.number);
        setGroupedPositions({
          ...groupedPositions,
          [positionKey]: newGroup,
        });
        console.log(
          `❌ Caballo #${horse.number} removido de posición ${currentPosition}`
        );
      } else {
        // Agregar caballo
        if (currentGroupCount >= maxAllowedInPosition) {
          alert(
            `⚠️ Solo puedes seleccionar ${maxAllowedInPosition} caballo(s) en ${currentPosition}° puesto cuando tienes ${group1Count} en 1° puesto`
          );
          return;
        }

        const tempGroupedPositions = {
          ...groupedPositions,
          [positionKey]: [...currentGroup, horse],
        };

        const newCombinations =
          calculateGroupedCombinations(tempGroupedPositions);

        if (!validateCombinationLimit(newCombinations)) {
          const betTypeKey =
            betTypeConfig?.originalKey?.replace(/\s/g, "") + "1";
          const limites = race?.limitesApuestas?.[betTypeKey];
          const topeCombinaciones = limites?.topedeconbinaciones;

          alert(
            `🚫 No puedes agregar este caballo.\n\n` +
              `Se superaría el límite de ${topeCombinaciones} combinaciones permitidas.\n` +
              `Combinaciones actuales: ${calculateGroupedCombinations(
                groupedPositions
              )}\n` +
              `Si agregas este caballo: ${newCombinations} combinaciones`
          );
          return;
        }

        setGroupedPositions(tempGroupedPositions);
        console.log(
          `✅ Caballo #${horse.number} agregado a posición ${currentPosition} (${newCombinations} combinaciones)`
        );
      }
      return;
    }

    // 🎯 APUESTAS DIRECTAS ORDENADAS (TRIFECTA D, CUATRIFECTA D - modo directo)
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

    // 🎯 APUESTAS SIMPLES Y TIRA
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

    // 🎯 APUESTAS CON COMBINACIONES ORDENADAS (TRIFECTA C, CUATRIFECTA C)
    if (isOrderedCombination) {
      const isSelected = selectedHorses.some((h) => h.number === horse.number);

      if (isSelected) {
        // Remover caballo
        const newSelection = selectedHorses.filter(
          (h) => h.number !== horse.number
        );
        onSelect(newSelection);
        console.log(`❌ Caballo #${horse.number} removido`);
      } else {
        // Agregar caballo
        if (selectedHorses.length >= betTypeConfig.maxHorses) {
          alert(
            `⚠️ Solo puedes seleccionar hasta ${betTypeConfig.maxHorses} caballos`
          );
          return;
        }

        const newSelection = [...selectedHorses, horse];

        let newCombinations = 1;
        const n = newSelection.length;

        if (isOrderedCombination) {
          const positions = betTypeConfig?.positions || 3;
          if (n >= positions) {
            newCombinations = factorial(n) / factorial(n - positions);
          }
        }

        if (!validateCombinationLimit(newCombinations)) {
          const betTypeKey =
            betTypeConfig?.originalKey?.replace(/\s/g, "") + "1";
          const limites = race?.limitesApuestas?.[betTypeKey];
          const topeCombinaciones = limites?.topedeconbinaciones;

          alert(
            `🚫 No puedes seleccionar este caballo.\n\n` +
              `Se superaría el límite de ${topeCombinaciones} combinaciones.\n` +
              `Si agregas este caballo tendrías: ${newCombinations} combinaciones`
          );
          return;
        }

        onSelect(newSelection);
        console.log(
          `✅ Caballo #${horse.number} agregado (${newCombinations} combinaciones)`
        );
      }
      return;
    }

    // 🎯 APUESTAS GENERALES (fallback)
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
  const calculateCombinations = () => {
    if (isGroupedRaces) {
      return calculateGroupedRacesCombinations(groupedRaces);
    }

    if (isGroupedPositions) {
      return calculateGroupedCombinations(groupedPositions);
    }

    const horseArrayLength = Array.isArray(selectedHorses)
      ? selectedHorses.length
      : 0;
    const n = horseArrayLength;

    if (n === 0) return 0;
    if (isSimple) return 1;
    if (betTypeConfig?.type === "tira") return 3;
    if (selectionMode === "ordered-direct") return 1;

    if (selectionMode === "ordered-combination") {
      const positions = betTypeConfig?.positions || 3;
      if (n < positions) return 0;
      return factorial(n) / factorial(n - positions);
    }

    return 1;
  };

  const combinaciones = calculateCombinations();

  const getCombinationLimitInfo = () => {
    const betTypeKey = betTypeConfig?.originalKey?.replace(/\s/g, "") + "1";
    const limites = race?.limitesApuestas?.[betTypeKey];
    const topeCombinaciones = limites?.topedeconbinaciones;

    if (!topeCombinaciones || combinaciones === 0) return null;

    const percentage = (combinaciones / topeCombinaciones) * 100;
    const isNearLimit = percentage > 80;
    const isOverLimit = combinaciones > topeCombinaciones;

    return {
      current: combinaciones,
      max: topeCombinaciones,
      percentage,
      isNearLimit,
      isOverLimit,
    };
  };

  const limitInfo = getCombinationLimitInfo();

  const getInstructions = () => {
    if (isSimple) return "Selecciona 1 caballo";
    if (betTypeConfig?.type === "tira")
      return "Selecciona 1 caballo (se jugará automáticamente a ganador, segundo Y tercero = 3 apuestas)";

    if (isGroupedRaces) {
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

      const currentRaceNum = parseInt(race.raceNumber || race.num_carrera);
      const raceNumbers = Array.from(
        { length: betTypeConfig?.races },
        (_, i) => currentRaceNum + i
      );

      return `Selecciona de 1 a ${
        betTypeConfig?.maxHorses || 10
      } caballos ganadores para ${racesText} consecutivas (Carreras ${raceNumbers.join(
        ", "
      )}). Se generan combinaciones: ${raceNumbers
        .map((r, i) => `C${i + 1}`)
        .join(" × ")}`;
    }

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

    return `Selecciona de ${betTypeConfig?.minHorses || 1} a ${
      betTypeConfig?.maxHorses || 10
    } caballos`;
  };

  const handleNext = () => {
    if (isGroupedRaces) {
      const numRaces = betTypeConfig?.races || 2;
      const groups = {};

      for (let i = 1; i <= numRaces; i++) {
        const group = groupedRaces[`race${i}`] || [];
        if (group.length === 0) {
          const raceNum =
            i === 1
              ? parseInt(race.raceNumber || race.num_carrera)
              : parseInt(race.raceNumber || race.num_carrera) + (i - 1);

          alert(
            `⚠️ Debes seleccionar al menos 1 caballo en la Carrera ${raceNum}`
          );
          return;
        }
        groups[`race${i}`] = group;

        // 🔥 Agregar información de cada carrera
        if (i === 1) {
          groups[`race${i}Info`] = {
            number: race.raceNumber || race.num_carrera,
            venue: race.venue || race.descripcion_hipodromo,
            date: race.date || race.fecha_texto,
            time: race.time || race.hora,
          };
        } else {
          const nextRaceData = nextRaces[i - 2];
          if (nextRaceData) {
            groups[`race${i}Info`] = {
              number: nextRaceData.num_carrera,
              venue: nextRaceData.descripcion_hipodromo,
              date: nextRaceData.fecha_texto,
              time: nextRaceData.hora,
            };
          }
        }
      }

      const totalCombinations = calculateGroupedRacesCombinations(groupedRaces);
      if (!validateCombinationLimit(totalCombinations)) {
        const betTypeKey = betTypeConfig?.originalKey?.replace(/\s/g, "") + "1";
        const limites = race?.limitesApuestas?.[betTypeKey];
        const topeCombinaciones = limites?.topedeconbinaciones;

        alert(
          `🚫 No puedes continuar.\n\nSuperaste el límite de ${topeCombinaciones} combinaciones.\nActualmente tienes: ${totalCombinations} combinaciones`
        );
        return;
      }

      console.log("➡️ Continuando con grupos de carreras:", groups);
      onNext({ grouped: true, multiRace: true, ...groups });
      return;
    }

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

      const totalCombinations = calculateGroupedCombinations(groupedPositions);
      if (!validateCombinationLimit(totalCombinations)) {
        const betTypeKey = betTypeConfig?.originalKey?.replace(/\s/g, "") + "1";
        const limites = race?.limitesApuestas?.[betTypeKey];
        const topeCombinaciones = limites?.topedeconbinaciones;

        alert(
          `🚫 No puedes continuar.\n\nSuperaste el límite de ${topeCombinaciones} combinaciones.\nActualmente tienes: ${totalCombinations} combinaciones`
        );
        return;
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

  const canProceed = () => {
    if (isGroupedRaces) {
      const numRaces = betTypeConfig?.races || 2;
      for (let i = 1; i <= numRaces; i++) {
        const count = groupedRaces[`race${i}`]?.length || 0;
        if (count < 1) return false;
      }
      const totalCombinations = calculateGroupedRacesCombinations(groupedRaces);
      if (!validateCombinationLimit(totalCombinations)) return false;
      return true;
    }

    if (isGroupedPositions) {
      const positions = betTypeConfig?.positions || 2;
      for (let i = 1; i <= positions; i++) {
        const count = groupedPositions[`position${i}`]?.length || 0;
        if (count < 1) return false;
      }
      const totalCombinations = calculateGroupedCombinations(groupedPositions);
      if (!validateCombinationLimit(totalCombinations)) return false;
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

  const changeRace = (raceNum) => {
    setCurrentRace(raceNum);
  };

  if (
    isGroupedRaces &&
    !loadingNextRaces &&
    nextRaces.length < (betTypeConfig?.races || 2) - 1
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
        <p className="text-slate-300 text-center font-semibold mb-2">
          No se pueden realizar apuestas de tipo {betTypeConfig?.label}
        </p>
        <p className="text-slate-400 text-center text-sm max-w-md">
          Para apostar {betTypeConfig?.label}, se necesitan{" "}
          {betTypeConfig?.races} carreras consecutivas, pero solo hay{" "}
          {nextRaces.length + 1} carrera(s) disponible(s) en este hipódromo para
          esta fecha.
        </p>
        <button
          onClick={onBack}
          className="mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white font-semibold rounded-xl transition-all">
          <ChevronLeft className="w-5 h-5" />
          Volver a tipos de apuesta
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
              : isGroupedRaces
              ? (() => {
                  const numRaces = betTypeConfig?.races || 2;
                  const counts = [];
                  for (let i = 1; i <= numRaces; i++) {
                    counts.push(groupedRaces[`race${i}`]?.length || 0);
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

        {isGroupedRaces && (
          <div className="mt-3 pt-3 border-t border-fuchsia-500/20">
            <p className="text-slate-400 text-xs mb-2">
              Seleccionando caballos para:
            </p>

            {loadingNextRaces ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin"></div>
                <span>Cargando carreras siguientes...</span>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => changeRace(1)}
                  className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                    currentRace === 1
                      ? "bg-fuchsia-500 text-white shadow-lg"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                  }`}>
                  Carrera {race.raceNumber || race.num_carrera}
                  {groupedRaces.race1?.length > 0 && (
                    <span className="ml-2 text-xs">
                      ({groupedRaces.race1.length})
                    </span>
                  )}
                </button>

                {nextRaces.map((nextRace, index) => {
                  const raceNum = index + 2;
                  const count = groupedRaces[`race${raceNum}`]?.length || 0;

                  return (
                    <button
                      key={raceNum}
                      onClick={() => changeRace(raceNum)}
                      className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                        currentRace === raceNum
                          ? "bg-fuchsia-500 text-white shadow-lg"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                      }`}>
                      Carrera {nextRace.raceNumber || nextRace.num_carrera}
                      {count > 0 && (
                        <span className="ml-2 text-xs">({count})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {currentRace === 1 ? (
              <div className="mt-2 text-xs text-slate-400">
                📍 {race.venue || race.descripcion_hipodromo} -{" "}
                {race.date || race.fecha_texto} {race.time || race.hora}
              </div>
            ) : nextRaces[currentRace - 2] ? (
              <div className="mt-2 text-xs text-slate-400">
                📍 {nextRaces[currentRace - 2]?.descripcion_hipodromo} - Carrera{" "}
                {nextRaces[currentRace - 2]?.num_carrera}
                <div className="mt-1">
                  {nextRaces[currentRace - 2]?.fecha_texto}{" "}
                  {nextRaces[currentRace - 2]?.hora}
                </div>
              </div>
            ) : null}
          </div>
        )}

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

        {((isGroupedPositions && combinaciones > 0) ||
          (isGroupedRaces && combinaciones > 0) ||
          (!isGroupedPositions &&
            !isGroupedRaces &&
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
                <span
                  className={`font-bold text-lg ${
                    limitInfo?.isOverLimit
                      ? "text-red-400"
                      : limitInfo?.isNearLimit
                      ? "text-amber-300"
                      : "text-amber-300"
                  }`}>
                  {combinaciones}
                </span>
              </div>

              {limitInfo && (
                <div
                  className={`pt-2 border-t border-slate-700/50 text-xs ${
                    limitInfo.isOverLimit
                      ? "text-red-400"
                      : limitInfo.isNearLimit
                      ? "text-amber-400"
                      : "text-slate-400"
                  }`}>
                  <p className="flex items-center gap-2">
                    {limitInfo.isOverLimit
                      ? "🚫"
                      : limitInfo.isNearLimit
                      ? "⚠️"
                      : "💡"}
                    <span>
                      Límite: {limitInfo.current} / {limitInfo.max}
                      {limitInfo.isOverLimit && " - ¡Superado!"}
                      {limitInfo.isNearLimit &&
                        !limitInfo.isOverLimit &&
                        " - Cerca del límite"}
                    </span>
                  </p>
                </div>
              )}

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

              {isGroupedRaces && combinaciones > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  💡{" "}
                  {(() => {
                    const numRaces = betTypeConfig?.races || 2;
                    const parts = [];
                    const currentRaceNum = parseInt(
                      race.raceNumber || race.num_carrera
                    );

                    for (let i = 1; i <= numRaces; i++) {
                      const raceNum = currentRaceNum + (i - 1);
                      parts.push(
                        `${groupedRaces[`race${i}`]?.length || 0} (C${raceNum})`
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
            </div>
          </div>
        )}

        {!isGroupedPositions &&
          !isGroupedRaces &&
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
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {(() => {
          // 🔥 SIEMPRE mostrar TODOS los caballos, no solo los que corren
          let horsesToShow = [];

          if (isGroupedRaces && currentRace > 1) {
            // Para carreras siguientes, primero intentamos obtener de nextRaces
            const nextRaceData = nextRaces[currentRace - 2];

            if (nextRaceData?.horses && nextRaceData.horses.length > 0) {
              horsesToShow = nextRaceData.horses;
            } else {
              // Si no hay info detallada, crear lista básica de caballos
              horsesToShow = horses.map((h) => ({
                number: h.number,
                name: h.name || `Caballo ${h.number}`,
                jockey: h.jockey || "",
              }));
            }
          } else {
            // Carrera actual
            horsesToShow = horses;
          }

          if (horsesToShow.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-400 text-center text-sm">
                  No hay caballos disponibles para esta carrera
                </p>
              </div>
            );
          }

          return horsesToShow.map((horse) => {
            const raceToCheck =
              isGroupedRaces && currentRace > 1
                ? nextRaces[currentRace - 2]
                : race;

            const isEnabled = isHorseEnabled(horse, raceToCheck);

            let isSelected = false;
            let selectedInPosition = null;
            let selectedInRace = null;

            if (isGroupedRaces) {
              const raceKey = `race${currentRace}`;
              isSelected =
                groupedRaces[raceKey]?.some((h) => h.number === horse.number) ||
                false;
              if (isSelected) selectedInRace = currentRace;
            } else if (isGroupedPositions) {
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

            const horsesArray = Array.isArray(selectedHorses)
              ? selectedHorses
              : [];
            const selectionIndex = horsesArray.findIndex(
              (h) => h.number === horse.number
            );

            const horsesArrayForLimit = Array.isArray(selectedHorses)
              ? selectedHorses
              : [];
            const reachedLimit =
              !isOrderedDirect &&
              !isGroupedPositions &&
              !isGroupedRaces &&
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
                      {isGroupedRaces && selectedInRace && (
                        <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm font-bold">
                          Carrera{" "}
                          {selectedInRace === 1
                            ? race.raceNumber || race.num_carrera
                            : parseInt(race.raceNumber || race.num_carrera) +
                              (selectedInRace - 1)}
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

                  {isGroupedRaces && !isSelected && isEnabled && (
                    <div className="px-3 py-1 bg-slate-700/50 text-slate-400 rounded-lg text-xs">
                      Para C
                      {currentRace === 1
                        ? race.raceNumber || race.num_carrera
                        : parseInt(race.raceNumber || race.num_carrera) +
                          (currentRace - 1)}
                    </div>
                  )}
                </div>
              </button>
            );
          });
        })()}
      </div>

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

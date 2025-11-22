import { useState, useEffect } from "react";
import { X, ChevronLeft, Trophy } from "lucide-react";
import BetTypeSelector from "./BetTypeSelector";
import HorseSelector from "./HorseSelector";
import BetAmount from "./BetAmount";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import betService from "../services/betService";
// 🔧 Función auxiliar para calcular factorial
const factorial = (n) => {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};

const BetModal = ({ race, onClose, onConfirmBet, user, userSaldo }) => {
  const [step, setStep] = useState(1);
  const [betType, setBetType] = useState(null);
  const [selectedHorses, setSelectedHorses] = useState([]);
  const [amount, setAmount] = useState(0);
  const [betTypes, setBetTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentRaceData, setCurrentRaceData] = useState(race);

  // 🔥 Orden de tipos de apuesta
  const BET_TYPE_ORDER = [
    "GANADOR",
    "SEGUNDO",
    "TERCERO",
    "TIRA(1,2,3)",
    "EXACTA",
    "IMPERFECTA",
    "TRIFECTA D",
    "TRIFECTA C",
    "CUATRIFECTA D",
    "CUATRIFECTA C",
    "DOBLE",
    "TRIPLO",
    "PICK 4",
    "PICK 5",
  ];

  // 🔥 Listener en tiempo real para la carrera seleccionada
  useEffect(() => {
    if (!race || !race.firebaseId) {
      console.warn("⚠️ No hay firebaseId en la carrera");
      setCurrentRaceData(race);
      return;
    }

    console.log("🔥 Iniciando listener para carrera:", race.firebaseId);

    const carreraRef = doc(db, "carreras1", race.firebaseId);

    const unsubscribe = onSnapshot(
      carreraRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const updatedRace = {
            ...docSnapshot.data(),
            firebaseId: docSnapshot.id,
            horses: race.horses,
          };
          console.log("🔄 Carrera actualizada:", updatedRace);
          setCurrentRaceData(updatedRace);
        } else {
          console.warn("⚠️ La carrera ya no existe");
        }
      },
      (error) => {
        console.error("❌ Error en listener de carrera:", error);
      }
    );

    return () => {
      console.log("🛑 Deteniendo listener de carrera");
      unsubscribe();
    };
  }, [race?.firebaseId]);

  // 🔥 Configuración CORRECTA de tipos de apuesta
 useEffect(() => {
  if (!currentRaceData || !currentRaceData.tiposApuestas) {
    console.warn("⚠️ No hay tiposApuestas en la carrera");
    setLoading(false);
    return;
  }

    console.log("📊 Cargando tipos de apuesta desde Firestore");

    // ✅ Configuración correcta de cada tipo de apuesta
  const betTypeConfig = {
    GANADOR: {
      maxHorses: 1,
      minHorses: 1,
      type: "simple",
      selectionMode: "single",
      description: "Selecciona 1 caballo ganador",
      howItWorks: "El caballo debe llegar en 1° lugar",
    },
    SEGUNDO: {
      maxHorses: 1,
      minHorses: 1,
      type: "simple",
      selectionMode: "single",
      description: "Selecciona 1 caballo a segundo",
      howItWorks: "El caballo debe llegar en 2° lugar",
    },
    TERCERO: {
      maxHorses: 1,
      minHorses: 1,
      type: "simple",
      selectionMode: "single",
      description: "Selecciona 1 caballo a tercero",
      howItWorks: "El caballo debe llegar en 3° lugar",
    },

    "TIRA(1,2,3)": {
      maxHorses: 10,
      minHorses: 3,
      type: "combinada-ordenada",
      positions: 3,
      selectionMode: "ordered-combination",
      description: "1 caballo para ganador, segundo Y tercero",
      howItWorks:
        "El caballo debe llegar en los 3 primeros puestos. Son 3 apuestas en 1.",
    },

    EXACTA: {
      maxHorses: 10,
      minHorses: 2,
      type: "combinada-por-posicion",
      positions: 2,
      selectionMode: "grouped-positions",
      description: "Varios caballos para 1° y varios para 2° (EN ORDEN)",
      howItWorks:
        "Selecciona caballos para 1° puesto y caballos para 2° puesto. Se generan todas las combinaciones (1° × 2°)",
    },
    IMPERFECTA: {
      maxHorses: 10,
      minHorses: 2,
      type: "combinada-por-posicion",
      positions: 2,
      selectionMode: "grouped-positions",
      description: "Varios caballos para 1° y varios para 2° (EN ORDEN)",
      howItWorks:
        "Igual que EXACTA. Selecciona grupos de caballos para 1° y 2° puesto",
    },
    "TRIFECTA D": {
      maxHorses: 3,
      minHorses: 3,
      type: "combinada-por-posicion",
      positions: 3,
      selectionMode: "grouped-positions",
      description: "1 caballo para 1°, 1 para 2°, 1 para 3° (EN ORDEN)",
      howItWorks:
        "Selecciona exactamente 3 caballos en orden. El 1° que elijas debe llegar 1°, el 2° debe llegar 2°, etc.",
    },
    "TRIFECTA C": {
      maxHorses: 10,
      minHorses: 3,
      type: "combinada-ordenada",
      positions: 3,
      selectionMode: "ordered-combination",
      description: "Varios caballos para los 3 primeros puestos (Combinada)",
      howItWorks:
        "Selecciona 3 o más caballos. Se generan todas las combinaciones posibles de 3 caballos en orden",
    },
    "CUATRIFECTA D": {
      maxHorses: 4,
      minHorses: 4,
      type: "combinada-por-posicion",
      positions: 4,
      selectionMode: "grouped-positions",
      description:
        "1 caballo para 1°, 1 para 2°, 1 para 3°, 1 para 4° (EN ORDEN)",
      howItWorks: "Selecciona exactamente 4 caballos en orden de llegada",
    },
    "CUATRIFECTA C": {
      maxHorses: 10,
      minHorses: 4,
      type: "combinada-ordenada",
      positions: 4,
      selectionMode: "ordered-combination",
      description: "Varios caballos para los 4 primeros puestos (Combinada)",
      howItWorks:
        "Selecciona 4 o más caballos. Se generan todas las permutaciones de 4 caballos",
    },

    // 🔥 MULTI-CARRERA: DOBLE, TRIPLO, PICK 4, PICK 5
    DOBLE: {
      maxHorses: 10,
      minHorses: 1,
      type: "multi-race",
      races: 2,
      selectionMode: "grouped-races",
      description: "Ganadores de 2 carreras consecutivas",
      howItWorks:
        "Selecciona caballos ganadores en esta carrera y la siguiente. Se generan todas las combinaciones (Carrera 1 × Carrera 2)",
    },
    TRIPLO: {
      maxHorses: 10,
      minHorses: 1,
      type: "multi-race",
      races: 3,
      selectionMode: "grouped-races",
      description: "Ganadores de 3 carreras consecutivas",
      howItWorks:
        "Selecciona caballos ganadores en 3 carreras consecutivas. Se generan todas las combinaciones (C1 × C2 × C3)",
    },
    "PICK 4": {
      maxHorses: 10,
      minHorses: 1,
      type: "multi-race",
      races: 4,
      selectionMode: "grouped-races",
      description: "Ganadores de 4 carreras consecutivas",
      howItWorks:
        "Selecciona caballos ganadores en 4 carreras consecutivas. Se generan todas las combinaciones (C1 × C2 × C3 × C4)",
    },
    "PICK 5": {
      maxHorses: 10,
      minHorses: 1,
      type: "multi-race",
      races: 5,
      selectionMode: "grouped-races",
      description: "Ganadores de 5 carreras consecutivas",
      howItWorks:
        "Selecciona caballos ganadores en 5 carreras consecutivas. Se generan todas las combinaciones (C1 × C2 × C3 × C4 × C5)",
    },
  };


    // Filtrar solo los tipos habilitados en Firestore
    const enabledTypesTemp = {};

    Object.entries(currentRaceData.tiposApuestas).forEach(
      ([key, isEnabled]) => {
        if (isEnabled !== true) {
          console.log(`❌ ${key} está en FALSE - NO se mostrará`);
          return;
        }

        if (betTypeConfig[key]) {
          const normalizedKey = key.replace(/[(),\s]/g, "_").toUpperCase();
          const keyWithOne = key.replace(/\s/g, "") + "1";

          const limites = currentRaceData.limitesApuestas?.[keyWithOne] || {
            apuestaMinima: 200,
            apuestaMaxima: 50000,
          };

          enabledTypesTemp[normalizedKey] = {
            label: key,
            originalKey: key,
            ...betTypeConfig[key],
            apuestaMinima: limites.apuestaMinima || 200,
            apuestaMaxima: limites.apuestaMaxima || 50000,
          };
          console.log(`✅ ${key} habilitado con límites:`, limites);
        }
      }
    );

    // Ordenar según BET_TYPE_ORDER
    const orderedBetTypes = {};
    BET_TYPE_ORDER.forEach((originalKey) => {
      const normalizedKey = originalKey.replace(/[(),\s]/g, "_").toUpperCase();
      if (enabledTypesTemp[normalizedKey]) {
        orderedBetTypes[normalizedKey] = enabledTypesTemp[normalizedKey];
      }
    });

    console.log("🎯 Tipos habilitados y ordenados:", orderedBetTypes);
    setBetTypes(orderedBetTypes);
    setLoading(false);
  }, [currentRaceData]);

  const handleBetTypeSelect = (type) => {
    console.log("🎯 Tipo seleccionado:", type);
    setBetType(type);
    setSelectedHorses([]);
    setAmount(0);
    setStep(2);
  };

  const handleHorsesSelected = (horses) => {
    // Si la selección viene como un objeto (apuestas agrupadas), lo guardamos tal cual.
    // De lo contrario, asumimos que es un array de caballos (apuestas normales).
    const newSelection = Array.isArray(horses) ? horses : horses; // Mantiene el array o el objeto

    setSelectedHorses(newSelection);
    setStep(3);
  };
 // 🔥 FUNCIÓN MEJORADA en BetModal.jsx - Reemplaza tu handleConfirmBet actual


const handleConfirmBet = async () => {
  console.log("✅ Confirmando apuesta con datos completos...");

  try {
    // 🎯 Preparar información de caballos según el tipo de apuesta
    let caballosData = [];
    let caballosInfo = {};

    const config = betTypes[betType];

    // 🔥 APUESTAS MULTI-CARRERA (DOBLE, TRIPLO, PICK)
    if (config.selectionMode === "grouped-races" || selectedHorses?.multiRace) {
      const numRaces = config?.races || 2;
      
      for (let i = 1; i <= numRaces; i++) {
        const raceKey = `race${i}`;
        const raceHorses = selectedHorses[raceKey] || [];
        const raceInfo = selectedHorses[`${raceKey}Info`];

        caballosInfo[raceKey] = {
          caballos: raceHorses.map(h => ({
            numero: h.number,
            nombre: h.name,
            jockey: h.jockey || "",
            noCorre: h.noCorre || false,
            scratched: h.scratched || false
          })),
          carrera: raceInfo ? {
            numero: raceInfo.number,
            hipodromo: raceInfo.venue,
            fecha: raceInfo.date,
            hora: raceInfo.time
          } : null
        };

        caballosData.push(...raceHorses);
      }
    }
    // 🔥 APUESTAS AGRUPADAS POR POSICIÓN (EXACTA, IMPERFECTA, TRIFECTA D, CUATRIFECTA D)
    else if (config.selectionMode === "grouped-positions" && selectedHorses?.grouped) {
      const positions = config?.positions || 2;
      
      for (let i = 1; i <= positions; i++) {
        const positionKey = `position${i}`;
        const positionHorses = selectedHorses[positionKey] || [];

        caballosInfo[positionKey] = positionHorses.map(h => ({
          numero: h.number,
          nombre: h.name,
          jockey: h.jockey || ""
        }));

        caballosData.push(...positionHorses);
      }
    }
    // 🔥 APUESTAS NORMALES (ARRAY)
    else {
      caballosData = Array.isArray(selectedHorses) ? selectedHorses : [];
    }

    // 🎯 Calcular combinaciones finales
    const calculateFinalCombinations = () => {
      if (config.selectionMode === "grouped-races" || selectedHorses?.multiRace) {
        const numRaces = config?.races || 2;
        let total = 1;
        for (let i = 1; i <= numRaces; i++) {
          const raceHorses = selectedHorses[`race${i}`] || [];
          const validHorses = raceHorses.filter(h => !h.noCorre && !h.scratched);
          total *= validHorses.length;
        }
        return total;
      }

      if (config.selectionMode === "grouped-positions" && selectedHorses?.grouped) {
        const positions = config?.positions || 2;
        let total = 1;
        for (let i = 1; i <= positions; i++) {
          const count = selectedHorses[`position${i}`]?.length || 0;
          total *= count;
        }
        return total;
      }

      const n = caballosData.length;
      if (config.type === "tira") return 3;
      if (config.selectionMode === "single") return 1;
      if (config.selectionMode === "ordered-direct") return 1;
      
      if (config.selectionMode === "ordered-combination") {
        const positions = config?.positions || 3;
        if (n < positions) return 0;
        return factorial(n) / factorial(n - positions);
      }

      return 1;
    };

    const combinacionesFinales = calculateFinalCombinations();
    const montoTotal = amount * combinacionesFinales;

    // 🎯 Calcular vales (si aplica)
    const dividendo = currentRaceData?.dividendo || 0;
    let valesApostados = 0;
    
    const excludedTypes = ["ganador", "segundo", "tercero"];
    const normalizedType = config?.originalKey?.toLowerCase().trim();
    const usesVales = !excludedTypes.includes(normalizedType);

    if (usesVales && dividendo > 0) {
      valesApostados = Math.floor(montoTotal / dividendo);
    }

    // 🔥 OBJETO COMPLETO DE LA APUESTA
    const betData = {
      hipodromoId: currentRaceData.firebaseId || currentRaceData.id || "",
      hipodromoNombre: currentRaceData.venue || currentRaceData.descripcion_hipodromo || "",
      carreraId: currentRaceData.firebaseId || currentRaceData.id || "",
      numeroCarrera: parseInt(currentRaceData.raceNumber || currentRaceData.num_carrera || 0),
      fecha: currentRaceData.date || currentRaceData.fecha_texto || new Date().toISOString().split('T')[0],
      hora: currentRaceData.time || currentRaceData.hora || "",
      betType: config.originalKey || betType,
      betTypeLabel: config.label || betType,
      betTypeDescription: config.description || "",
      selectionMode: config.selectionMode,
      isGroupedPositions: config.selectionMode === "grouped-positions",
      isGroupedRaces: config.selectionMode === "grouped-races",
      isMultiRace: selectedHorses?.multiRace || false,
      selectedHorses: caballosData.map(h => ({
        numero: h.number,
        nombre: h.name,
        jockey: h.jockey || "",
        noCorre: h.noCorre || false,
        scratched: h.scratched || false
      })),
      caballosInfo: Object.keys(caballosInfo).length > 0 ? caballosInfo : null,
      amount: amount,
      combinaciones: combinacionesFinales,
      montoTotal: montoTotal,
      potentialWin: montoTotal * (config.multiplier || 2),
      dividendo: dividendo,
      valesApostados: valesApostados,
      usesVales: usesVales,
      apuestaMinima: config.apuestaMinima || 200,
      apuestaMaxima: config.apuestaMaxima || 50000,
      timestamp: Date.now(),
      fechaCreacion: new Date().toISOString(),
      userId: user?.uid || user?.id || "",
      userEmail: user?.email || "",
      estado: "PENDIENTE",
      raceMetadata: {
        totalHorses: currentRaceData.horses?.length || 0,
        distance: currentRaceData.distance || currentRaceData.distancia || "",
        type: currentRaceData.type || currentRaceData.tipo || "",
        prize: currentRaceData.prize || currentRaceData.premio || "",
      }
    };

    console.log("🔥 Datos COMPLETOS de la apuesta:", betData);

    // 🎯 Validar antes de enviar
    const validation = betService.validateBet(betData, userSaldo);
    if (!validation.isValid) {
      alert("❌ Error en la apuesta:\n" + validation.errors.join("\n"));
      return;
    }

    // 🔥 Crear la apuesta en Firebase
    const result = await betService.createBet(user.uid, betData, userSaldo);

    if (result.success) {
      console.log("✅ Apuesta creada exitosamente:", result.apuestaId);
      
      // 🎯 Llamar al callback PERO NO CERRAR
      if (onConfirmBet) {
        onConfirmBet(result);
      }
      
      // 🚫 NO LLAMAR onClose() - dejar que BetAmount muestre el ticket
      // onClose(); // <--- COMENTADO
      
    } else {
      console.error("❌ Error al crear apuesta:", result.error);
      alert("❌ Error al crear la apuesta: " + result.error);
    }

  } catch (error) {
    console.error("❌ Error en handleConfirmBet:", error);
    alert("❌ Error al confirmar la apuesta: " + error.message);
  }
};
// 🔧 Función auxiliar para calcular factorial (si no existe ya en tu componente)
const factorial = (n) => {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};


  const canProceed = () => {
    // Paso 2: Selección de Caballos
    if (step === 2) {
      const config = betTypes[betType];

      // 🎯 Lógica para apuestas con grupos por posición (EXACTA, IMPERFECTA)
      if (config.selectionMode === "grouped-positions") {
        // La selección es un objeto { position1: [...], position2: [...] }
        const group1Count = selectedHorses.position1?.length || 0;
        const group2Count = selectedHorses.position2?.length || 0;

        // Requerimos al menos 1 caballo en cada posición.
        return group1Count >= 1 && group2Count >= 1;
      }

      // Lógica para el resto de apuestas (GANADOR, SEGUNDO, TERCERO, etc.)
      // Aseguramos que selectedHorses sea un array para usar .length
      const horseArrayLength = Array.isArray(selectedHorses)
        ? selectedHorses.length
        : 0;

      return (
        horseArrayLength >= config.minHorses &&
        horseArrayLength <= config.maxHorses
      );
    }

    // Paso 3: Monto de la Apuesta
    else if (step === 3) {
      const config = betTypes[betType];
      const minAmount = config?.apuestaMinima || 200;
      const maxAmount = config?.apuestaMaxima || 50000;

      // La variable 'amount' debe ser definida y accesible aquí (asumo que está en el scope del componente)
      if (amount <= 0) return false;

      // ⚠️ Validación del rango de la apuesta
      if (amount < minAmount || amount > maxAmount) return false;

      // Función auxiliar para calcular el monto total y verificar si es válido
      const calculateTotalAmount = () => {
        const n = Array.isArray(selectedHorses) ? selectedHorses.length : 0;
        let combinaciones = 1;

        // 🔥 CORRECCIÓN: Cálculo de combinaciones para grupos por posición
        if (config.selectionMode === "grouped-positions") {
          const group1Count = selectedHorses.position1?.length || 0;
          const group2Count = selectedHorses.position2?.length || 0;
          combinaciones = group1Count * group2Count;
        } else if (config.type === "tira") {
          combinaciones = 3;
        } else if (config.selectionMode === "ordered-direct") {
          combinaciones = 1;
        } else if (
          config.selectionMode === "ordered-combination" &&
          config.positions === 3
        ) {
          if (n >= 3) {
            // Nota: La función 'factorial' debe estar definida en el scope
            combinaciones = factorial(n) / factorial(n - 3);
          }
        } else if (
          config.selectionMode === "ordered-combination" &&
          config.positions === 4
        ) {
          if (n >= 4) {
            combinaciones = factorial(n) / factorial(n - 4);
          }
        } else if (config.selectionMode === "multi-race") {
          combinaciones = Math.pow(n, config.races || 1);
        }

        return amount * combinaciones * (config.multiplier || 1);
      };

      // ✅ Si el cálculo del monto total es válido y mayor a cero, se puede proceder.
      const totalAmount = calculateTotalAmount();

      return totalAmount > 0;
    }

    // Para cualquier otro paso no cubierto, asumimos que se puede continuar
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-fuchsia-600/20 via-fuchsia-500/20 to-slate-800/40 border-b border-slate-800/50 p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                {step === 1 && "Selecciona tu Apuesta"}
                {step === 2 && `${betTypes[betType]?.label}`}
                {step === 3 && `Confirma tu ${betTypes[betType]?.label}`}
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-fuchsia-500/20 border border-fuchsia-500/30 rounded text-fuchsia-300 font-semibold">
                  Paso {step}/3
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
              <X className="w-6 h-6 text-slate-400 hover:text-white" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span>🇦🇷</span>
              <span className="font-semibold">
                {currentRaceData.venue || currentRaceData.descripcion_hipodromo}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                Carrera{" "}
                {currentRaceData.raceNumber || currentRaceData.num_carrera}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {currentRaceData.date || currentRaceData.fecha_texto} -{" "}
              {currentRaceData.time || currentRaceData.hora}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)] custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400">Cargando tipos de apuesta...</p>
            </div>
          ) : Object.keys(betTypes).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Trophy className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-400 text-center">
                No hay tipos de apuesta habilitados para esta carrera
              </p>
            </div>
          ) : (
            <>
              {step === 1 && (
                <BetTypeSelector
                  betTypes={betTypes}
                  onSelect={handleBetTypeSelect}
                />
              )}

              {step === 2 && (
                <HorseSelector
                  horses={currentRaceData.horses}
                  betType={betType}
                  betTypeConfig={betTypes[betType]}
                  selectedHorses={selectedHorses}
                  onSelect={setSelectedHorses}
                  onBack={() => setStep(1)}
                  onNext={handleHorsesSelected}
                  canProceed={canProceed()}
                  race={currentRaceData}
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
                  raceData={currentRaceData}
                  user={user}
                  userSaldo={userSaldo}
                  maxBetAmount={betTypes[betType]?.apuestaMaxima}
                  minBetAmount={betTypes[betType]?.apuestaMinima}
                  betTypeConfig={betTypes[betType]}
                  onClose={onClose} // 🔥 AGREGAR ESTA LÍNEA
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900/50 border-t border-slate-800/50 p-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white font-semibold rounded-xl transition-all">
            Cerrar
          </button>
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

export default BetModal;

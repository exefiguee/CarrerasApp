import { useState, useEffect } from "react";
import {
  Trophy,
  ChevronLeft,
  Check,
  DollarSign,
  Wallet,
  Ticket,
  Calculator,
  AlertCircle,
} from "lucide-react";
import betService from "../services/betService";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentSaldo, setCurrentSaldo] = useState(userSaldo);

  const minAmount = minBetAmount || 200;
  const maxAmount = maxBetAmount || 50000;

  // 🎯 Determinar el tipo de apuesta
  const isSimple = ["GANADOR", "SEGUNDO", "TERCERO"].includes(betType);
  const isTira = betType === "TIRA(1,2,3)";
  const isDirecta = betTypeConfig?.type === "directa";
  const isCombinada =
    betTypeConfig?.type === "combinada" ||
    betTypeConfig?.type === "combinada-multiple";
  const isMultipleRaces = betTypeConfig?.type === "multiple-races";

  // 🎯 Obtener el dividendo de la carrera (por defecto 100)
  const dividendo = raceData?.dividendo || 100;

  // 🎯 Calcular combinaciones
  const calcularCombinaciones = () => {
    if (isSimple || isTira || isDirecta) {
      return 1;
    }

    const numCaballos = selectedHorses.length;
    const positions = betTypeConfig.positions || 2;

    if (isCombinada) {
      if (betType === "IMPERFECTA" || betType === "IMPERFECTA C") {
        // Imperfecta: C(n, 2)
        if (numCaballos < positions) return 0;
        return (
          factorial(numCaballos) /
          (factorial(positions) * factorial(numCaballos - positions))
        );
      }

      // Exacta, Trifecta C, Cuatrifecta C: P(n, k)
      if (numCaballos < positions) return 0;
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

  const combinaciones = calcularCombinaciones();

  // 💰 Calcular costo total de la apuesta
  const calcularCostoTotal = (valorPorVale) => {
    if (!valorPorVale || valorPorVale <= 0) return 0;

    if (isSimple) {
      // Ganador, Segundo, Tercero: tope de dinero directo
      return valorPorVale;
    }

    if (isTira) {
      // Tira 1-2-3: el valor se multiplica por 3
      return valorPorVale * 3;
    }

    if (isDirecta) {
      // Trifecta D, Cuatrifecta D: valor × vales
      const vales = Math.floor(valorPorVale / dividendo);
      return vales > 0 ? vales * dividendo : 0;
    }

    // Apuestas combinadas: valor x combinaciones
    return valorPorVale * combinaciones;
  };

  const costoTotal = calcularCostoTotal(amount);

  // 💰 Calcular VALES (solo para apuestas que lo usan)
  const calcularVales = (monto) => {
    if (isDirecta && monto > 0) {
      return Math.floor(monto / dividendo);
    }
    return 0;
  };

  const valesApostados = calcularVales(amount);

  // 🔥 Listener en tiempo real para el saldo del usuario
  useEffect(() => {
    if (!user || !user.uid) return;

    console.log("🔥 Iniciando listener de saldo:", user.uid);

    const userRef = doc(db, "USUARIOS", user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const nuevoSaldo = userData.SALDO || 0;
          console.log("🔄 Saldo actualizado:", nuevoSaldo);
          setCurrentSaldo(nuevoSaldo);

          if (amount > nuevoSaldo) {
            setError(
              `Tu saldo actual es $${nuevoSaldo.toLocaleString()}. Ajusta el monto.`
            );
          }
        }
      },
      (error) => {
        console.error("❌ Error en listener de saldo:", error);
      }
    );

    return () => {
      console.log("🛑 Deteniendo listener de saldo");
      unsubscribe();
    };
  }, [user?.uid, amount]);

  const generateQuickAmounts = () => {
    const baseAmounts = [
      200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000,
    ];

    return baseAmounts
      .filter((amt) => {
        const totalCost = calcularCostoTotal(amt);
        return (
          totalCost >= minAmount &&
          totalCost <= maxAmount &&
          totalCost <= currentSaldo
        );
      })
      .slice(0, 6);
  };

  const quickAmounts = generateQuickAmounts();

  const handleAmountInput = (value) => {
    setError("");
    const numValue = parseInt(value) || 0;
    const totalCost = calcularCostoTotal(numValue);

    if (totalCost > currentSaldo) {
      setError(
        `El costo total ($${totalCost.toLocaleString()}) supera tu saldo ($${currentSaldo.toLocaleString()})`
      );
      return;
    }

    if (numValue > 0 && totalCost < minAmount) {
      setError(`El monto mínimo es $${minAmount.toLocaleString()}`);
    }

    onAmountChange(numValue);
  };

  const handleConfirmBet = async () => {
    if (!user) {
      setError("Debes iniciar sesión para apostar");
      return;
    }

    if (!selectedHorses || selectedHorses.length === 0) {
      setError("⚠️ Debes seleccionar al menos un caballo");
      return;
    }

    if (costoTotal < minAmount) {
      setError(`El costo mínimo es $${minAmount.toLocaleString()}`);
      return;
    }

    if (costoTotal > currentSaldo) {
      setError(
        `Tu saldo actual es $${currentSaldo.toLocaleString()}. No puedes apostar más.`
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("✅ Apuesta confirmada:", {
        betType,
        selectedHorses,
        valorPorVale: amount,
        combinaciones,
        costoTotal,
        valesApostados: isDirecta ? valesApostados : null,
      });

      // Aquí iría la llamada a betService.createBet()
      setSuccess(true);
      setTimeout(() => {
        onConfirm();
      }, 2000);
    } catch (err) {
      console.error("Error al confirmar apuesta:", err);
      setError("Error al procesar la apuesta. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen de apuesta */}
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/30">
            <Trophy className="w-5 h-5 text-fuchsia-400" />
          </div>
          <h3 className="font-bold text-white">Resumen de Apuesta</h3>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Tipo de apuesta:</span>
            <span className="text-fuchsia-300 font-semibold">{betType}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Caballos seleccionados:</span>
            <span className="text-white font-semibold">
              {selectedHorses.map((h) => `#${h.number}`).join(", ")}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Sistema:</span>
            <span className="text-amber-300 font-semibold">
              {isSimple && "Tope de dinero"}
              {isTira && "Tira 1-2-3 (x3)"}
              {isDirecta && `Apuesta directa (${valesApostados} vales)`}
              {isCombinada && `${combinaciones} combinaciones`}
              {isMultipleRaces && `${betTypeConfig.races} carreras`}
            </span>
          </div>

          {isDirecta && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Dividendo de la carrera:</span>
              <span className="text-amber-300 font-semibold">${dividendo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Saldo disponible */}
      <div className="bg-gradient-to-r from-fuchsia-500/20 to-slate-800/40 border border-fuchsia-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/30">
              <Wallet className="w-5 h-5 text-fuchsia-400" />
            </div>
            <span className="text-slate-300 font-semibold">
              Saldo disponible:
            </span>
          </div>
          <span className="text-2xl font-bold text-fuchsia-300">
            ${currentSaldo?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Input de monto */}
      <div className="space-y-3">
        <label className="block">
          <span className="text-slate-300 font-semibold mb-2 block">
            {isCombinada || isDirecta
              ? "Valor por Vale"
              : "Monto de la Apuesta"}
          </span>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fuchsia-400 font-bold text-lg">
              $
            </span>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => handleAmountInput(e.target.value)}
              min={minAmount}
              step="100"
              placeholder="0"
              disabled={loading}
              className="w-full pl-10 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-xl font-bold focus:outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Valor mínimo: ${minAmount.toLocaleString()} • Máximo: $
            {maxAmount.toLocaleString()}
          </p>
        </label>

        {/* Montos rápidos */}
        {quickAmounts.length > 0 && (
          <div>
            <span className="text-slate-400 text-sm mb-2 block">
              Valores rápidos:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => onAmountChange(amt)}
                  disabled={loading}
                  className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    amount === amt
                      ? "bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white border-2 border-fuchsia-400"
                      : "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:border-fuchsia-500/50"
                  }`}>
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cálculo de combinaciones */}
      {isCombinada && amount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-2 border-amber-500/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-amber-400" />
            <span className="text-slate-300 font-semibold">
              Cálculo de Combinaciones
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-amber-300/70">Valor por vale:</span>
              <span className="text-amber-300 font-bold">
                ${amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-amber-300/70">× Combinaciones:</span>
              <span className="text-amber-300 font-bold">{combinaciones}</span>
            </div>
            <div className="h-px bg-amber-500/30 my-2"></div>
            <div className="flex justify-between">
              <span className="text-amber-200 font-semibold">Costo Total:</span>
              <span className="text-2xl font-bold text-amber-300">
                ${costoTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tira 1-2-3 cálculo */}
      {isTira && amount > 0 && (
        <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-2 border-blue-500/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Ticket className="w-5 h-5 text-blue-400" />
            <span className="text-slate-300 font-semibold">Tira 1-2-3</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-300/70">Ganador:</span>
              <span className="text-blue-300 font-bold">
                ${amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-300/70">Segundo:</span>
              <span className="text-blue-300 font-bold">
                ${amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-300/70">Tercero:</span>
              <span className="text-blue-300 font-bold">
                ${amount.toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-blue-500/30 my-2"></div>
            <div className="flex justify-between">
              <span className="text-blue-200 font-semibold">Costo Total:</span>
              <span className="text-2xl font-bold text-blue-300">
                ${costoTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Apuestas Directas - Mostrar vales */}
      {isDirecta && amount > 0 && (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-2 border-green-500/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Ticket className="w-5 h-5 text-green-400" />
            <span className="text-slate-300 font-semibold">
              Sistema de Vales
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-300/70">Monto apostado:</span>
              <span className="text-green-300 font-bold">
                ${amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-300/70">÷ Dividendo:</span>
              <span className="text-green-300 font-bold">${dividendo}</span>
            </div>
            <div className="h-px bg-green-500/30 my-2"></div>
            <div className="flex justify-between">
              <span className="text-green-200 font-semibold">
                Vales Apostados:
              </span>
              <span className="text-2xl font-bold text-green-300">
                {valesApostados} vales
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-300/70">Costo real:</span>
              <span className="text-green-300 font-bold">
                ${costoTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Total a Apostar (para apuestas simples) */}
      {isSimple && amount > 0 && (
        <div className="bg-gradient-to-r from-fuchsia-500/20 to-fuchsia-600/20 border-2 border-fuchsia-500/40 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-semibold">
              Total a Apostar:
            </span>
            <span className="text-3xl font-bold text-fuchsia-300">
              ${costoTotal.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Mensaje de éxito */}
      {success && (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/40 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/20 border border-green-500/30">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-green-300 font-bold text-lg">
                ¡Apuesta registrada exitosamente! 🎉
              </p>
              <p className="text-green-400/80 text-sm">
                Se descontaron ${costoTotal.toLocaleString()} de tu saldo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mostrar errores */}
      {error && (
        <div className="bg-red-500/20 border-2 border-red-500/40 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300 font-medium text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          disabled={loading || success}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <ChevronLeft className="w-5 h-5" />
          Volver
        </button>
        <button
          onClick={handleConfirmBet}
          disabled={
            !canProceed || loading || success || costoTotal > currentSaldo
          }
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${
            canProceed && !loading && !success && costoTotal <= currentSaldo
              ? "bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-400 text-white shadow-lg shadow-fuchsia-500/30"
              : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
          }`}>
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Procesando...
            </>
          ) : success ? (
            <>
              <Check className="w-5 h-5" />
              ¡Confirmada!
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Confirmar Apuesta
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BetAmount;

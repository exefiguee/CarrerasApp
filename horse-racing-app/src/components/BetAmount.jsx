import { useState, useEffect } from "react";
import {
  Trophy,
  ChevronLeft,
  Check,
  DollarSign,
  Wallet,
  Ticket,
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
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentSaldo, setCurrentSaldo] = useState(userSaldo);

  const minAmount = minBetAmount || 200;
  const maxAmount = maxBetAmount || 50000;

  // 🎯 Tipos de apuesta que NO usan sistema de vales
  const tiposSinVales = ["GANADOR", "SEGUNDO", "TERCERO"];
  const usaVales = !tiposSinVales.includes(betType);

  // 🎯 Obtener el dividendo de la carrera (por defecto 100)
  const dividendo = raceData?.dividendo || 100;

  // 💰 Calcular VALES: Monto apostado ÷ Dividendo (solo si aplica)
  const calcularVales = (monto) => {
    if (!usaVales || !monto || monto <= 0) return 0;
    return Math.floor(monto / dividendo);
  };

  const valesApostados = calcularVales(amount);

  // 🔥 Listener en tiempo real para el saldo del usuario
  useEffect(() => {
    if (!user || !user.uid) {
      return;
    }

    console.log(
      "🔥 Iniciando listener en tiempo real para saldo del usuario:",
      user.uid
    );

    const userRef = doc(db, "USUARIOS", user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const nuevoSaldo = userData.SALDO || 0;

          console.log("🔄 Saldo actualizado en tiempo real:", nuevoSaldo);
          setCurrentSaldo(nuevoSaldo);

          // Si el nuevo saldo es menor al monto actual, validar
          if (amount > nuevoSaldo) {
            setError(
              `Tu saldo actual es $${nuevoSaldo.toLocaleString()}. Ajusta el monto de tu apuesta.`
            );
          }
        }
      },
      (error) => {
        console.error("❌ Error en listener de saldo:", error);
      }
    );

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      console.log("🛑 Deteniendo listener de saldo");
      unsubscribe();
    };
  }, [user?.uid, amount]);

  const generateQuickAmounts = () => {
    const amounts = [];
    const baseAmounts = [
      200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 150000, 200000,
    ];

    const validAmounts = baseAmounts.filter(
      (amt) => amt >= minAmount && amt <= maxAmount && amt <= currentSaldo
    );

    if (validAmounts.length < 3) {
      const step = Math.floor(
        (Math.min(maxAmount, currentSaldo) - minAmount) / 4
      );
      for (let i = 0; i <= 4; i++) {
        const amt = minAmount + step * i;
        if (
          amt <= maxAmount &&
          amt <= currentSaldo &&
          !validAmounts.includes(amt)
        ) {
          validAmounts.push(amt);
        }
      }
      validAmounts.sort((a, b) => a - b);
    }

    return validAmounts.slice(0, 6);
  };

  const quickAmounts = generateQuickAmounts();

  const potentialWin = betService.calculatePotentialWin(
    betType,
    selectedHorses,
    amount
  );

  const handleAmountInput = (value) => {
    setError("");
    const numValue = parseInt(value) || 0;

    if (numValue > currentSaldo) {
      setError(
        `Tu saldo actual es $${currentSaldo.toLocaleString()}. No puedes apostar más de lo que tienes.`
      );
      onAmountChange(Math.min(currentSaldo, maxAmount));
      return;
    }

    if (numValue > maxAmount) {
      setError(
        `El monto máximo para esta apuesta es $${maxAmount.toLocaleString()}`
      );
      onAmountChange(maxAmount);
      return;
    }

    if (numValue > 0 && numValue < minAmount) {
      setError(
        `El monto mínimo para esta apuesta es $${minAmount.toLocaleString()}`
      );
    }

    onAmountChange(
      Math.min(Math.max(numValue, 0), Math.min(maxAmount, currentSaldo))
    );
  };

  const cleanBetData = (data) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        if (
          key === "amount" ||
          key === "potentialWin" ||
          key.includes("numero") ||
          key.includes("Id")
        ) {
          cleaned[key] = 0;
        } else if (Array.isArray(value)) {
          cleaned[key] = [];
        } else {
          cleaned[key] = "";
        }
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
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

    if (amount < minAmount) {
      setError(
        `El monto mínimo para esta apuesta es $${minAmount.toLocaleString()}`
      );
      return;
    }

    if (amount > maxAmount) {
      setError(
        `El monto máximo para esta apuesta es $${maxAmount.toLocaleString()}`
      );
      return;
    }

    if (amount > currentSaldo) {
      setError(
        `Tu saldo actual es $${currentSaldo.toLocaleString()}. No puedes apostar más de lo que tienes.`
      );
      return;
    }

    const horsesArray = Array.isArray(selectedHorses)
      ? selectedHorses
      : [selectedHorses];

    const validation = betService.validateBet(
      { amount, selectedHorses: horsesArray },
      currentSaldo
    );

    if (!validation.isValid) {
      setError(validation.errors.join(", "));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const hipodromoNombre =
        raceData?.descripcion_hipodromo ||
        raceData?.venue ||
        "Hipódromo desconocido";

      const betDataRaw = {
        hipodromoId: raceData?.id_hipodromo || "",
        hipodromoNombre: hipodromoNombre,
        carreraId: raceData?.id || raceData?.firebaseId || "",
        numeroCarrera: raceData?.num_carrera || raceData?.raceNumber || 0,
        fecha:
          raceData?.fecha ||
          raceData?.date ||
          new Date().toISOString().split("T")[0],
        hora: raceData?.hora || raceData?.time || "00:00",
        betType: betType || "",
        selectedHorses: horsesArray,
        amount: amount || 0,
        potentialWin: potentialWin || 0,
        // 🎯 Agregar dividendo y vales SOLO si aplica
        ...(usaVales && {
          dividendo: dividendo,
          valesApostados: valesApostados,
        }),
      };

      console.log("📦 BetData:", betDataRaw);
      if (usaVales) {
        console.log("💰 Sistema de VALES activado - Vales:", valesApostados);
      } else {
        console.log("💵 Apuesta DIRECTA - Monto:", amount);
      }

      const betData = cleanBetData(betDataRaw);

      const hasUndefined = Object.values(betData).some((v) => v === undefined);
      if (hasUndefined) {
        console.error("⚠️ Aún hay valores undefined:", betData);
        setError("Error en los datos de la apuesta");
        setLoading(false);
        return;
      }

      const result = await betService.createBet(
        user.uid,
        betData,
        currentSaldo
      );

      if (result.success) {
        setSuccess(true);
        console.log(
          "✅ Apuesta creada - El saldo se actualizará automáticamente"
        );
        setTimeout(() => {
          onConfirm();
        }, 2000);
      } else {
        setError(result.error || "Error al registrar la apuesta");
      }
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
              {selectedHorses && selectedHorses.length > 0
                ? selectedHorses.map((h) => `#${h.number} ${h.name}`).join(", ")
                : "⚠️ No hay caballos seleccionados"}
            </span>
          </div>
          {/* 🎯 Mostrar dividendo SOLO si usa sistema de vales */}
          {usaVales && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Dividendo de la carrera:</span>
              <span className="text-amber-300 font-semibold">${dividendo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Saldo disponible CON indicador de tiempo real */}
      <div className="bg-gradient-to-r from-fuchsia-500/20 to-slate-800/40 border border-fuchsia-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/30">
              <Wallet className="w-5 h-5 text-fuchsia-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-300 font-semibold">
                Saldo disponible:
              </span>
            </div>
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
            Monto de la <span className="text-fuchsia-400">Apuesta</span>
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
              max={Math.min(maxAmount, currentSaldo)}
              step="100"
              placeholder="0"
              disabled={loading}
              className="w-full pl-10 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-xl font-bold focus:outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Monto mínimo: ${minAmount.toLocaleString()} • Monto máximo: $
            {Math.min(maxAmount, currentSaldo).toLocaleString()}
          </p>
        </label>

        {/* 💰 Mostrar VALES equivalentes SOLO si usa sistema de vales */}
        {usaVales && amount > 0 && (
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-2 border-amber-500/40 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400" />
                <span className="text-slate-300 font-semibold">
                  Tu apuesta equivale a:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-amber-300">
                  {valesApostados}
                </span>
                <span className="text-lg text-amber-400 font-semibold">
                  VALES
                </span>
              </div>
            </div>
            <p className="text-amber-300/70 text-xs mt-2 text-center">
              ${amount.toLocaleString()} ÷ ${dividendo} = {valesApostados} vales
            </p>
          </div>
        )}

        {/* Montos rápidos */}
        {quickAmounts.length > 0 && (
          <div>
            <span className="text-slate-400 text-sm mb-2 block">
              Montos rápidos:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.slice(0, 6).map((amt) => (
                <button
                  key={amt}
                  onClick={() => onAmountChange(amt)}
                  disabled={loading}
                  className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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

      {/* Total a Apostar */}
      {amount > 0 && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-fuchsia-500/20 to-fuchsia-600/20 border-2 border-fuchsia-500/40 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-semibold">
                Total a Apostar:
              </span>
              <span className="text-3xl font-bold text-fuchsia-300">
                ${amount.toLocaleString()}
              </span>
            </div>
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
              {usaVales ? (
                <p className="text-green-400/80 text-sm">
                  Se descontaron {valesApostados} vales - Tu saldo se
                  actualizará automáticamente
                </p>
              ) : (
                <p className="text-green-400/80 text-sm">
                  Se descontaron ${amount.toLocaleString()} - Tu saldo se
                  actualizará automáticamente
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mostrar errores */}
      {error && (
        <div className="bg-red-500/20 border-2 border-red-500/40 rounded-xl p-4">
          <p className="text-red-300 font-medium text-sm">⚠️ {error}</p>
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
          disabled={!canProceed || loading || success || amount > currentSaldo}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${
            canProceed && !loading && !success && amount <= currentSaldo
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

      {/* Botón cancelar */}
      <button
        onClick={() => onAmountChange(0)}
        disabled={loading || success}
        className="w-full px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        Cancelar Apuesta
      </button>
    </div>
  );
};

export default BetAmount;

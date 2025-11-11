import { useState } from "react";
import { Trophy, ChevronLeft, Check, DollarSign, Wallet } from "lucide-react";
import betService from "../services/betService";

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
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const minAmount = 200;
  const maxAmount = 50000;
  const quickAmounts = [200, 500, 1000, 2000, 5000, 10000];

  const potentialWin = betService.calculatePotentialWin(
    betType,
    selectedHorses,
    amount
  );

  const handleAmountInput = (value) => {
    setError("");
    const numValue = parseInt(value) || 0;
    onAmountChange(Math.min(Math.max(numValue, 0), maxAmount));
  };

  // ✅ Función para limpiar undefined y convertir a valores válidos
  const cleanBetData = (data) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        // Convertir undefined según el tipo de campo
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

    // Convertir selectedHorses a array si no lo es
    const horsesArray = Array.isArray(selectedHorses)
      ? selectedHorses
      : [selectedHorses];

    console.log("🐴 Caballos seleccionados ANTES de validar:", horsesArray);

    // Validar apuesta
    const validation = betService.validateBet(
      { amount, selectedHorses: horsesArray },
      userSaldo
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

      console.log("📊 Race Data completa:", raceData);
      console.log("🏟️ Nombre del hipódromo:", hipodromoNombre);

      const betDataRaw = {
        hipodromoId: raceData?.id_hipodromo || "",
        hipodromoNombre: hipodromoNombre,
        carreraId: raceData?.id || "",
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
      };

      console.log("📦 BetData RAW (antes de limpiar):", betDataRaw);
      console.log("🐴 Caballos en betDataRaw:", betDataRaw.selectedHorses);

      const betData = cleanBetData(betDataRaw);

      console.log("📊 Datos de apuesta LIMPIOS a enviar:", betData);
      console.log("🐴 Caballos DESPUÉS de limpiar:", betData.selectedHorses);

      const hasUndefined = Object.values(betData).some((v) => v === undefined);
      if (hasUndefined) {
        console.error("⚠️ Aún hay valores undefined:", betData);
        setError("Error en los datos de la apuesta");
        setLoading(false);
        return;
      }

      // Crear la apuesta
      const result = await betService.createBet(user.uid, betData, userSaldo);

      if (result.success) {
        setSuccess(true);
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
              {Array.isArray(selectedHorses)
                ? selectedHorses.map((h) => `#${h.number}`).join(", ")
                : "Ninguno"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Cantidad de apuestas:</span>
            <span className="text-white font-semibold">1</span>
          </div>
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
            ${userSaldo?.toLocaleString() || 0}
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
              max={maxAmount}
              step="100"
              placeholder="0"
              disabled={loading}
              className="w-full pl-10 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-xl font-bold focus:outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Monto mínimo: ${minAmount.toLocaleString()} • Monto máximo: $
            {maxAmount.toLocaleString()}
          </p>
        </label>

        {/* Montos rápidos */}
        <div>
          <span className="text-slate-400 text-sm mb-2 block">
            Montos rápidos:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((amt) => (
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
      </div>

      {/* Total y Ganancia Potencial */}
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

          <div className="bg-gradient-to-r from-fuchsia-500/20 to-fuchsia-600/20 border-2 border-fuchsia-500/40 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-semibold">
                Ganancia Potencial:
              </span>
              <span className="text-3xl font-bold text-fuchsia-300">
                ${potentialWin.toLocaleString()}
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
              <p className="text-green-400/80 text-sm">
                Redirigiendo...
              </p>
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
          disabled={!canProceed || loading || success}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${
            canProceed && !loading && !success
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
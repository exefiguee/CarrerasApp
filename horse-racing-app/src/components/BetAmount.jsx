import { useState } from "react";
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

  const minAmount = 200;
  const maxAmount = 50000;

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
        hipodromoNombre: hipodromoNombre, // ✅ Campo correcto
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
        alert("¡Apuesta registrada exitosamente! 🎉");
        onConfirm();
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
    <div>
      <div className="mb-6">
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">
            CABALLOS: {selectedHorses.length}
          </p>
          <p className="text-sm text-gray-600">CANTIDAD DE APUESTAS: 1</p>
          <div className="mt-2 pt-2 border-t border-gray-300">
            <p className="text-xs text-gray-700">
              <strong>Tipo de apuesta:</strong> {betType}
            </p>
            <p className="text-xs text-gray-700">
              <strong>Caballos:</strong>{" "}
              {Array.isArray(selectedHorses)
                ? selectedHorses.map((h) => `#${h.number}`).join(", ")
                : "Ninguno"}
            </p>
          </div>
        </div>

        {/* Mostrar saldo disponible */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Tu saldo disponible:</span>
            <span className="text-lg font-bold text-emerald-600">
              ${userSaldo?.toLocaleString() || 0}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ingrese monto a <span className="text-primary">APOSTAR.</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">(por apuesta)</p>

          <input
            type="number"
            value={amount || ""}
            onChange={(e) => handleAmountInput(e.target.value)}
            placeholder="0"
            className="w-full text-4xl font-bold text-center border-2 border-gray-300 rounded-lg p-4 focus:border-primary focus:outline-none"
            min={minAmount}
            max={maxAmount}
            disabled={loading}
          />
        </div>

        <div className="bg-secondary text-white rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Importe de la APUESTA</span>
            <span className="text-2xl font-bold">
              ${amount.toLocaleString()}
            </span>
          </div>

          {amount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ganancia Potencial</span>
                <span className="text-xl font-bold text-green-400">
                  ${potentialWin.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            <strong>Monto mínimo de apuesta:</strong> $
            {minAmount.toLocaleString()}
          </p>
          <p className="text-xs text-yellow-800 mt-1">
            <strong>Monto máximo de apuesta:</strong> $
            {maxAmount.toLocaleString()}
          </p>
        </div>

        {/* Mostrar errores */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          ATRÁS
        </button>
        <button
          onClick={handleConfirmBet}
          disabled={!canProceed || loading}
          className={`font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            canProceed && !loading
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}>
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              PROCESANDO...
            </>
          ) : (
            "CONFIRMAR APUESTA"
          )}
        </button>
      </div>

      <button
        onClick={() => onAmountChange(0)}
        disabled={loading}
        className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        CANCELAR APUESTA
      </button>
    </div>
  );
};

export default BetAmount;

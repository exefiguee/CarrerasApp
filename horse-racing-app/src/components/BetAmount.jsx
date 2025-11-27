import { useState } from "react";
import {
  ChevronLeft,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Check,
  Eye,
  Loader2,
  Ticket,
  Download,
  X,
} from "lucide-react";
import CombinationsViewer from "./CombinationsViewer";

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
  onClose, // 🔥 AGREGAR ESTA LÍNEA
}) => {
  const [customAmount, setCustomAmount] = useState("");
  const [showCombinations, setShowCombinations] = useState(false);
  
  // 🔥 ESTADOS PARA LOADING Y TICKET
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  console.log("💰 BetAmount - Config:", {
    betType,
    selectedHorses,
    minBetAmount,
    maxBetAmount,
    userSaldo,
    dividendo: raceData?.dividendo,
  });

  // ... (TODO tu código de cálculos existente se mantiene igual)
  
  const usesVales = () => {
    const excludedTypes = ["ganador", "segundo", "tercero", "tira(1,2,3)"];
    const normalizedType = betTypeConfig?.originalKey?.toLowerCase().trim();
    return !excludedTypes.includes(normalizedType);
  };

  const isGroupedSelection = selectedHorses?.grouped === true;
  
  const horsesArray = isGroupedSelection
    ? (() => {
        const positions = betTypeConfig?.positions || 2;
        const allHorses = [];
        for (let i = 1; i <= positions; i++) {
          allHorses.push(...(selectedHorses[`position${i}`] || []));
        }
        return allHorses;
      })()
    : Array.isArray(selectedHorses)
    ? selectedHorses
    : [];

  const calculateCombinations = () => {
    const selectionMode = betTypeConfig?.selectionMode;
    
    if (selectionMode === "grouped-races" || selectedHorses?.multiRace) {
      const races = betTypeConfig?.races || 2;
      let total = 1;
      for (let i = 1; i <= races; i++) {
        const raceKey = `race${i}`;
        const raceHorses = selectedHorses?.[raceKey] || [];
        const validHorses = raceHorses.filter((h) => !h.noCorre && !h.scratched);
        const count = validHorses.length;
        if (count === 0) return 0;
        total *= count;
      }
      return total;
    }

    if (selectionMode === "grouped-positions" && isGroupedSelection) {
      const positions = betTypeConfig?.positions || 2;
      let total = 1;
      for (let i = 1; i <= positions; i++) {
        const count = selectedHorses[`position${i}`]?.length || 0;
        if (count === 0) return 0;
        total *= count;
      }
      return total;
    }

    const n = horsesArray.length;
    if (n === 0) return 0;
    if (selectionMode === "single") return 1;
    if (betTypeConfig.type === "tira") return 3;
    if (selectionMode === "ordered-direct") return 1;
    
    if (selectionMode === "ordered-combination" && betTypeConfig.positions === 3) {
      if (n < 3) return 0;
      return factorial(n) / factorial(n - 3);
    }
    
    if (selectionMode === "ordered-combination" && betTypeConfig.positions === 4) {
      if (n < 4) return 0;
      return factorial(n) / factorial(n - 4);
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

  const calculateTotalAmount = (baseAmount) => {
    if (!baseAmount || baseAmount <= 0) return 0;
    const multiplier = betTypeConfig.multiplier || 1;
    return baseAmount * combinaciones * multiplier;
  };

  const totalAmount = calculateTotalAmount(amount);

  const calculateVales = () => {
    if (!usesVales() || !raceData?.dividendo || raceData.dividendo === 0) {
      return null;
    }
    const vales = totalAmount / raceData.dividendo;
    return Math.floor(vales);
  };

  const vales = calculateVales();
  const hasVales = vales !== null;

  const isWithinCombinationLimit = () => {
    const betTypeKey = betTypeConfig?.originalKey?.replace(/\s/g, "") + "1";
    const limites = raceData?.limitesApuestas?.[betTypeKey];
    const topeCombinaciones = limites?.topedeconbinaciones;
    if (!topeCombinaciones) return true;
    if (combinaciones > topeCombinaciones) return false;
    return true;
  };

  const isAmountValid = () => {
    if (amount < minBetAmount) return false;
    if (amount > maxBetAmount) return false;
    if (totalAmount > userSaldo) return false;
    if (!isWithinCombinationLimit()) return false;
    return true;
  };

  const getValidationMessage = () => {
    if (amount < minBetAmount) {
      return `La apuesta mínima es $${minBetAmount.toLocaleString("es-AR")}`;
    }
    if (amount > maxBetAmount) {
      return `La apuesta máxima es $${maxBetAmount.toLocaleString("es-AR")}`;
    }
    if (totalAmount > userSaldo) {
      return `No tenés saldo suficiente. Total necesario: $${totalAmount.toLocaleString("es-AR")}`;
    }
    if (!isWithinCombinationLimit()) {
      const betTypeKey = betTypeConfig?.originalKey?.replace(/\s/g, "") + "1";
      const limites = raceData?.limitesApuestas?.[betTypeKey];
      const topeCombinaciones = limites?.topedeconbinaciones;
      return `Esta apuesta supera el límite de ${topeCombinaciones} combinaciones permitidas. Actualmente tenés ${combinaciones} combinaciones.`;
    }
    return "";
  };

  const suggestedAmounts = [
    minBetAmount,
    minBetAmount * 2,
    minBetAmount * 5,
    minBetAmount * 10,
  ].filter((amt) => {
    const total = calculateTotalAmount(amt);
    return amt <= maxBetAmount && total <= userSaldo;
  });

  const handleSuggestedAmount = (suggestedAmount) => {
    setCustomAmount("");
    onAmountChange(suggestedAmount);
  };

  const handleCustomAmount = (value) => {
    setCustomAmount(value);
    const numValue = parseFloat(value) || 0;
    onAmountChange(numValue);
  };

  // 🔥 FUNCIÓN COMPLETA DE CONFIRMACIÓN CON LOADING Y TICKET
// 🔥 FUNCIÓN COMPLETA DE CONFIRMACIÓN CON LOADING Y TICKET
const handleConfirm = async () => {
  if (!isAmountValid()) return;

  setIsProcessing(true);

  try {
    console.log("🎯 Iniciando confirmación de apuesta...");
    
    // Llamar a la función original de confirmación (que guarda en Firebase)
    await onConfirm();
    
    console.log("✅ onConfirm ejecutado correctamente");

    // Esperar un momento para asegurar que se guardó en Firebase
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 🎫 Preparar datos del ticket
    const ticket = {
      id: `TICKET-${Date.now()}`,
      fecha: new Date().toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
      }),
      hipodromo: raceData.venue || raceData.descripcion_hipodromo,
      carrera: raceData.raceNumber || raceData.num_carrera,
      fechaCarrera: raceData.date || raceData.fecha_texto,
      hora: raceData.time || raceData.hora,
      tipoApuesta: betTypeConfig.label,
      caballos: horsesArray,
      selectedHorses: selectedHorses,
      combinaciones: combinaciones,
      montoPorCombinacion: amount,
      montoTotal: totalAmount,
      vales: hasVales ? vales : null,
      dividendo: hasVales ? raceData.dividendo : null,
      usuario: user?.email || user?.uid,
    };

    console.log("🎫 Mostrando ticket:", ticket);
    setTicketData(ticket);
    setShowTicket(true);
    setIsProcessing(false); // 🔥 IMPORTANTE: Detener el loading
    
  } catch (error) {
    console.error("❌ Error al confirmar apuesta:", error);
    setIsProcessing(false); // 🔥 Detener loading en caso de error
    alert("Error al procesar la apuesta. Por favor, intenta de nuevo.");
  }
};

  const renderSelectedHorses = () => {
    if (betTypeConfig?.selectionMode === "grouped-races" || selectedHorses?.multiRace) {
      const races = betTypeConfig?.races || 2;
      return (
        <div className="space-y-2">
          {Array.from({ length: races }, (_, index) => {
            const raceKey = `race${index + 1}`;
            const raceHorses = selectedHorses?.[raceKey] || [];
            const raceInfo = selectedHorses?.[`${raceKey}Info`];
            return (
              <div key={raceKey} className="flex justify-between items-start">
                <span className="text-slate-400">
                  {raceInfo ? (
                    <>
                      Carrera {raceInfo.number}
                      <span className="text-xs block mt-0.5">
                        {raceInfo.venue} - {raceInfo.date} {raceInfo.time}
                      </span>
                    </>
                  ) : (
                    `Carrera ${index + 1}:`
                  )}
                </span>
                <span className="text-white font-semibold text-right">
                  {raceHorses.length > 0
                    ? raceHorses
                        .map((h) => {
                          if (h.noCorre || h.scratched) {
                            return `#${h.number} (NO CORRE)`;
                          }
                          return `#${h.number}`;
                        })
                        .join(", ")
                    : "-"}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    if (isGroupedSelection) {
      const positions = betTypeConfig?.positions || 2;
      return (
        <div className="space-y-2">
          {Array.from({ length: positions }, (_, index) => {
            const positionKey = `position${index + 1}`;
            const positionHorses = selectedHorses[positionKey] || [];
            return (
              <div key={positionKey} className="flex justify-between items-start">
                <span className="text-slate-400">{index + 1}° puesto:</span>
                <span className="text-white font-semibold text-right">
                  {positionHorses.length > 0
                    ? positionHorses.map((h) => `#${h.number}`).join(", ")
                    : "-"}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="flex justify-between items-center">
        <span className="text-slate-400">Caballos seleccionados:</span>
        <span className="text-white font-semibold">
          {horsesArray.map((h) => `#${h.number}`).join(", ")}
        </span>
      </div>
    );
  };

  // 🔥 PANTALLA DE LOADING
  if (isProcessing) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-fuchsia-500 animate-spin" />
            <Ticket className="w-8 h-8 text-fuchsia-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-xl font-bold text-white mt-6 mb-2">
            Generando tu apuesta...
          </h3>
          <p className="text-slate-400 text-sm text-center max-w-md">
            Estamos procesando tu apuesta y generando tu ticket. Por favor espera un momento.
          </p>

          {/* Barra de progreso */}
          <div className="w-full max-w-md mt-6">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 animate-progress"></div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          .animate-progress {
            animation: progress 1.5s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  // 🎫 PANTALLA DEL TICKET
  if (showTicket && ticketData) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header del Ticket */}
<div className="bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 border-2 border-emerald-500/50 rounded-xl p-4 text-center">
  <div className="flex justify-center mb-3">
    <div className="p-3 rounded-full bg-emerald-500/20 border-2 border-emerald-500">
      <Check className="w-8 h-8 text-emerald-400" />
    </div>
  </div>
  <h2 className="text-2xl font-bold text-emerald-300 mb-1">
    ¡Apuesta Confirmada!
  </h2>
  <p className="text-slate-400 text-sm mb-1">
    Tu ticket ha sido generado exitosamente
  </p>
  {/* 🔥 NUEVO MENSAJE */}
  <div className="mt-3 pt-3 border-t border-emerald-500/30">
    <p className="text-emerald-300 font-semibold text-sm">
      ✅ Apuesta creada exitosamente en el sistema
    </p>
    <p className="text-slate-400 text-xs mt-1">
      ID: {ticketData.id}
    </p>
  </div>
</div>

        {/* Ticket */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-fuchsia-500/30 rounded-xl overflow-hidden print-ticket">
          {/* Header del ticket */}
          <div className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 px-6 py-4 relative">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900"></div>
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ticket className="w-6 h-6 text-white" />
                <div>
                  <h3 className="text-white font-bold text-lg">TICKET DE APUESTA</h3>
                  <p className="text-fuchsia-100 text-xs">{ticketData.id}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-fuchsia-100 text-xs">Fecha</p>
                <p className="text-white font-semibold text-sm">{ticketData.fecha}</p>
              </div>
            </div>
          </div>

          {/* Contenido del ticket */}
          <div className="p-6 space-y-4">
            {/* Info de la carrera */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-700 border-dashed">
              <div>
                <p className="text-slate-500 text-xs mb-1">Hipódromo</p>
                <p className="text-white font-semibold">{ticketData.hipodromo}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Carrera</p>
                <p className="text-white font-semibold">#{ticketData.carrera}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Fecha de carrera</p>
                <p className="text-white font-semibold">{ticketData.fechaCarrera}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Hora</p>
                <p className="text-white font-semibold">{ticketData.hora}</p>
              </div>
            </div>

            {/* Tipo de apuesta */}
            <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg p-3">
              <p className="text-slate-400 text-xs mb-1">Tipo de Apuesta</p>
              <p className="text-fuchsia-300 font-bold text-lg">{ticketData.tipoApuesta}</p>
            </div>

            {/* Caballos */}
            <div>
              <p className="text-slate-400 text-xs mb-2">Selección</p>
              <div className="bg-slate-900/50 rounded-lg p-3">
                {renderSelectedHorses()}
              </div>
            </div>

            {/* Montos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-1">Combinaciones</p>
                <p className="text-blue-300 font-bold text-xl">{ticketData.combinaciones}</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-1">Por combinación</p>
                <p className="text-amber-300 font-bold text-xl">
                  ${ticketData.montoPorCombinacion.toLocaleString("es-AR")}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/40 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 font-semibold">TOTAL APOSTADO</span>
                <span className="text-3xl font-bold text-emerald-300">
                  ${ticketData.montoTotal.toLocaleString("es-AR")}
                </span>
              </div>
              {ticketData.vales && (
                <div className="pt-2 border-t border-emerald-500/30 mt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Vales apostados:</span>
                    <span className="text-emerald-300 font-semibold">
                      {ticketData.vales} vales (${ticketData.dividendo}/vale)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Usuario */}
            <div className="text-center pt-4 border-t border-slate-700 border-dashed">
              <p className="text-slate-500 text-xs">Usuario</p>
              <p className="text-slate-300 text-sm font-mono">{ticketData.usuario}</p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="grid grid-cols-2 gap-3">
       <button
          onClick={() => {
            console.log("🎫 Cerrando ticket y modal");
            setShowTicket(false);
            setTicketData(null);
            setIsProcessing(false);
            // 🔥 CERRAR EL MODAL COMPLETO
            onClose();
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white font-semibold rounded-xl transition-all">
          <X className="w-5 h-5" />
          Cerrar
        </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-400 text-white font-semibold rounded-xl transition-all shadow-lg">
            <Download className="w-5 h-5" />
            Descargar
          </button>
        </div>

        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-ticket, .print-ticket * {
              visibility: visible;
            }
            .print-ticket {
              position: absolute;
              left: 0;
              top: 0;
            }
          }
        `}</style>
      </div>
    );
  }

  // 🎯 PANTALLA NORMAL (formulario de apuesta)
  return (
    <div className="space-y-4">
      {/* Resumen de la apuesta */}
      <div className="bg-gradient-to-r from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-fuchsia-300 font-semibold mb-3 flex items-center gap-2">
          <Check className="w-5 h-5" />
          Resumen de tu apuesta
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Tipo de apuesta:</span>
            <span className="text-white font-semibold">
              {betTypeConfig?.label || betType}
            </span>
          </div>
          {renderSelectedHorses()}
          {betTypeConfig.type === "tira" && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Se jugará a:</span>
              <span className="text-amber-300 font-semibold text-xs">
                Ganador + Segundo + Tercero
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
            <span className="text-slate-400">
              {combinaciones === 1 ? "Apuesta única:" : "Combinaciones:"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-amber-300 font-bold text-lg">
                {combinaciones}
              </span>
              {combinaciones > 1 && (
                <button
                  onClick={() => setShowCombinations(true)}
                  className="px-2 py-1 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-500/30 hover:border-fuchsia-500/50 rounded-lg text-fuchsia-300 text-xs font-semibold transition-all flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Ver
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selector de monto */}
      <div className="bg-gradient-to-r from-fuchsia-500/20 to-slate-800/40 border border-fuchsia-500/30 rounded-xl p-4">
        <h3 className="text-fuchsia-300 font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Monto por combinación
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {suggestedAmounts.map((suggestedAmount) => (
            <button
              key={suggestedAmount}
              onClick={() => handleSuggestedAmount(suggestedAmount)}
              className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                amount === suggestedAmount && !customAmount
                  ? "bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20"
                  : "bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300"
              }`}>
              ${suggestedAmount.toLocaleString("es-AR")}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <label className="text-slate-400 text-sm">Monto personalizado:</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
              $
            </span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => handleCustomAmount(e.target.value)}
              placeholder={`Mínimo ${minBetAmount}`}
              min={minBetAmount}
              max={maxBetAmount}
              className="w-full pl-8 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white font-semibold focus:border-fuchsia-500/50 focus:outline-none transition-colors"
            />
          </div>
          <p className="text-slate-500 text-xs">
            Rango permitido: ${minBetAmount.toLocaleString("es-AR")} - $
            {maxBetAmount.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      {/* Cálculo del total */}
      <div className="bg-gradient-to-br from-amber-500/20 to-slate-800/40 border-2 border-amber-500/40 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-amber-300 font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Total a pagar
          </span>
          <span className="text-2xl font-bold text-white">
            ${totalAmount.toLocaleString("es-AR")}
          </span>
        </div>
        {combinaciones > 1 && amount > 0 && (
          <div className="text-xs text-slate-400 space-y-1">
            <p>
              💡 ${amount.toLocaleString("es-AR")} por combinación × {combinaciones} combinaciones
            </p>
          </div>
        )}
        {hasVales && totalAmount > 0 && raceData?.dividendo && (
          <div className="mt-3 pt-3 border-t border-amber-500/30">
            <div className="bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-fuchsia-300 font-semibold text-sm flex items-center gap-2">
                  🎟️ Tu apuesta equivale a:
                </span>
                <span className="text-2xl font-bold text-fuchsia-300">
                  {vales} {vales === 1 ? "vale" : "vales"}
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <p>
                  💡 Cálculo: ${totalAmount.toLocaleString("es-AR")} ÷ $
                  {raceData.dividendo.toLocaleString("es-AR")} (dividendo) = {vales} vales
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between">
          <span className="text-slate-400 text-sm">Tu saldo disponible:</span>
          <span
            className={`font-bold ${
              totalAmount > userSaldo ? "text-red-400" : "text-emerald-400"
            }`}>
            ${userSaldo.toLocaleString("es-AR")}
          </span>
        </div>
        {totalAmount > 0 && totalAmount <= userSaldo && (
          <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between">
            <span className="text-slate-400 text-sm">Saldo después:</span>
            <span className="font-bold text-white">
              ${(userSaldo - totalAmount).toLocaleString("es-AR")}
            </span>
          </div>
        )}
      </div>

      {/* Mensaje de validación */}
      {amount > 0 && !isAmountValid() && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{getValidationMessage()}</p>
        </div>
      )}

      {/* Mensaje de éxito */}
      {amount > 0 && isAmountValid() && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm">
            ¡Listo! Tu apuesta está lista para confirmar
          </p>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white font-semibold rounded-xl transition-all">
          <ChevronLeft className="w-5 h-5" />
          Volver
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canProceed || !isAmountValid()}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${
            canProceed && isAmountValid()
              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20"
              : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
          }`}>
          <Check className="w-5 h-5" />
          Confirmar Apuesta
        </button>
      </div>

      {/* Modal de Combinaciones */}
      <CombinationsViewer
        selectedHorses={selectedHorses}
        betTypeConfig={betTypeConfig}
        isOpen={showCombinations}
        onClose={() => setShowCombinations(false)}
      />
    </div>
  );
};

export default BetAmount;
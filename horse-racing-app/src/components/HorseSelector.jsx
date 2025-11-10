const HorseSelector = ({
  horses = [], // ✅ Evita que se quede en blanco si no hay caballos
  betType,
  betTypeConfig,
  selectedHorses = [],
  onSelect,
  onBack,
  onNext,
  canProceed,
}) => {
  const colors = [
    "bg-blue-400",
    "bg-yellow-400",
    "bg-green-500",
    "bg-pink-500",
    "bg-black",
    "bg-white",
    "bg-orange-500",
    "bg-gray-500",
  ];

  const getPositionLabel = () => {
    if (betType === "GANADOR") return "A GANADOR:";
    if (betType === "SEGUNDO") return "A SEGUNDO:";
    if (betType === "TERCERO") return "A TERCER PUESTO:";
    if (betType === "EXACTA") return "A PRIMER Y SEGUNDO:";
    return "A PRIMER, SEGUNDO Y TERCER PUESTO:";
  };

  const handleHorseClick = (horse) => {
    const isSelected = selectedHorses.some((h) => h.number === horse.number);

    if (isSelected) {
      // Deseleccionar
      onSelect(selectedHorses.filter((h) => h.number !== horse.number));
    } else if (selectedHorses.length < betTypeConfig.maxHorses) {
      // ✅ Asegurar que se guarden correctamente number y name
      const horseToAdd = {
        number: horse.number,
        name: horse.name || `CABALLO ${horse.number}`,
      };
      onSelect([...selectedHorses, horseToAdd]);
    }
  };

  const isHorseSelected = (horseNumber) => {
    return selectedHorses.some((h) => h.number === horseNumber);
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-4">
        <p className="text-center text-red-600 font-medium mb-2">
          SELECCIONE LOS CABALLOS
        </p>
        <p className="text-center text-sm font-bold">{getPositionLabel()}</p>
        <p className="text-center text-xs text-gray-600 mt-1">
          (Tope de apuestas: {betTypeConfig.maxHorses})
        </p>
      </div>

      {/* Lista de caballos */}
      <div className="space-y-2 mb-4">
        <div className="grid grid-cols-12 gap-2 font-bold text-xs text-gray-700 px-2">
          <div className="col-span-2">N°</div>
          <div className="col-span-8">CABALLOS</div>
          <div className="col-span-2 text-right"></div>
        </div>

        {horses.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            No hay caballos disponibles para esta carrera 🐎
          </div>
        ) : (
          horses.map((horse, index) => {
            const selected = isHorseSelected(horse.number);
            const color = colors[(horse.number - 1) % colors.length];

            return (
              <div
                key={`horse-${horse.number}-${index}`}
                onClick={() => handleHorseClick(horse)}
                className={`grid grid-cols-12 gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selected
                    ? "border-green-600 bg-green-50 shadow-md"
                    : "border-gray-200 hover:border-purple-200 bg-white"
                }`}>
                {/* Número */}
                <div className="col-span-2 flex items-center">
                  <div
                    className={`${color} ${
                      color === "bg-white"
                        ? "border border-gray-300 text-black"
                        : "text-white"
                    } w-10 h-10 rounded-full flex items-center justify-center font-bold`}>
                    {horse.number}
                  </div>
                </div>

                {/* Info del caballo */}
                <div className="col-span-8 flex flex-col justify-center">
                  <div className="font-bold text-gray-800">{horse.name}</div>
                  {horse.jockey && (
                    <div className="text-xs text-gray-600">{horse.jockey}</div>
                  )}
                </div>

                {/* Checkbox */}
                <div className="col-span-2 flex items-center justify-end">
                  <input
                    type="checkbox"
                    checked={selected}
                    readOnly
                    className="w-5 h-5 accent-green-600 cursor-pointer"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selección actual */}
      {selectedHorses.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm font-bold text-blue-900 mb-2">
            Caballos seleccionados ({selectedHorses.length}/
            {betTypeConfig.maxHorses}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedHorses.map((horse, index) => (
              <span
                key={`selected-${horse.number}-${index}`}
                className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                {index + 1}° → #{horse.number} {horse.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onBack}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors">
          ATRÁS
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`font-medium py-3 rounded-lg transition-colors ${
            canProceed
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}>
          SIGUIENTE
        </button>
      </div>
    </div>
  );
};

export default HorseSelector;

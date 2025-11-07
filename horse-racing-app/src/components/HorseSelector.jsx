const HorseSelector = ({ 
  horses, 
  betType, 
  betTypeConfig,
  selectedHorses, 
  onSelect, 
  onBack, 
  onNext,
  canProceed 
}) => {
  const colors = [
    'bg-blue-400',
    'bg-yellow-400',
    'bg-green-500',
    'bg-pink-500',
    'bg-black',
    'bg-white',
    'bg-orange-500',
    'bg-gray-500'
  ];

  const getPositionLabel = () => {
    if (betType === 'GANADOR') return 'A GANADOR:';
    if (betType === 'SEGUNDO') return 'A SEGUNDO:';
    if (betType === 'TERCERO') return 'A TERCER PUESTO:';
    if (betType === 'EXACTA') return 'A PRIMER, SEGUNDO:';
    return 'A PRIMER, SEGUNDO Y TERCER PUESTO:';
  };

  const handleHorseClick = (horse) => {
    const isSelected = selectedHorses.some(h => h.number === horse.number);
    
    if (isSelected) {
      // Deseleccionar
      onSelect(selectedHorses.filter(h => h.number !== horse.number));
    } else {
      // Seleccionar si no se alcanzó el máximo
      if (selectedHorses.length < betTypeConfig.maxHorses) {
        onSelect([...selectedHorses, horse]);
      }
    }
  };

  const isHorseSelected = (horseNumber) => {
    return selectedHorses.some(h => h.number === horseNumber);
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-center text-red-600 font-medium mb-2">
          SELECCIONE LOS CABALLOS
        </p>
        <p className="text-center text-sm font-bold">
          {getPositionLabel()}
        </p>
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

        {horses.map((horse) => {
          const selected = isHorseSelected(horse.number);
          const color = colors[(horse.number - 1) % colors.length];
          
          return (
            <div
              key={horse.number}
              onClick={() => handleHorseClick(horse)}
              className={`grid grid-cols-12 gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selected 
                  ? 'border-primary bg-red-50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="col-span-2 flex items-center">
                <div className={`${color} ${color === 'bg-white' ? 'border border-gray-300' : ''} w-10 h-10 rounded-full flex items-center justify-center text-white font-bold`}>
                  {horse.number}
                </div>
              </div>
              <div className="col-span-8 flex flex-col justify-center">
                <div className="font-bold text-secondary">{horse.name}</div>
                <div className="text-xs text-gray-600">{horse.jockey}</div>
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {}}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selección actual */}
      {selectedHorses.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm font-bold text-blue-900 mb-2">
            Caballos seleccionados ({selectedHorses.length}/{betTypeConfig.maxHorses}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedHorses.map((horse, index) => (
              <span key={horse.number} className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
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
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors"
        >
          ATRÁS
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`font-medium py-3 rounded-lg transition-colors ${
            canProceed
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          SIGUIENTE
        </button>
      </div>
    </div>
  );
};

export default HorseSelector;
const BetTypeSelector = ({ betTypes, onSelect }) => {
  return (
    <div>
      <div className="mb-4 text-center text-red-600 flex items-center justify-center space-x-2">
        <span>❓</span>
        <span className="font-medium">Apuestas</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(betTypes).map(([key, config]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="bg-black hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-lg border-2 border-primary transition-all hover:scale-105"
          >
            {config.label}
          </button>
        ))}
      </div>

      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h3 className="font-bold text-secondary mb-2">📋 Tipos de Apuestas:</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li><strong>GANADOR:</strong> Elegí el caballo que llegará 1°</li>
          <li><strong>SEGUNDO:</strong> Elegí el caballo que llegará 2°</li>
          <li><strong>TERCERO:</strong> Elegí el caballo que llegará 3°</li>
          <li><strong>EXACTA:</strong> Elegí los 2 primeros en orden exacto</li>
          <li><strong>TRIFECTA D:</strong> Elegí el ganador, los otros 2 en cualquier orden</li>
          <li><strong>TIRA(1,2):</strong> Elegí 1° y 2° en orden exacto</li>
          <li><strong>TIRA(1,2,3):</strong> Elegí 1°, 2° y 3° en orden exacto</li>
          <li><strong>TRIFECTA C:</strong> Elegí los 3 primeros en orden exacto</li>
        </ul>
      </div>
    </div>
  );
};

export default BetTypeSelector;
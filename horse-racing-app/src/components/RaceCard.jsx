const RaceCard = ({ race, onSelect }) => {
  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: "Próxima", color: "bg-blue-500" },
      live: { text: "En Vivo", color: "bg-red-500 animate-pulse" },
      finished: { text: "Finalizada", color: "bg-gray-500" },
    };

    const badge = badges[status] || badges.upcoming;

    return (
      <span
        className={`${badge.color} text-white text-xs px-2 py-1 rounded-full`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-white p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-bold">🇦🇷 {race.venue}</h3>
            <p className="text-sm opacity-90">Carrera {race.raceNumber}</p>
          </div>
          {getStatusBadge(race.status)}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span>📅</span>
            <span className="font-medium">{race.date}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>⏰</span>
            <span className="font-medium">{race.time}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <span>📏</span>
          <span className="text-gray-600">Distancia: {race.distance}</span>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <span>🏇</span>
          <span className="text-gray-600">{race.horses.length} caballos</span>
        </div>

        {race.status === "live" && (
          <div className="flex items-center space-x-2 text-sm text-red-600 font-medium">
            <span>📺</span>
            <span>Transmisión en vivo disponible</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t">
        <button
          className="w-full bg-primary hover:bg-red-600 text-white font-medium py-2 rounded-lg transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}>
          Ver Caballos y Apostar
        </button>
      </div>
    </div>
  );
};

export default RaceCard;

import { useState, useEffect } from 'react';
import racingService from '../services/racingService';
import RaceCard from './RaceCard';

const RacesList = ({ onSelectRace }) => {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRaces();
  }, []);

  const loadRaces = async () => {
    try {
      setLoading(true);
      // Por ahora usamos mock data
      const data = racingService.getMockRaces();
      setRaces(data);
    } catch (err) {
      setError('Error cargando las carreras');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-2xl font-bold text-secondary mb-4">
          🏇 Carreras de Hoy - Argentina
        </h2>
        <p className="text-gray-600">
          Seleccioná una carrera para hacer tu apuesta
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {races.map((race) => (
          <RaceCard 
            key={race.id} 
            race={race} 
            onSelect={() => onSelectRace(race)}
          />
        ))}
      </div>

      {races.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay carreras disponibles para hoy
        </div>
      )}
    </div>
  );
};

export default RacesList;
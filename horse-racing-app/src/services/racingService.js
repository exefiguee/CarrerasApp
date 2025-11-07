import axios from 'axios';

const BASE_URL = 'https://bet30vip.ai';

// Nota: Este scraping va a necesitar un backend proxy porque la web tiene CORS
// Por ahora te muestro la estructura, después podemos armar el backend

const racingService = {
  // Obtener carreras de Argentina del día
  async getArgentinaRaces() {
    try {
      // Esto necesita un proxy backend porque bet30vip tiene protección CORS
      const response = await axios.get(`${BASE_URL}/horse-racing`);
      
      // Filtrar solo carreras de Argentina
      const argentineRaces = this.filterArgentineRaces(response.data);
      
      return argentineRaces;
    } catch (error) {
      console.error('Error fetching races:', error);
      throw error;
    }
  },

  // Filtrar carreras argentinas
  filterArgentineRaces(races) {
    // Hipódromos argentinos comunes
    const argentineVenues = [
      'PALERMO',
      'SAN ISIDRO',
      'LA PLATA',
      'ROSARIO',
      'MENDOZA',
      'CORDOBA'
    ];

    return races.filter(race => 
      argentineVenues.some(venue => 
        race.venue?.toUpperCase().includes(venue)
      )
    );
  },

  // Obtener detalles de una carrera específica
  async getRaceDetails(raceId) {
    try {
      const response = await axios.get(`${BASE_URL}/horse-racing/${raceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching race details:', error);
      throw error;
    }
  },

  // Mock data para desarrollo (mientras armamos el backend)
  getMockRaces() {
    return [
      {
        id: '1',
        venue: 'PALERMO',
        country: 'ARGENTINA',
        raceNumber: 8,
        date: '07/11/2025',
        time: '18:30',
        distance: '1600m',
        horses: [
          { number: 1, name: 'Caballo 1', jockey: 'J. Perez', odds: 3.5 },
          { number: 2, name: 'Caballo 2', jockey: 'M. Gonzalez', odds: 4.2 },
          { number: 3, name: 'Caballo 3', jockey: 'L. Martinez', odds: 5.0 },
          { number: 4, name: 'Caballo 4', jockey: 'R. Rodriguez', odds: 6.5 },
          { number: 5, name: 'Caballo 5', jockey: 'C. Lopez', odds: 8.0 },
          { number: 6, name: 'Caballo 6', jockey: 'A. Sanchez', odds: 10.0 },
          { number: 7, name: 'Caballo 7', jockey: 'F. Fernandez', odds: 12.0 },
          { number: 8, name: 'Caballo 8', jockey: 'D. Diaz', odds: 15.0 }
        ],
        videoUrl: 'https://example.com/stream/race1',
        status: 'upcoming' // upcoming, live, finished
      },
      {
        id: '2',
        venue: 'SAN ISIDRO',
        country: 'ARGENTINA',
        raceNumber: 5,
        date: '07/11/2025',
        time: '19:15',
        distance: '1400m',
        horses: [
          { number: 1, name: 'Veloz 1', jockey: 'J. Perez', odds: 2.8 },
          { number: 2, name: 'Veloz 2', jockey: 'M. Gonzalez', odds: 3.9 },
          { number: 3, name: 'Veloz 3', jockey: 'L. Martinez', odds: 4.5 },
          { number: 4, name: 'Veloz 4', jockey: 'R. Rodriguez', odds: 7.0 },
          { number: 5, name: 'Veloz 5', jockey: 'C. Lopez', odds: 9.0 },
          { number: 6, name: 'Veloz 6', jockey: 'A. Sanchez', odds: 11.0 }
        ],
        videoUrl: 'https://example.com/stream/race2',
        status: 'upcoming'
      }
    ];
  }
};

export default racingService;
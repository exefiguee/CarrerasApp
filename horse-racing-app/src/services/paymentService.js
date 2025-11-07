import axios from 'axios';

// Este servicio necesita un backend porque Mercado Pago requiere una API key secreta
// NO pongas tu access token en el frontend

const BACKEND_URL = 'http://localhost:3001/api'; // Tu backend

const paymentService = {
  // Crear preferencia de pago
  async createPaymentPreference(betData) {
    try {
      const response = await axios.post(`${BACKEND_URL}/payment/create-preference`, {
        title: `Apuesta - ${betData.raceName} - Carrera ${betData.raceNumber}`,
        description: `Tipo: ${betData.betType}`,
        unit_price: betData.amount,
        quantity: 1,
        betId: betData.betId,
        userId: betData.userId
      });

      return response.data;
    } catch (error) {
      console.error('Error creating payment preference:', error);
      throw error;
    }
  },

  // Verificar estado de pago
  async checkPaymentStatus(paymentId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/payment/status/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  },

  // Información de horarios de pago
  getPaymentScheduleInfo() {
    return {
      message: `
        📅 HORARIOS DE PAGO DE PREMIOS
        
        ⏰ Las carreras ganadoras se pagan en los siguientes horarios:
        
        • Lunes a Viernes: 10:00 AM - 6:00 PM
        • Sábados: 10:00 AM - 2:00 PM
        • Domingos y Feriados: No hay pagos
        
        💰 Los premios se acreditan automáticamente en tu cuenta de Mercado Pago
        dentro de las 24-48 horas hábiles posteriores a la finalización de la carrera.
        
        ✅ Una vez verificado el resultado, recibirás una notificación por email.
        
        ❓ Para consultas, contactanos a: soporte@horseracing.com
      `,
      schedules: [
        { day: 'Lunes - Viernes', hours: '10:00 AM - 6:00 PM' },
        { day: 'Sábados', hours: '10:00 AM - 2:00 PM' },
        { day: 'Domingos y Feriados', hours: 'No disponible' }
      ]
    };
  }
};

export default paymentService;
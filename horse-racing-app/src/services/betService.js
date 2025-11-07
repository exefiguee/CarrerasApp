import { db } from '/src/firebase/config.js'; // o con alias: import { db } from '@/firebase/config'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';

const betService = {
  // Crear una nueva apuesta
  async createBet(userId, betData) {
    try {
      const bet = {
        userId,
        raceId: betData.raceId,
        raceName: betData.raceName,
        venue: betData.venue,
        betType: betData.betType, // GANADOR, SEGUNDO, TERCERO, EXACTA, TRIFECTA, etc.
        selections: betData.selections, // Array de caballos seleccionados
        amount: betData.amount,
        potentialWin: betData.potentialWin,
        status: 'pending', // pending, won, lost, cancelled
        paymentStatus: 'pending', // pending, paid, failed
        paymentId: null,
        createdAt: serverTimestamp(),
        paidAt: null
      };

      const docRef = await addDoc(collection(db, 'bets'), bet);
      
      return {
        id: docRef.id,
        ...bet
      };
    } catch (error) {
      console.error('Error creating bet:', error);
      throw error;
    }
  },

  // Obtener apuestas de un usuario
  async getUserBets(userId) {
    try {
      const q = query(
        collection(db, 'bets'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const bets = [];
      
      querySnapshot.forEach((doc) => {
        bets.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return bets;
    } catch (error) {
      console.error('Error getting user bets:', error);
      throw error;
    }
  },

  // Actualizar estado de pago
  async updatePaymentStatus(betId, paymentId, status) {
    try {
      const betRef = doc(db, 'bets', betId);
      await updateDoc(betRef, {
        paymentId,
        paymentStatus: status,
        paidAt: status === 'paid' ? serverTimestamp() : null
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  // Actualizar resultado de apuesta
  async updateBetResult(betId, status) {
    try {
      const betRef = doc(db, 'bets', betId);
      await updateDoc(betRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating bet result:', error);
      throw error;
    }
  },

  // Calcular ganancia potencial
  calculatePotentialWin(betType, selections, amount) {
    // Lógica simple de cálculo (esto se puede hacer más complejo)
    let multiplier = 1;
    
    switch(betType) {
      case 'GANADOR':
        multiplier = selections[0]?.odds || 1;
        break;
      case 'SEGUNDO':
        multiplier = (selections[0]?.odds || 1) * 0.7;
        break;
      case 'TERCERO':
        multiplier = (selections[0]?.odds || 1) * 0.5;
        break;
      case 'EXACTA':
        multiplier = (selections[0]?.odds || 1) * (selections[1]?.odds || 1) * 0.5;
        break;
      case 'TRIFECTA':
        const odds = selections.slice(0, 3).reduce((acc, s) => acc * (s.odds || 1), 1);
        multiplier = odds * 0.3;
        break;
      case 'TRIFECTA_D':
        multiplier = selections[0]?.odds * 2;
        break;
      case 'TIRA_1_2':
        multiplier = (selections[0]?.odds || 1) * (selections[1]?.odds || 1) * 0.6;
        break;
      case 'TIRA_1_2_3':
        multiplier = selections.reduce((acc, s) => acc * (s.odds || 1), 1) * 0.4;
        break;
      case 'TRIFECTA_C':
        multiplier = selections.reduce((acc, s) => acc * (s.odds || 1), 1) * 0.35;
        break;
      default:
        multiplier = 1;
    }
    
    return Math.round(amount * multiplier);
  }
};

export default betService;
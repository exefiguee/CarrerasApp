import { useState, useEffect } from 'react';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import RacesList from './components/RacesList';
import BetModal from './components/BetModal';
import Login from './components/Login';
import './App.css';

//import PaymentModal from './components/PaymentModal';
//import { betService } from './services/betService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState(null);
  const [betData, setBetData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectRace = (race) => {
    setSelectedRace(race);
  };

  const handleConfirmBet = async (data) => {
    if (!user) {
      alert('Debes iniciar sesión para apostar');
      return;
    }

    // Calcular ganancia potencial
    const potentialWin = betService.calculatePotentialWin(
      data.betType,
      data.selections,
      data.amount
    );

    // Crear apuesta en Firebase
    try {
      const bet = await betService.createBet(user.uid, {
        ...data,
        potentialWin
      });

      // Preparar datos para el pago
      setBetData({
        ...data,
        betId: bet.id,
        userId: user.uid,
        potentialWin
      });

      // Cerrar modal de apuesta
      setSelectedRace(null);

      // Abrir modal de pago
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error creating bet:', error);
      alert('Error al crear la apuesta. Intentá nuevamente.');
    }
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    setBetData(null);
    alert('¡Pago procesado! Recibirás un email de confirmación.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-secondary text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">🏇 Horse Racing Bet</h1>
              <p className="text-sm text-gray-300">Carreras de Argentina</p>
            </div>
            <div className="text-right">
              <p className="text-sm">👤 {user.email}</p>
              <button
                onClick={() => auth.signOut()}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <RacesList onSelectRace={handleSelectRace} />
      </main>

      {/* Modals */}
      {selectedRace && (
        <BetModal
          race={selectedRace}
          onClose={() => setSelectedRace(null)}
          onConfirmBet={handleConfirmBet}
        />
      )}

      {showPaymentModal && betData && (
        <PaymentModal
          betData={betData}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* Footer */}
      <footer className="bg-secondary text-white text-center py-4 mt-12">
        <p className="text-sm">
          © 2025 Horse Racing Bet - Apuestas responsables 🎲
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Prohibido para menores de 18 años
        </p>
      </footer>
    </div>
  );
}

export default App;
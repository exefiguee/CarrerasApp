import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Importar módulos
import { createBet, cancelBet } from './bets';
import { approveRecharge, approveWithdrawal } from './transactions';
import { finalizeRace } from './races';

// Inicializar Firebase Admin
admin.initializeApp();

// ========== CREAR USUARIO (Solo Admin) ==========
export const adminCreateUser = functions.https.onCall(async (request) => {
  // Verificar autenticación
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  const db = admin.firestore();

  // Verificar que es admin
  const adminRef = db.collection('users').doc(request.auth.uid);
  const adminDoc = await adminRef.get();
  
  if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden crear usuarios'
    );
  }

  const { email, password, name, initialBalance } = request.data;

  if (!email || !password || !name) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan datos requeridos'
    );
  }

  try {
    // Crear usuario en Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Crear documento en Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      balance: initialBalance || 0,
      role: 'user',
      totalBet: 0,
      totalWon: 0,
      totalLost: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    });

    return {
      success: true,
      userId: userRecord.uid,
      email,
      name,
      password, // Devolver password para que el admin lo envíe
      initialBalance: initialBalance || 0,
    };

  } catch (error: any) {
    console.error('Error creando usuario:', error);
    
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'El email ya está registrado');
    }
    
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Exportar todas las funciones
export {
  createBet,
  cancelBet,
  approveRecharge,
  approveWithdrawal,
  finalizeRace
};
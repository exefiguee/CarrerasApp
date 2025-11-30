import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { isAdmin } from '../bets/helpers';

const db = admin.firestore();

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  initialBalance?: number;
}

/**
 * 🔥 CREAR USUARIO (Solo Admin)
 */
export const adminCreateUser = functions.https.onCall(async (request) => {
  // ========== 1. VERIFICAR AUTENTICACIÓN ==========
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  // ========== 2. VERIFICAR QUE ES ADMIN ==========
  const esAdmin = await isAdmin(request.auth.uid);
  if (!esAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden crear usuarios'
    );
  }

  const data = request.data as CreateUserData;
  const { email, password, name, initialBalance } = data;

  if (!email || !password || !name) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan datos requeridos'
    );
  }

  console.log("🔥 Creando usuario:", email);

  try {
    // Crear usuario en Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Crear documento en Firestore
    await db.collection('USUARIOS').doc(userRecord.uid).set({
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

    console.log("✅ Usuario creado:", userRecord.uid);

    return {
      success: true,
      userId: userRecord.uid,
      email,
      name,
      password, // Devolver password para que el admin lo envíe
      initialBalance: initialBalance || 0,
    };

  } catch (error: any) {
    console.error("❌ Error creando usuario:", error);
    
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'El email ya está registrado');
    }
    
    throw new functions.https.HttpsError('internal', error.message);
  }
});
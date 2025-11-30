import * as admin from 'firebase-admin';


const db = admin.firestore();

/**
 * 🔒 Validar que el usuario tenga saldo suficiente
 */
export async function validateUserBalance(
  userId: string, 
  amount: number
): Promise<{ valid: boolean; currentBalance: number; error?: string }> {
  try {
    const userDoc = await db.collection('USUARIOS').doc(userId).get();
    
    if (!userDoc.exists) {
      return { 
        valid: false, 
        currentBalance: 0, 
        error: 'Usuario no encontrado' 
      };
    }
    
    const userData = userDoc.data()!;
    const currentBalance = userData.balance || 0;
    
    if (currentBalance < amount) {
      return { 
        valid: false, 
        currentBalance, 
        error: `Saldo insuficiente. Tenés $${currentBalance}, necesitás $${amount}` 
      };
    }
    
    return { valid: true, currentBalance };
    
  } catch (error) {
    console.error("❌ Error validando saldo:", error);
    return { 
      valid: false, 
      currentBalance: 0, 
      error: 'Error al validar saldo' 
    };
  }
}

/**
 * 🔒 Validar que la carrera exista y esté disponible
 */
export async function validateRace(
  raceId: string
): Promise<{ valid: boolean; raceData?: any; error?: string }> {
  try {
    if (!raceId) {
      return { valid: false, error: 'ID de carrera no especificado' };
    }
    
    const raceDoc = await db.collection('carreras1').doc(raceId).get();
    
    if (!raceDoc.exists) {
      return { valid: false, error: 'Carrera no encontrada' };
    }
    
    const raceData = raceDoc.data()!;
    
    // Verificar si la carrera ya finalizó
    if (raceData.estado === 'FINALIZADA') {
      return { 
        valid: false, 
        error: 'La carrera ya finalizó, no se pueden hacer más apuestas' 
      };
    }
    
    // Verificar si la carrera está en curso
    if (raceData.estado === 'EN_CURSO') {
      return { 
        valid: false, 
        error: 'La carrera ya comenzó, no se pueden hacer más apuestas' 
      };
    }
    
    return { valid: true, raceData };
    
  } catch (error) {
    console.error("❌ Error validando carrera:", error);
    return { valid: false, error: 'Error al validar carrera' };
  }
}

/**
 * 🔒 Validar montos mínimos y máximos
 */
export function validateBetAmount(
  amount: number, 
  minAmount = 200, 
  maxAmount = 500000
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'El monto debe ser mayor a 0' };
  }
  
  if (amount < minAmount) {
    return { 
      valid: false, 
      error: `El monto mínimo es $${minAmount}` 
    };
  }
  
  if (amount > maxAmount) {
    return { 
      valid: false, 
      error: `El monto máximo es $${maxAmount}` 
    };
  }
  
  return { valid: true };
}

/**
 * 🔒 Validar selección de caballos
 */
export function validateHorseSelection(
  horses: any[]
): { valid: boolean; error?: string } {
  if (!horses || horses.length === 0) {
    return { 
      valid: false, 
      error: 'Debes seleccionar al menos un caballo' 
    };
  }
  
  // Verificar que los números sean válidos
  for (const horse of horses) {
    const numero = horse.numero || horse.number;
    if (!numero || numero < 1) {
      return { 
        valid: false, 
        error: `Número de caballo inválido: ${numero}` 
      };
    }
  }
  
  return { valid: true };
}

/**
 * 🔒 Validar que el usuario pueda cancelar la apuesta
 */
export async function validateBetCancellation(
  betId: string,
  userId: string
): Promise<{ valid: boolean; betData?: any; error?: string }> {
  try {
    const betDoc = await db.collection('bets').doc(betId).get();
    
    if (!betDoc.exists) {
      return { 
        valid: false, 
        error: 'Apuesta no encontrada' 
      };
    }
    
    const betData = betDoc.data()!;
    
    // Verificar que sea el dueño
    if (betData.userId !== userId) {
      return { 
        valid: false, 
        error: 'No tenés permiso para cancelar esta apuesta' 
      };
    }
    
    // Verificar que esté pendiente
    if (betData.status !== 'pending') {
      return { 
        valid: false, 
        error: `No se puede cancelar una apuesta con estado: ${betData.status}` 
      };
    }
    
    // Verificar que la carrera no haya comenzado
    if (betData.raceId) {
      const raceValidation = await validateRace(betData.raceId);
      if (!raceValidation.valid) {
        return { 
          valid: false, 
          error: 'La carrera ya comenzó, no se puede cancelar' 
        };
      }
    }
    
    return { valid: true, betData };
    
  } catch (error) {
    console.error("❌ Error validando cancelación:", error);
    return { 
      valid: false, 
      error: 'Error al validar cancelación' 
    };
  }
}

/**
 * 🔒 Verificar que el usuario es admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('USUARIOS').doc(userId).get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data()!;
    return userData.role === 'admin';
    
  } catch (error) {
    console.error("❌ Error verificando admin:", error);
    return false;
  }
}

/**
 * 🔒 Limpiar datos para Firestore (eliminar undefined)
 */
export function cleanFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  
  if (Array.isArray(obj)) {
    return obj
      .map(item => cleanFirestoreData(item))
      .filter(item => item !== null);
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        const cleanedValue = cleanFirestoreData(value);
        if (cleanedValue !== null || value === null) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }
  
  return obj;
}
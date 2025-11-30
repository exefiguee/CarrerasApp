import { useState } from "react";
import { auth, db } from "../firebase/config";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Loader2, Copy, Check } from "lucide-react";

function CreateUser() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [initialBalance, setInitialBalance] = useState(0);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdUser, setCreatedUser] = useState(null);
  const [copied, setCopied] = useState(false);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleCopyCredentials = async () => {
    if (!createdUser) return;

    const credentials = `Usuario: ${createdUser.email}\nContraseña: ${createdUser.password} \nMonto:$ ${createdUser.balance}`;
    
    try {
      await navigator.clipboard.writeText(credentials);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
      // Fallback para navegadores que no soportan clipboard
      alert(credentials);
    }
  };

  const handleCreateAnother = () => {
    setCreatedUser(null);
    setSuccess("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email || !password || !name) {
      setError("Por favor completa todos los campos obligatorios");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      // Guardar el usuario actual (admin) antes de crear el nuevo
      const currentUser = auth.currentUser;

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Crear documento en Firestore en la colección "USUARIOS"
      await setDoc(doc(db, "USUARIOS", user.uid), {
        email: email,
        name: name,
        balance: parseFloat(initialBalance) || 0,
        role: role,
        createdAt: new Date().toISOString(),
        totalBet: 0,
        totalWon: 0,
        totalLost: 0,
      });

      // ✅ IMPORTANTE: Cerrar sesión del usuario recién creado
      // Esto evita que Firebase cambie automáticamente al nuevo usuario
      await signOut(auth);

      // Nota: El usuario admin se re-autenticará automáticamente
      // gracias al listener onAuthStateChanged de tu App.jsx

      // Guardar datos del usuario creado (incluyendo la contraseña en texto plano solo para mostrar)
      setCreatedUser({
        name: name,
        email: email,
        password: password,
        balance: parseFloat(initialBalance) || 0,
        role: role
      });

      setSuccess(`¡Usuario creado exitosamente!`);
      
      // NO limpiar campos hasta crear otro usuario
      // El usuario puede copiar los datos primero

    } catch (err) {
      console.error("Error al crear usuario:", err);
      
      const errorMessage =
        err.code === "auth/email-already-in-use"
          ? "El email ya está registrado"
          : err.code === "auth/weak-password"
          ? "La contraseña debe tener al menos 6 caracteres"
          : err.code === "auth/invalid-email"
          ? "Email inválido"
          : err.code === "auth/operation-not-allowed"
          ? "Operación no permitida. Verifica la configuración de Firebase"
          : "Error al crear usuario. Intentá nuevamente.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!createdUser ? (
        // Formulario de creación
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-fuchsia-200 mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-fuchsia-900/40 backdrop-blur-sm border border-fuchsia-700/30 rounded-lg text-white placeholder-fuchsia-400/60 focus:outline-none focus:border-fuchsia-500 focus:bg-fuchsia-900/60 transition-all"
              placeholder="Juan Pérez"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-fuchsia-200 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-fuchsia-900/40 backdrop-blur-sm border border-fuchsia-700/30 rounded-lg text-white placeholder-fuchsia-400/60 focus:outline-none focus:border-fuchsia-500 focus:bg-fuchsia-900/60 transition-all"
              placeholder="usuario@ejemplo.com"
              disabled={loading}
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-semibold text-fuchsia-200 mb-2">
              Contraseña *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2.5 bg-fuchsia-900/40 backdrop-blur-sm border border-fuchsia-700/30 rounded-lg text-white placeholder-fuchsia-400/60 focus:outline-none focus:border-fuchsia-500 focus:bg-fuchsia-900/60 transition-all"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-fuchsia-300/70">
              Mínimo 6 caracteres
            </p>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-semibold text-fuchsia-200 mb-2">
              Rol
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-fuchsia-900/40 backdrop-blur-sm border border-fuchsia-700/30 rounded-lg text-white focus:outline-none focus:border-fuchsia-500 focus:bg-fuchsia-900/60 transition-all"
              disabled={loading}>
              <option value="user" className="bg-slate-900">Usuario</option>
      
            </select>
          </div>

          {/* Saldo inicial */}
          <div>
            <label className="block text-sm font-semibold text-fuchsia-200 mb-2">
              Saldo inicial
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fuchsia-300">
                $
              </span>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-fuchsia-900/40 backdrop-blur-sm border border-fuchsia-700/30 rounded-lg text-white placeholder-fuchsia-400/60 focus:outline-none focus:border-fuchsia-500 focus:bg-fuchsia-900/60 transition-all"
                placeholder="0"
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>
            <p className="mt-1 text-xs text-fuchsia-300/70">
              Saldo que tendrá el usuario al iniciar
            </p>
          </div>

          {/* Mensajes de error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-500/40 animate-pulse">
              <p className="text-sm text-red-300 font-medium text-center">
                ⚠️ {error}
              </p>
            </div>
          )}

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 hover:scale-[1.02] shadow-green-500/20"
            }`}>
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            <span>{loading ? "Creando usuario..." : "Crear Usuario"}</span>
          </button>

          {/* Info adicional */}
          <div className="mt-4 p-3 rounded-lg bg-fuchsia-900/20 backdrop-blur-sm border border-fuchsia-700/20">
            <p className="text-xs text-fuchsia-300 text-center">
              ⚠️ Los campos marcados con * son obligatorios
            </p>
            <p className="text-xs text-fuchsia-300 text-center mt-1">
              🔒 La información se guarda de forma segura en Firebase
            </p>
          </div>
        </form>
      ) : (
        // Vista de usuario creado con datos para copiar
        <div className="space-y-6">
          {/* Mensaje de éxito */}
          <div className="p-4 rounded-lg bg-green-500/20 backdrop-blur-sm border border-green-500/40 text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-xl font-bold text-green-300 mb-1">
              ¡Usuario Creado Exitosamente!
            </h3>
            <p className="text-sm text-green-200">
              Copia los datos para compartirlos con el usuario
            </p>
          </div>

          {/* Datos del usuario */}
          <div className="bg-fuchsia-900/40 backdrop-blur-sm border border-fuchsia-700/30 rounded-xl p-6">
            <h4 className="text-lg font-bold text-fuchsia-200 mb-4 text-center">
              Datos de Acceso
            </h4>
            
            <div className="space-y-3">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-xs text-fuchsia-300 mb-1">Nombre:</p>
                <p className="text-white font-semibold text-lg">{createdUser.name}</p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-xs text-fuchsia-300 mb-1">Usuario:</p>
                <p className="text-white font-mono text-lg break-all">{createdUser.email}</p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-xs text-fuchsia-300 mb-1">Contraseña:</p>
                <p className="text-white font-mono text-lg">{createdUser.password}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-xs text-fuchsia-300 mb-1">Saldo Inicial:</p>
                  <p className="text-white font-bold text-lg">${createdUser.balance.toLocaleString()}</p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-xs text-fuchsia-300 mb-1">Rol:</p>
                  <p className="text-white font-semibold text-lg capitalize">{createdUser.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botón para copiar */}
          <button
            onClick={handleCopyCredentials}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
              copied
                ? "bg-green-600"
                : "bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 hover:from-fuchsia-500 hover:to-fuchsia-600 hover:scale-[1.02] shadow-fuchsia-500/20"
            }`}>
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copiar Credenciales</span>
              </>
            )}
          </button>

          {/* Vista previa del texto que se copiará */}
          <div className="p-4 rounded-lg bg-slate-900/50 backdrop-blur-sm border border-slate-700/30">
            <p className="text-xs text-slate-400 mb-2 text-center font-semibold">
              📋 Se copiará este texto:
            </p>
            <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap text-center">
              {`Usuario: ${createdUser.email}\nContraseña: ${createdUser.password}\nMonto: ${createdUser.balance}  `}
            </pre>
          </div>

          {/* Botón para crear otro usuario */}
          <button
            onClick={handleCreateAnother}
            className="w-full py-3 rounded-lg font-bold bg-slate-800/50 hover:bg-slate-800 border border-fuchsia-700/30 text-fuchsia-300 hover:text-fuchsia-200 transition-all hover:scale-[1.02]">
            Crear Otro Usuario
          </button>
        </div>
      )}
    </div>
  );
}

export default CreateUser;
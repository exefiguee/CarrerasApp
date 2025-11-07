import { useState, useEffect } from "react";

const RacesList = ({ onSelectRace }) => {
  const [data, setData] = useState(null);
  const [transmisiones, setTransmisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHipodromo, setSelectedHipodromo] = useState(null);
  const [selectedCarrera, setSelectedCarrera] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(
    "https://www.hipodromoargentino.com.ar/"
  );

  // ────────────────────────────────
  // 🔹 CARGA DE DATOS DE CARRERAS
  // ────────────────────────────────
  useEffect(() => {
    cargarDatos();
    cargarTransmisiones();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "https://xwdc.net/nuevo/ext_datos_carrerasv2.php"
      );
      const text = await response.text();
      const jsonStart = text.indexOf('{"error"');
      const jsonText = text.substring(jsonStart);
      const jsonData = JSON.parse(jsonText);

      if (jsonData.error === 0) {
        setData(jsonData);
        if (jsonData.hipodromos.length > 0) {
          setSelectedHipodromo(jsonData.hipodromos[0].id);
        }
      } else {
        setError("Error en los datos recibidos");
      }
    } catch (err) {
      setError("Error al cargar los datos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────
  // 🔹 CARGA DE TRANSMISIONES
  // ────────────────────────────────
  const cargarTransmisiones = async () => {
    try {
      const res = await fetch("https://xwdc.net/nuevo/ext_gruposv2.php");
      const text = await res.text();

      const jsonStart = text.indexOf('{"error"');
      const jsonText = text.substring(jsonStart);
      const jsonData = JSON.parse(jsonText);

      if (jsonData.error === 0 && jsonData.grupos) {
        setTransmisiones(jsonData.grupos);
      }
    } catch (err) {
      console.error("Error al cargar transmisiones:", err);
    }
  };

  // ────────────────────────────────
  // 🔹 FUNCIONES AUXILIARES
  // ────────────────────────────────
  const getCarrerasDelHipodromo = () => {
    if (!data || !selectedHipodromo) return [];
    return data.carreras.filter((c) => c.id_hipodromo === selectedHipodromo);
  };

  const getHipodromoInfo = (id) => {
    if (!data) return null;
    return data.hipodromos.find((h) => h.id === id);
  };

  const handleSelectCarrera = (carrera) => {
    setSelectedCarrera(carrera);

    const totalCaballos = parseInt(carrera.caballos) || 0;
    const generatedHorses = Array.from({ length: totalCaballos }, (_, i) => ({
      number: i + 1,
      name: `CABALLO ${i + 1}`,
    }));

    if (onSelectRace) {
      onSelectRace({
        ...carrera,
        horses: generatedHorses,
      });
    }
  };

  const handleSelectTransmision = (link) => {
    setIframeUrl(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Cargando datos y transmisiones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-5">{error}</div>;
  }

  const carrerasDelHipodromo = getCarrerasDelHipodromo();

  // ────────────────────────────────
  // 🔹 INTERFAZ COMPLETA
  // ────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* 🔸 HEADER SUPERIOR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-2xl">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <span className="text-2xl">🏇</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Racing Management System
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-emerald-400">📅</span>
                <p className="text-sm text-slate-400">{data?.fecha_del_dia}</p>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-2"></span>
                <span className="text-xs text-emerald-400 font-medium">
                  En Vivo
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-center">
              <p className="text-xs text-slate-400">Hipódromos</p>
              <p className="text-xl font-bold text-white">
                {data?.hipodromos.length}
              </p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-center">
              <p className="text-xs text-slate-400">Carreras</p>
              <p className="text-xl font-bold text-emerald-400">
                {data?.carreras.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🔸 CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden">
        {/* 🔹 SIDEBAR HIPÓDROMOS */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 overflow-y-auto">
          <div className="p-5 bg-slate-800/50 border-b border-slate-700/50">
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              📍 Hipódromos
            </h2>
            <p className="text-xs text-slate-400">
              {data?.hipodromos.length} disponibles
            </p>
          </div>

          <div className="p-4 space-y-2">
            {data?.hipodromos.map((hip) => {
              const carrerasCount = data.carreras.filter(
                (c) => c.id_hipodromo === hip.id
              ).length;
              const isSelected = selectedHipodromo === hip.id;
              return (
                <button
                  key={hip.id}
                  onClick={() => {
                    setSelectedHipodromo(hip.id);
                    setSelectedCarrera(null);
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg scale-105"
                      : "bg-slate-800 hover:bg-slate-700 border border-slate-700"
                  }`}>
                  <div className="font-semibold text-white mb-1">
                    {hip.descripcion}
                  </div>
                  <p className="text-xs text-slate-400">
                    🏇 {carrerasCount} carreras
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 🔹 CENTRO - IFRAME */}
        <div className="flex flex-col bg-slate-900 h-full w-full overflow-hidden">
          <div className="bg-slate-800/50 border-b border-slate-700/50 p-4 flex items-center gap-3">
            <span className="text-xl">🌐</span>
            <input
              type="text"
              value={iframeUrl}
              onChange={(e) => setIframeUrl(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
              placeholder="Ingresa URL del visor..."
            />
            <button
              onClick={() => setIframeUrl(iframeUrl)}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-2.5 rounded-xl">
              Cargar
            </button>
          </div>

          <div className="flex-1 bg-slate-950 overflow-hidden">
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0"
              title="Visor Web"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        </div>

        {/* 🔹 SIDEBAR DERECHO - TRANSMISIONES */}
        <div className="w-72 bg-slate-900 border-l border-slate-800 overflow-y-auto">
          <div className="p-5 bg-slate-800/50 border-b border-slate-700/50">
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              📺 Transmisiones
            </h2>
            <p className="text-xs text-slate-400">
              {transmisiones.length} disponibles
            </p>
          </div>

          <div className="p-4 space-y-2">
            {transmisiones.map((t, i) => (
              <button
                key={i}
                onClick={() => handleSelectTransmision(t.link)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-left p-3 rounded-xl border border-slate-700 hover:border-emerald-500 transition-all">
                <p className="text-white font-semibold text-sm">
                  {t.descripcion}
                </p>
                <p className="text-xs text-slate-400 truncate">{t.link}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* 🔸 LISTA DE CARRERAS INFERIOR */}
      <div className="h-72 bg-slate-900 border-t border-slate-800 overflow-y-auto">
        {/* Encabezado de la sección */}
        <div className="p-5 bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <span className="text-xl">🏇</span>
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">
                {getHipodromoInfo(selectedHipodromo)?.descripcion ||
                  "Hipódromo"}
              </h2>
              <p className="text-xs text-slate-400">
                {carrerasDelHipodromo.length} carreras programadas
              </p>
            </div>
          </div>
        </div>

        {/* 🔸 LISTA DE CARRERAS */}
        {carrerasDelHipodromo.length === 0 ? (
          <div className="flex items-center justify-center h-56 text-slate-500">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 shadow-inner shadow-slate-700">
                <span className="text-4xl">🏇</span>
              </div>
              <p className="text-lg font-semibold text-slate-300">
                No hay carreras disponibles
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Selecciona otro hipódromo
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-6">
            {carrerasDelHipodromo.map((carrera) => {
              const isSelected = selectedCarrera?.id === carrera.id;
              return (
                <button
                  key={carrera.id}
                  onClick={() => handleSelectCarrera(carrera)}
                  className={`group relative text-left p-5 rounded-2xl transition-all duration-300 border backdrop-blur-sm overflow-hidden
            ${
              isSelected
                ? "bg-gradient-to-br from-slate-600/80 to-slate-500/80 border-red-400/30 shadow-lg shadow-red-500/30 scale-105"
                : "bg-slate-900/70 border-slate-700 hover:bg-slate-800/80 hover:border-emerald-400/20 hover:shadow-md hover:shadow-emerald-500/10"
            }`}>
                  {/* 🔹 Efecto de brillo al seleccionar */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                  )}

                  {/* Encabezado */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold tracking-wide transition-colors
                ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20 group-hover:bg-emerald-500/20"
                }`}>
                      Carrera {carrera.num_carrera}
                    </span>
                    <div
                      className={`flex items-center gap-1.5 text-sm font-semibold transition-colors
                ${
                  isSelected
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-300"
                }`}>
                      <span>🕐</span>
                      <span>{carrera.hora}</span>
                    </div>
                  </div>

                  {/* Contenido principal */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          isSelected ? "text-white" : "text-emerald-400"
                        }>
                        👥
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? "text-white" : "text-slate-300"
                        }`}>
                        {carrera.caballos} caballos
                      </span>
                    </div>

                    <div
                      className={`text-sm ${
                        isSelected ? "text-white/90" : "text-slate-400"
                      }`}>
                      📅 {carrera.fecha}
                    </div>

                    <div
                      className={`text-sm font-semibold ${
                        isSelected ? "text-yellow-300" : "text-emerald-400"
                      }`}>
                      💰 {parseFloat(carrera.monto_vale).toLocaleString()} USD
                    </div>
                  </div>

                  {/* 🔹 Sombra decorativa */}
                  <div
                    className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
                      isSelected
                        ? "shadow-[0_0_25px_2px_rgba(239,68,68,0.4)]"
                        : "group-hover:shadow-[0_0_20px_1px_rgba(16,185,129,0.2)]"
                    }`}></div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RacesList;

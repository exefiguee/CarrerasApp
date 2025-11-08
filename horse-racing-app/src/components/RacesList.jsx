import { useState, useEffect } from "react";

const RacesList = ({ onSelectRace }) => {
  const [data, setData] = useState(null);
  const [transmisiones, setTransmisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHipodromo, setSelectedHipodromo] = useState(null);
  const [selectedCarrera, setSelectedCarrera] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(
    "public/canalcarreras.html?id=USANETWORK"
  );
  const [activeTab, setActiveTab] = useState("hipodromos"); // hipodromos, carreras, apuestas

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
  // 🔹 INTERFAZ CON NUEVO LAYOUT
  // ────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* 🔸 HEADER SUPERIOR */}
      {/* <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-2xl">
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
      </div> */}

      {/* 🔸 CONTENIDO PRINCIPAL - 2 COLUMNAS */}
      <div className="flex-1 flex overflow-hidden">
        {/* 🔹 COLUMNA IZQUIERDA - TRANSMISIONES */}
        <div className="w-1/2 flex flex-col bg-slate-900 border-r border-slate-800">
          <div className="p-5 bg-slate-800/50 border-b border-slate-700/50">
            <h2 className="font-bold text-2xl text-white flex items-center gap-2 justify-center">
              📺 Transmisiones
            </h2>
          </div>

          {/* Input URL */}
          {/* <div className="bg-slate-800/30 border-b border-slate-700/50 p-4 flex items-center gap-3">
            <span className="text-xl">🌐</span>
            <input
              type="text"
              value={iframeUrl}
              onChange={(e) => setIframeUrl(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
              placeholder="Ingresa URL del visor..."
            />
            <button
              onClick={() => setIframeUrl(iframeUrl)}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all">
              Cargar
            </button>
          </div> */}

          {/* Iframe */}
          <div className="flex-1 bg-slate-950 overflow-hidden">
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0"
              title="Visor Web"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>

          {/* Lista de transmisiones */}
          <div className="h-56 bg-slate-900/50 border-t border-slate-800 overflow-y-auto p-4">
            <div className="space-y-2">
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

        {/* 🔹 COLUMNA DERECHA - TABS + CONTENIDO */}
        <div className="w-1/2 flex flex-col bg-slate-900">
          {/* Tabs */}
          <div className="flex bg-slate-800/50 border-b border-slate-700/50">
            <button
              onClick={() => setActiveTab("hipodromos")}
              className={`flex-1 py-4 px-6 font-bold text-lg transition-all ${
                activeTab === "hipodromos"
                  ? "bg-gradient-to-b from-emerald-600 to-emerald-500 text-white border-b-4 border-emerald-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}>
              Hipódromos
            </button>
            <button
              onClick={() => setActiveTab("carreras")}
              className={`flex-1 py-4 px-6 font-bold text-lg transition-all ${
                activeTab === "carreras"
                  ? "bg-gradient-to-b from-emerald-600 to-emerald-500 text-white border-b-4 border-emerald-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}>
              Carreras
            </button>
            <button
              onClick={() => setActiveTab("apuestas")}
              className={`flex-1 py-4 px-6 font-bold text-lg transition-all ${
                activeTab === "apuestas"
                  ? "bg-gradient-to-b from-emerald-600 to-emerald-500 text-white border-b-4 border-emerald-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}>
              Apuestas
            </button>
          </div>

          {/* Contenido dinámico según tab */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* TAB: HIPÓDROMOS */}
            {activeTab === "hipodromos" && (
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  📍 Selecciona un Hipódromo
                  <span className="text-sm text-slate-400">
                    ({data?.hipodromos.length} disponibles)
                  </span>
                </h3>
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
                      className={`w-full text-left p-5 rounded-xl transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg scale-105"
                          : "bg-slate-800 hover:bg-slate-700 border border-slate-700"
                      }`}>
                      <div className="font-semibold text-lg text-white mb-1">
                        {hip.descripcion}
                      </div>
                      <p className="text-sm text-slate-300">
                        🏇 {carrerasCount} carreras programadas
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB: CARRERAS */}
            {activeTab === "carreras" && (
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    🏇 {getHipodromoInfo(selectedHipodromo)?.descripcion || "Selecciona un hipódromo"}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {carrerasDelHipodromo.length} carreras programadas
                  </p>
                </div>

                {carrerasDelHipodromo.length === 0 ? (
                  <div className="flex items-center justify-center h-96 text-slate-500">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🏇</span>
                      </div>
                      <p className="text-lg font-semibold text-slate-300">
                        No hay carreras disponibles
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Selecciona un hipódromo en la pestaña Hipódromos
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {carrerasDelHipodromo.map((carrera) => {
                      const isSelected = selectedCarrera?.id === carrera.id;
                      return (
                        <button
                          key={carrera.id}
                          onClick={() => handleSelectCarrera(carrera)}
                          className={`w-full text-left p-5 rounded-xl transition-all duration-300 border ${
                            isSelected
                              ? "bg-gradient-to-br from-red-600/80 to-red-500/80 border-red-400/30 shadow-lg scale-105"
                              : "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-emerald-400/30"
                          }`}>
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`px-4 py-1.5 rounded-lg text-sm font-bold ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20"
                              }`}>
                              Carrera {carrera.num_carrera}
                            </span>
                            <span className="text-white font-semibold">
                              🕐 {carrera.hora}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-white">
                              <span>👥</span>
                              <span className="font-medium">
                                {carrera.caballos} caballos
                              </span>
                            </div>
                            <div className="text-sm text-slate-300">
                              📅 {carrera.fecha}
                            </div>
                            <div
                              className={`text-sm font-semibold ${
                                isSelected ? "text-yellow-300" : "text-emerald-400"
                              }`}>
                              💰 {parseFloat(carrera.monto_vale).toLocaleString()} USD
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: APUESTAS */}
            {activeTab === "apuestas" && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <span className="text-5xl">🎰</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Información de Apuestas
                  </h3>
                  <p className="text-slate-400">
                    Aquí podrás ver la información de las apuestas realizadas
                  </p>
                  <button className="mt-6 px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all">
                    Próximamente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RacesList;
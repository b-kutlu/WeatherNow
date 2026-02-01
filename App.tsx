import React, { useState, useEffect, useCallback } from 'react';
import { fetchWeatherData, fetchAirQualityData } from './services/geminiService';
import { WeatherData, AirQualityData } from './types';
import SearchBar from './components/SearchBar';
import WeatherChart from './components/WeatherChart';
import { getWeatherIcon, Droplets, Wind, Thermometer, MapPin } from './components/Icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Translation Data ---
const translations: Record<string, any> = {
  en: {
    weather: "Weather",
    airQuality: "Air Quality",
    humidity: "Humidity",
    wind: "Wind",
    feelsLike: "Feels Like",
    summaryTitle: "Weather Summary",
    hourly: "Hourly Forecast",
    daily: "7-Day Forecast",
    loading: "Retrieving data...",
    searchPlaceholder: "Search city...",
    requestTook: "Request took",
    usAqi: "US AQI Index",
    euroAqi: "European AQI",
    aqiLabels: {
      good: "Good",
      moderate: "Moderate",
      unhealthySens: "Unhealthy for Sensitive Groups",
      unhealthy: "Unhealthy",
      veryUnhealthy: "Very Unhealthy",
      hazardous: "Hazardous"
    },
    errors: {
      fetch: "Could not retrieve weather data. Please try again.",
      general: "Failed to fetch data. Please check your connection or city name.",
      denied: "Location access denied. Please search manually.",
      noGeo: "Geolocation is not supported by your browser."
    }
  },
  es: {
    weather: "Clima",
    airQuality: "Calidad del Aire",
    humidity: "Humedad",
    wind: "Viento",
    feelsLike: "Sensación",
    summaryTitle: "Resumen del tiempo",
    hourly: "Pronóstico por hora",
    daily: "Pronóstico 7 días",
    loading: "Obteniendo datos...",
    searchPlaceholder: "Buscar ciudad...",
    requestTook: "La petición tomó",
    usAqi: "Índice AQI (EE.UU.)",
    euroAqi: "AQI Europeo",
    aqiLabels: {
      good: "Bueno",
      moderate: "Moderado",
      unhealthySens: "Insalubre para grupos sensibles",
      unhealthy: "Insalubre",
      veryUnhealthy: "Muy insalubre",
      hazardous: "Peligroso"
    },
    errors: {
      fetch: "No se pudieron obtener datos del clima. Inténtalo de nuevo.",
      general: "Error al obtener datos. Revisa tu conexión o el nombre de la ciudad.",
      denied: "Acceso a ubicación denegado. Busca manualmente.",
      noGeo: "Tu navegador no soporta geolocalización."
    }
  },
  fr: {
    weather: "Météo",
    airQuality: "Qualité de l'air",
    humidity: "Humidité",
    wind: "Vent",
    feelsLike: "Ressenti",
    summaryTitle: "Résumé météo",
    hourly: "Prévisions horaires",
    daily: "Prévisions 7 jours",
    loading: "Récupération des données...",
    searchPlaceholder: "Rechercher une ville...",
    requestTook: "Durée de la requête",
    usAqi: "Indice AQI (US)",
    euroAqi: "AQI Européen",
    aqiLabels: {
      good: "Bon",
      moderate: "Modéré",
      unhealthySens: "Malsain pour les groupes sensibles",
      unhealthy: "Malsain",
      veryUnhealthy: "Très malsain",
      hazardous: "Dangereux"
    },
    errors: {
      fetch: "Impossible de récupérer les données météo. Veuillez réessayer.",
      general: "Échec de la récupération des données. Vérifiez votre connexion.",
      denied: "Accès à la localisation refusé. Veuillez chercher manuellement.",
      noGeo: "La géolocalisation n'est pas supportée par votre navigateur."
    }
  },
  de: {
    weather: "Wetter",
    airQuality: "Luftqualität",
    humidity: "Feuchtigkeit",
    wind: "Wind",
    feelsLike: "Gefühlt",
    summaryTitle: "Wetterbericht",
    hourly: "Stündliche Vorhersage",
    daily: "7-Tage-Vorhersage",
    loading: "Daten werden geladen...",
    searchPlaceholder: "Stadt suchen...",
    requestTook: "Anfrage dauerte",
    usAqi: "US AQI Index",
    euroAqi: "Europäischer AQI",
    aqiLabels: {
      good: "Gut",
      moderate: "Mäßig",
      unhealthySens: "Unschädlich für empfindliche Gruppen",
      unhealthy: "Ungesund",
      veryUnhealthy: "Sehr ungesund",
      hazardous: "Gefährlich"
    },
    errors: {
      fetch: "Wetterdaten konnten nicht abgerufen werden. Bitte versuchen Sie es erneut.",
      general: "Fehler beim Abrufen der Daten. Bitte prüfen Sie Ihre Verbindung.",
      denied: "Standortzugriff verweigert. Bitte suchen Sie manuell.",
      noGeo: "Geolokalisierung wird von Ihrem Browser nicht unterstützt."
    }
  }
};

// --- Internal Components for Air Quality View ---

const PollutantCard = ({ label, value, unit, colorClass }: { label: string, value: number, unit: string, colorClass: string }) => (
    <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/5 flex flex-col items-center justify-center">
        <span className="text-slate-400 text-xs font-semibold uppercase mb-1">{label}</span>
        <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
        <span className="text-slate-500 text-[10px]">{unit}</span>
    </div>
);

const AirQualityView = ({ data, t }: { data: AirQualityData, t: any }) => {
    const getAQIStatus = (aqi: number) => {
        if (aqi <= 50) return { label: t.aqiLabels.good, color: "text-green-400", bg: "bg-green-500/20 border-green-500/50" };
        if (aqi <= 100) return { label: t.aqiLabels.moderate, color: "text-yellow-400", bg: "bg-yellow-500/20 border-yellow-500/50" };
        if (aqi <= 150) return { label: t.aqiLabels.unhealthySens, color: "text-orange-400", bg: "bg-orange-500/20 border-orange-500/50" };
        if (aqi <= 200) return { label: t.aqiLabels.unhealthy, color: "text-red-500", bg: "bg-red-500/20 border-red-500/50" };
        if (aqi <= 300) return { label: t.aqiLabels.veryUnhealthy, color: "text-purple-500", bg: "bg-purple-500/20 border-purple-500/50" };
        return { label: t.aqiLabels.hazardous, color: "text-rose-900", bg: "bg-rose-900/20 border-rose-900/50" };
    };

    const status = getAQIStatus(data.current.us_aqi);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Main AQI Display */}
            <div className={`backdrop-blur-md border rounded-3xl p-8 relative overflow-hidden shadow-2xl ${status.bg}`}>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <div className="flex items-center gap-2 text-slate-200 mb-2 justify-center md:justify-start">
                             <span className="uppercase tracking-wider text-sm font-semibold">{t.usAqi}</span>
                        </div>
                        <h2 className={`text-7xl md:text-8xl font-bold tracking-tighter ${status.color}`}>
                            {data.current.us_aqi}
                        </h2>
                        <p className={`text-2xl font-medium ${status.color} mt-2`}>{status.label}</p>
                         <p className="text-slate-300 mt-2 max-w-md text-sm">
                            {t.euroAqi}: <span className="font-bold text-white">{data.current.european_aqi}</span> (CAQI)
                        </p>
                    </div>
                    
                    {/* Gauge Visual (Simple CSS) */}
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[12px] border-white/10 flex items-center justify-center relative">
                        <div 
                            className={`absolute inset-0 rounded-full border-[12px] border-t-transparent border-l-transparent transform -rotate-45 ${status.color.replace('text-', 'border-')}`}
                            style={{ opacity: 0.8 }}
                        ></div>
                        <span className="text-3xl font-bold">AQI</span>
                    </div>
                </div>
            </div>

            {/* Pollutants Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <PollutantCard label="PM 2.5" value={data.current.pm2_5} unit="μg/m³" colorClass="text-blue-300" />
                <PollutantCard label="PM 10" value={data.current.pm10} unit="μg/m³" colorClass="text-blue-300" />
                <PollutantCard label="NO₂" value={data.current.no2} unit="μg/m³" colorClass="text-purple-300" />
                <PollutantCard label="Ozone (O₃)" value={data.current.o3} unit="μg/m³" colorClass="text-teal-300" />
                <PollutantCard label="SO₂" value={data.current.so2} unit="μg/m³" colorClass="text-yellow-300" />
                <PollutantCard label="CO" value={data.current.co} unit="μg/m³" colorClass="text-slate-300" />
            </div>

             {/* AQI Chart */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
                 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-green-400 rounded-full"></span>
                    24h AQI Forecast
                </h3>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.hourly}>
                             <defs>
                                <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="us_aqi" stroke="#4ade80" strokeWidth={3} fillOpacity={1} fill="url(#colorAqi)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---

function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'weather' | 'air'>('weather');
  const [searchDuration, setSearchDuration] = useState<number | null>(null);
  
  // Debug mode state
  const [debugClicks, setDebugClicks] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  // Language state
  const [currentLang, setCurrentLang] = useState('en');

  // Background gradient based on weather condition
  const getBackgroundClass = (condition: string = '') => {
    const c = condition.toLowerCase();
    
    // Rain/Storm/Drizzle
    if (c.match(/(rain|storm|drizzle|lluvia|tormenta|llovizna|pluie|orage|bruine|regen|gewitter|sprüh)/i)) {
        return 'from-slate-900 via-slate-800 to-blue-900';
    }
    // Clouds/Overcast/Fog
    if (c.match(/(cloud|overcast|fog|nublado|niebla|nuage|couvert|brouillard|bewölkt|bedeckt|nebel)/i)) {
        return 'from-slate-800 via-slate-700 to-gray-800';
    }
    // Snow/Ice
    if (c.match(/(snow|ice|nevada|hielo|neige|schnee|eis)/i)) {
        return 'from-slate-900 via-blue-900 to-indigo-900';
    }
    // Clear/Sun
    if (c.match(/(clear|sun|despejado|sol|dégagé|clair|sonne|klar)/i)) {
        return 'from-slate-900 via-blue-950 to-slate-900';
    }
    
    return 'from-slate-900 via-slate-900 to-slate-800'; 
  };

  const t = translations[currentLang] || translations['en'];

  const handleSearch = useCallback(async (location: string) => {
    setLoading(true);
    setError(null);
    setSearchDuration(null);
    const startTime = performance.now();
    
    try {
      // 1. Fetch Weather with current language
      const { data } = await fetchWeatherData(location, currentLang);
      
      if (data) {
        setWeather(data);

        // 2. Fetch AQI
        const aqData = await fetchAirQualityData(data.coordinates.lat, data.coordinates.lon);
        setAirQuality(aqData);
      } else {
        setError(t.errors.fetch);
      }
      
      const endTime = performance.now();
      setSearchDuration((endTime - startTime) / 1000);

    } catch (err) {
      console.error(err);
      setError(t.errors.general);
    } finally {
      setLoading(false);
    }
  }, [currentLang, t]);

  const handleLocate = useCallback(() => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const latLngString = `${latitude},${longitude}`;
          await handleSearch(latLngString);
        },
        (err) => {
          console.error(err);
          setError(t.errors.denied);
          setLoading(false);
        }
      );
    } else {
      setError(t.errors.noGeo);
    }
  }, [handleSearch, t]);

  const handleChartClick = () => {
    if (showDebug) return;
    const newCount = debugClicks + 1;
    setDebugClicks(newCount);
    if (newCount >= 10) {
        setShowDebug(true);
    }
  };

  // Detect language on mount
  useEffect(() => {
    const sysLang = navigator.language.split('-')[0];
    if (['en', 'es', 'fr', 'de'].includes(sysLang)) {
        setCurrentLang(sysLang);
    } else {
        setCurrentLang('en');
    }
    setMounted(true);
  }, []);

  // Initial search once language is set and component mounted
  useEffect(() => {
    if (mounted) {
        handleSearch("New York"); 
    }
  }, [mounted]); // Only run once when mounted becomes true (and language is set)

  if (!mounted) return null;

  const bgClass = weather ? getBackgroundClass(weather.current.condition) : 'from-slate-900 via-slate-900 to-slate-800';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgClass} transition-colors duration-1000 ease-in-out text-white p-4 md:p-8`}>
      
      {/* Header / Search */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <Thermometer className="w-6 h-6 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">WeatherNow</h1>
        </div>
        
        <div className="w-full md:max-w-md flex flex-col">
            <SearchBar 
                onSearch={handleSearch} 
                onLocate={handleLocate} 
                isLoading={loading} 
                placeholder={t.searchPlaceholder}
            />
            {searchDuration !== null && !loading && showDebug && (
                <div className="text-right text-xs text-blue-200/50 mt-1 font-mono px-2 animate-fade-in">
                    {t.requestTook} {searchDuration.toFixed(2)}s
                </div>
            )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-xl mb-6 backdrop-blur-md animate-fade-in">
            {error}
          </div>
        )}

        {loading && !weather && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-blue-200">{t.loading}</p>
          </div>
        )}

        {weather && (
          <div className={`transition-opacity duration-500 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            
            {/* View Toggle Tabs */}
            <div className="flex justify-center mb-8">
                <div className="bg-black/30 backdrop-blur-md p-1 rounded-full flex gap-1 border border-white/10">
                    <button 
                        onClick={() => setActiveTab('weather')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'weather' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        {t.weather}
                    </button>
                    <button 
                        onClick={() => setActiveTab('air')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'air' ? 'bg-green-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        {t.airQuality}
                    </button>
                </div>
            </div>

            {/* Location Header (Always Visible) */}
             <div className="text-center mb-6">
                 <div className="inline-flex items-center gap-2 text-blue-200 bg-white/5 px-4 py-1 rounded-full border border-white/10">
                    <MapPin className="w-4 h-4" />
                    <span className="uppercase tracking-wider text-sm font-semibold">{weather.location}</span>
                </div>
            </div>

            {activeTab === 'weather' ? (
                // --- Weather View ---
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl"></div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                                <div>
                                    <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-4">
                                        {Math.round(weather.current.temp_c)}°
                                    </h2>
                                    <div className="flex items-center gap-3 text-xl md:text-2xl font-medium text-blue-100">
                                        {getWeatherIcon(weather.current.condition, "w-8 h-8")}
                                        <span>{weather.current.condition}</span>
                                    </div>
                                </div>
                                <div className="mt-8 md:mt-0 grid grid-cols-2 gap-4 w-full md:w-auto">
                                    <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                                        <div className="flex items-center gap-2 text-slate-300 mb-1">
                                            <Droplets className="w-4 h-4" />
                                            <span className="text-xs uppercase">{t.humidity}</span>
                                        </div>
                                        <span className="text-lg font-semibold">{weather.current.humidity}</span>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                                        <div className="flex items-center gap-2 text-slate-300 mb-1">
                                            <Wind className="w-4 h-4" />
                                            <span className="text-xs uppercase">{t.wind}</span>
                                        </div>
                                        <span className="text-lg font-semibold">{weather.current.wind}</span>
                                    </div>
                                    {weather.current.feels_like !== undefined && (
                                        <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/5 col-span-2">
                                            <div className="flex items-center gap-2 text-slate-300 mb-1">
                                                <Thermometer className="w-4 h-4" />
                                                <span className="text-xs uppercase">{t.feelsLike}</span>
                                            </div>
                                            <span className="text-lg font-semibold">{weather.current.feels_like}°</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <h3 className="text-sm font-semibold text-blue-200 mb-2 uppercase tracking-wide">{t.summaryTitle}</h3>
                                <p className="text-blue-50 leading-relaxed max-w-2xl">{weather.summary}</p>
                            </div>
                        </div>

                        <div 
                            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl select-none"
                            onClick={handleChartClick}
                        >
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="w-2 h-6 bg-yellow-400 rounded-full"></span>
                                {t.hourly}
                            </h3>
                            <WeatherChart data={weather.hourly} />
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 h-full shadow-xl">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <span className="w-2 h-6 bg-blue-400 rounded-full"></span>
                                {t.daily}
                            </h3>
                            <div className="space-y-4">
                                {weather.daily.map((day, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
                                        <span className="w-16 font-medium text-slate-200 group-hover:text-white transition-colors">{day.day}</span>
                                        <div className="flex items-center gap-3 flex-1 justify-center">
                                            {getWeatherIcon(day.condition, "w-6 h-6 text-blue-300")}
                                            <span className="text-sm text-slate-400 hidden sm:block truncate max-w-[80px]">{day.condition}</span>
                                        </div>
                                        <div className="flex items-center gap-4 w-24 justify-end">
                                            <span className="font-bold">{Math.round(day.max_temp)}°</span>
                                            <span className="text-slate-500">{Math.round(day.min_temp)}°</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // --- Air Quality View ---
                <div className="max-w-4xl mx-auto">
                     {airQuality ? (
                        <AirQualityView data={airQuality} t={t} />
                     ) : (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
                            <p className="mt-4 text-slate-300">{t.loading}</p>
                        </div>
                     )}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
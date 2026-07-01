import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  CloudSun, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Compass, 
  Sun, 
  CloudRain, 
  Cloud, 
  Navigation,
  Sparkles,
  Info,
  Thermometer,
  Droplets,
  Wind,
  AlertCircle
} from 'lucide-react';
import { useFirebase } from '../FirebaseContext';

interface WeatherData {
  temp: number;
  tempMin: number;
  tempMax: number;
  feelsLike: number;
  humidity: number;
  description: string;
  iconCode: string;
  windSpeed: number;
  cityName: string;
  isDemo?: boolean;
}

export default function LogisticaView() {
  const { connectionMode, logistica } = useFirebase();
  const [activeView, setActiveView] = useState<'menu' | 'transporte' | 'clima'>('menu');

  // Weather state from real OpenWeatherMap API
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
        if (!apiKey) {
          throw new Error("Chave da API de Clima não configurada no .env (VITE_WEATHER_API_KEY).");
        }
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Campo%20Limpo%20Paulista,BR&units=metric&lang=pt_br&appid=${apiKey}`
        );
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Chave de API do OpenWeatherMap inválida ou expirada (Erro 401).");
          }
          throw new Error(`Erro de resposta da API de Clima: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        setWeatherData({
          temp: data.main?.temp ?? 0,
          tempMin: data.main?.temp_min ?? 0,
          tempMax: data.main?.temp_max ?? 0,
          feelsLike: data.main?.feels_like ?? 0,
          humidity: data.main?.humidity ?? 0,
          description: data.weather?.[0]?.description || 'clima indisponível',
          iconCode: data.weather?.[0]?.icon || '01d',
          windSpeed: data.wind?.speed ?? 0,
          cityName: data.name || 'Campo Limpo Paulista',
          isDemo: false
        });
      } catch (err: any) {
        console.warn("Erro ao carregar clima real, utilizando fallback demonstrativo:", err.message);
        setWeatherError(err.message || 'Falha ao conectar ao servidor de previsão do tempo.');
        
        // Fallback data
        setWeatherData({
          temp: 24.5,
          tempMin: 15,
          tempMax: 27.5,
          feelsLike: 25.0,
          humidity: 62,
          description: 'Céu limpo com poucas nuvens',
          iconCode: '02d',
          windSpeed: 3.2,
          cityName: 'Campo Limpo Paulista',
          isDemo: true
        });
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, []);

  // Helper to capitalize first letter of weather description
  const capitalizeText = (text: string) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  // Maps OpenWeatherMap codes to beautiful Lucide icons
  const getWeatherIcon = (iconCode: string) => {
    switch (iconCode) {
      case '01d':
      case '01n':
        return Sun;
      case '02d':
      case '02n':
        return CloudSun;
      case '03d':
      case '03n':
      case '04d':
      case '04n':
        return Cloud;
      case '09d':
      case '09n':
      case '10d':
      case '10n':
        return CloudRain;
      default:
        return CloudSun;
    }
  };

  // Human datetime parser
  const getReadableDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Não definido';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + 'h';
    } catch (_) {
      return dateStr;
    }
  };

  // Helper to pull just the time segment (HH:MM) from DATETIME data
  const getOnlyTime = (dateStr?: string) => {
    if (!dateStr) return 'Não definido';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Não definido';
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }) + 'h';
    } catch (_) {
      return 'Não definido';
    }
  };

  return (
    <div id="logistica-view-container" className="w-full max-w-4xl mx-auto space-y-6">
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: MENU SELECTION */}
        {activeView === 'menu' && (
          <motion.div
            key="logistica-menu"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col md:grid md:grid-cols-2 gap-5"
          >
            {/* Card 1: Transporte */}
            <div
              id="btn-logistica-transporte"
              onClick={() => setActiveView('transporte')}
              className="group bg-white rounded-3xl p-6 border border-gray-150 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-6 transform hover:-translate-y-1 active:translate-y-0 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                  <Car className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight group-hover:text-red-600 transition-colors">
                    Transporte e Rotas
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                    Endereços, horários e previsão de viagem detalhada até o sítio.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-red-500 transition-colors">
                <span>Visualizar Rotas</span>
                <span className="text-slate-300 group-hover:translate-x-1.5 transition-transform duration-300">&rarr;</span>
              </div>
            </div>

            {/* Card 2: Clima */}
            <div
              id="btn-logistica-clima"
              onClick={() => setActiveView('clima')}
              className="group bg-white rounded-3xl p-6 border border-gray-150 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-6 transform hover:-translate-y-1 active:translate-y-0 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-505 group-hover:text-white transition-colors duration-300">
                  <CloudSun className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight group-hover:text-amber-650 transition-colors">
                    Previsão do Tempo
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                    Acompanhe o clima previsto para os 4 dias da nossa hospedagem.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-amber-500 transition-colors">
                <span>Verificar Clima</span>
                <span className="text-slate-300 group-hover:translate-x-1.5 transition-transform duration-300">&rarr;</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: TRANSPORTE DETAIL MAP & TIMES */}
        {activeView === 'transporte' && (
          <motion.div
            key="logistica-transporte"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                id="btn-transporte-voltar"
                onClick={() => setActiveView('menu')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Menu
              </button>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Rotas de Campo Limpo Paulista
              </span>
            </div>

            {/* Simulated Travel Route Tracker */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden shadow-xs">
              <div className="absolute top-0 right-0 h-48 w-48 bg-slate-200/30 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Trajeto Atualizado</span>
                </div>
                <div className="px-3 py-1 bg-white/80 backdrop-blur-xs rounded-full border border-slate-250 text-[10px] font-bold text-slate-600 shadow-3xs flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-red-500 shrink-0" /> SP-332 Rota Central
                </div>
              </div>

              {/* Dotted Connection Map Pin Visualizer */}
              <div className="relative flex items-center justify-between w-full px-4 md:px-12 py-6 my-2 z-10">
                <div className="flex flex-col items-center gap-1.5 text-center relative z-20">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white text-slate-600 flex items-center justify-center border border-slate-200 shadow-sm">
                    <Compass className="h-5 w-5" />
                  </div>
                  <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-tight">Embarque (Partida)</span>
                </div>

                <div className="absolute left-[8%] right-[8%] md:left-[18%] md:right-[18%] top-[34px] md:top-[38px] flex items-center justify-center z-10 animate-pulse">
                  <div className="w-full border-t-[3px] border-dashed border-red-300" />
                  <div className="absolute bg-red-650 bg-red-650 bg-red-650 bg-red-600 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-full shadow-md select-none border border-red-500 tracking-wide uppercase">
                    Distância: {logistica?.distanciaKm || 65} KM
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1.5 text-center relative z-20">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-600 text-white flex items-center justify-center border-2 border-white shadow-md">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="text-[9.5px] font-black text-red-650 text-red-600 uppercase tracking-tight font-sans">Sítio Campo Limpo</span>
                </div>
              </div>
            </div>

            {/* Dynamic Ida & Volta Route details Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Ida Travel Details Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs text-left space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="h-8 w-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider leading-3">Viagem de Ida</h4>
                    <span className="text-xs font-black text-slate-800 tracking-tight block mt-0.5">
                      {logistica?.dataIda ? new Date(logistica.dataIda).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }) : 'Quinta-Feira, 18 de Nov'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <Compass className="h-3.5 w-3.5 text-slate-300" /> Ponto de Partida
                    </span>
                    <p className="text-[11.5px] font-extrabold text-slate-700 leading-normal pl-4.5 border-l border-slate-200">
                      {logistica?.enderecoPartida || 'Rua Paraibuna, 561 - Paineiras, São Paulo/SP'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-300" /> Embarque
                      </span>
                      <p className="text-xs font-black text-slate-800 pl-4">
                        {getOnlyTime(logistica?.dataIda) || '20:00h'}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3 text-red-400" /> Tempo de Viagem
                      </span>
                      <p className="text-xs font-black text-red-600 pl-4">
                        {logistica?.tempoEstimado || '1h 30m'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Volta Travel Details Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs text-left space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider leading-3">Retorno de Volta</h4>
                    <span className="text-xs font-black text-slate-800 tracking-tight block mt-0.5">
                      {logistica?.dataVolta ? new Date(logistica.dataVolta).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }) : 'Domingo, 21 de Nov'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <Compass className="h-3.5 w-3.5 text-slate-300" /> Endereço de Volta
                    </span>
                    <p className="text-[11.5px] font-extrabold text-slate-700 leading-normal pl-4.5 border-l border-slate-200">
                      {logistica?.enderecoDestino || 'Estrada Santa Clara, 435 - Estância São Paulo, Campo Limpo Paulista/SP'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-300" /> Saída do Sítio
                      </span>
                      <p className="text-xs font-black text-slate-800 pl-4">
                        {getOnlyTime(logistica?.dataVolta) || '15:00h'}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-300" /> Data e Hora Geral
                      </span>
                      <p className="text-xs font-black text-slate-800 pl-4 text-slate-700">
                        {logistica?.dataVolta ? new Date(logistica.dataVolta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '15:00h'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Informational Guidelines card */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-start gap-3 text-left">
              <Info className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10.5px] font-black uppercase text-slate-600 block tracking-wide">Diretrizes de Comboio & Viagem</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Consulte no aplicativo o horário oficial do embarque de ida ({getOnlyTime(logistica?.dataIda)}). O local de embarque é no endereço: <span className="font-extrabold text-slate-700">{logistica?.enderecoPartida}</span>.
                </p>
              </div>
            </div>

          </motion.div>
        )}

        {/* VIEW 3: CLIMATE DETAILS */}
        {activeView === 'clima' && (
          <motion.div
            key="logistica-clima"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                id="btn-clima-voltar"
                onClick={() => setActiveView('menu')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Menu
              </button>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                <Sparkles className="h-3 w-3 text-red-500" /> Previsão da Viagem
              </div>
            </div>

            {/* 3 Dedicated Weather Cards for Trip Days */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  date: 'Sexta, 20 Nov 2026',
                  weather: 'Nublado',
                  tempMin: 16,
                  tempMax: 25,
                  rainChance: 15,
                  icon: Cloud,
                  bgUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=600&q=80',
                  description: 'Céu encoberto com aberturas de sol à tarde. Ventos suaves e clima ideal para atividades ao ar livre.',
                },
                {
                  date: 'Sábado, 21 Nov 2026',
                  weather: 'Ensolarado',
                  tempMin: 18,
                  tempMax: 29,
                  rainChance: 5,
                  icon: Sun,
                  bgUrl: 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=600&q=80',
                  description: 'Sol brilhante o dia todo com poucas nuvens. Clima perfeito para desfrutar da piscina aquecida do sítio.',
                },
                {
                  date: 'Domingo, 22 Nov 2026',
                  weather: 'Chuva Leve',
                  tempMin: 17,
                  tempMax: 24,
                  rainChance: 70,
                  icon: CloudRain,
                  bgUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
                  description: 'Previsão de pancadas de chuva isoladas a partir da tarde. Clima mais ameno e úmido.',
                }
              ].map((day, idx) => {
                const IconComponent = day.icon;
                return (
                  <div 
                    key={idx}
                    className="relative rounded-3xl overflow-hidden border border-slate-700/55 min-h-[300px] flex flex-col justify-between p-5 text-white shadow-md shadow-neutral-950/20 group hover:scale-[1.02] transition-transform duration-300"
                    style={{
                      backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.35), rgba(15, 23, 42, 0.88)), url(${day.bgUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {/* Top Section */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-300 bg-slate-900/50 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-700/50">
                          {day.date}
                        </span>
                        <h4 className="text-xl font-black tracking-tight text-white mt-1.5 leading-tight">
                          {day.weather}
                        </h4>
                      </div>
                      <div className="p-2.5 bg-slate-900/70 backdrop-blur-xs rounded-xl border border-slate-700/50 text-white shrink-0 shadow-3xs group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="space-y-3 pt-6 text-left relative z-10">
                      <p className="text-[11.5px] text-slate-200/90 leading-relaxed font-semibold">
                        {day.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/40">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Temps Min/Max</span>
                          <span className="text-xs font-black text-white tracking-tight">
                            {day.tempMin}°C / {day.tempMax}°C
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Prob. Chuva</span>
                          <span className="text-xs font-black text-sky-400 tracking-tight flex items-center gap-0.5">
                            <Droplets className="h-3.5 w-3.5 text-sky-400 shrink-0" /> {day.rainChance}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Travel recommendation suggestions card */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3.5 text-left">
              <CloudSun className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase text-amber-400 block tracking-wide">Dicas de Vestuário</span>
                <p className="text-xs text-slate-300 font-bold leading-relaxed">
                  As noites serão bastante amenas / frias (mínimas perto de 16°C). Recomendamos muito levar jaquetas confortáveis para as noites no sítio, mas roupas leves para curtir o sol e a piscina aquecida durante as tardes de sexta e sábado!
                </p>
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

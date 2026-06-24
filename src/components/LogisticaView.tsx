import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import { useFirebase } from '../FirebaseContext';

export default function LogisticaView() {
  const { connectionMode, logistica } = useFirebase();
  const [activeView, setActiveView] = useState<'menu' | 'transporte' | 'clima'>('menu');

  // Hardcoded Forecast Days for climate
  const forecastDays = [
    {
      date: 'Qua, 18 de Nov',
      icon: CloudRain,
      max: '23°C',
      min: '14°C',
      description: 'Pancadas de chuva à tarde',
      color: 'bg-blue-50/60 border-blue-100 text-blue-600',
      tag: 'Chuva'
    },
    {
      date: 'Qui, 19 de Nov',
      icon: CloudSun,
      max: '25°C',
      min: '13°C',
      description: 'Sol com algumas nuvens',
      color: 'bg-amber-50/60 border-amber-100 text-amber-600',
      tag: 'Instável'
    },
    {
      date: 'Sex, 20 de Nov',
      icon: Sun,
      max: '27°C',
      min: '15°C',
      description: 'Ensolarado e agradável',
      color: 'bg-emerald-50/60 border-emerald-100 text-emerald-600',
      tag: 'Céu Limpo'
    },
    {
      date: 'Sáb, 21 de Nov',
      icon: Cloud,
      max: '22°C',
      min: '12°C',
      description: 'Nublado com leve névoa',
      color: 'bg-slate-50 border-slate-150 text-slate-650',
      tag: 'Nublado'
    }
  ];

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
                <Sparkles className="h-3 w-3 text-amber-500" /> Campo Limpo Paulista forecast
              </div>
            </div>

            {/* Warning: Mock/Example data */}
            <div className="bg-amber-50/60 border border-amber-120 text-amber-900 rounded-3xl p-4 flex items-start gap-3 shadow-3xs text-left">
              <div className="h-9 w-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 shrink-0">
                <CloudSun className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10.5px] font-black uppercase text-amber-800 block tracking-wider leading-none">Dados Demonstrativos / Exemplo</span>
                <p className="text-xs text-amber-700 font-semibold leading-relaxed font-sans">
                  As temperaturas exibidas são médias históricas preliminares locais para o mês de Novembro. Para medições e atualizações em tempo de execução real, sugere-se a integração de uma API de clima pública gratuita como <strong className="font-bold underline text-amber-950">OpenWeatherMap API</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {forecastDays.map((day, ix) => {
                const IconComp = day.icon;

                return (
                  <div 
                    key={ix}
                    className="bg-white rounded-3xl p-5 border border-gray-150 shadow-3xs hover:shadow-xs transition-all flex flex-col justify-between h-44 text-left"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                          {day.date}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${day.color}`}>
                          {day.tag}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                          <IconComp className="h-6 w-6 text-slate-755 text-slate-700" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xl font-black text-slate-800 tracking-tight leading-4">
                            {day.max}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 leading-3">
                            Min: {day.min}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-50">
                      <p className="text-[11px] font-bold text-slate-600 leading-snug">
                        {day.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Travel recommendation suggestions card */}
            <div className="bg-amber-50/45 border border-amber-100/80 rounded-2xl p-4 flex items-start gap-3 text-left">
              <CloudSun className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase text-amber-800 block tracking-wide">Dicas de Vestuário</span>
                <p className="text-xs text-amber-700 font-bold leading-relaxed">
                  As noites serão bastante amenas / frias (mínimas perto de 12°C). Recomendamos muito levar jaquetas confortáveis para as noites no sítio, mas roupas leves para curtir o sol e a piscina aquecida durante as tardes de sexta e sábado!
                </p>
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

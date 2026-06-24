import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { LogisticaInfo } from '../firebase';

interface AdminLogisticaProps {
  setActiveView: (view: 'menu' | 'logistica' | 'financeiro' | 'planilha' | 'pix') => void;
  logistica: LogisticaInfo | null;
  updateLogistica: (info: {
    dataIda: string;
    dataVolta: string;
    enderecoPartida: string;
    enderecoDestino: string;
    distanciaKm: number;
    tempoEstimado: string;
  }) => Promise<void>;
  triggerFeedback: (type: 'success' | 'error', msg: string) => void;
}

export default function AdminLogistica({
  setActiveView,
  logistica,
  updateLogistica,
  triggerFeedback
}: AdminLogisticaProps) {
  
  const [logIda, setLogIda] = useState(logistica?.dataIda || '');
  const [logVolta, setLogVolta] = useState(logistica?.dataVolta || '');
  const [logPartida, setLogPartida] = useState(logistica?.enderecoPartida || '');
  const [logDestino, setLogDestino] = useState(logistica?.enderecoDestino || '');
  const [logDistancia, setLogDistancia] = useState(logistica?.distanciaKm?.toString() || '65');
  const [logTempo, setLogTempo] = useState(logistica?.tempoEstimado || '1h 30m');

  useEffect(() => {
    if (logistica) {
      setLogIda(logistica.dataIda || '');
      setLogVolta(logistica.dataVolta || '');
      setLogPartida(logistica.enderecoPartida || '');
      setLogDestino(logistica.enderecoDestino || '');
      setLogDistancia(logistica.distanciaKm?.toString() || '65');
      setLogTempo(logistica.tempoEstimado || '1h 30m');
    }
  }, [logistica]);

  const handleSaveLogistica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logIda || !logVolta || !logPartida || !logDestino) {
      triggerFeedback('error', 'Por favor, preencha todos os campos obrigatórios da logística.');
      return;
    }
    try {
      await updateLogistica({
        dataIda: logIda,
        dataVolta: logVolta,
        enderecoPartida: logPartida,
        enderecoDestino: logDestino,
        distanciaKm: Number(logDistancia) || 0,
        tempoEstimado: logTempo || '1h 30m'
      });
      triggerFeedback('success', 'Logística da viagem atualizada com sucesso!');
    } catch (err: any) {
      console.error(err);
      triggerFeedback('error', `Erro ao salvar logística: ${err.message || err}`);
    }
  };

  return (
    <motion.div
      key="admin-logistica"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-5"
    >
      {/* Header / Voltar */}
      <div className="flex items-center justify-between">
        <button
          id="btn-logistica-voltar"
          onClick={() => setActiveView('menu')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
          Módulo Logística (Documento viagem_info)
        </span>
      </div>

      <form onSubmit={handleSaveLogistica} className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 space-y-6 text-left shadow-3xs">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Editar Localizações e Horários</h3>
          <p className="text-[11px] text-neutral-500 font-semibold leading-relaxed mt-0.5">
            Preencha os campos abaixo para sincronizar a rota no aplicativo geral de todos de forma real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Partida data */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] uppercase font-black tracking-wider text-slate-500">Data e Hora de Partida</label>
            <input
              type="datetime-local"
              value={logIda}
              onChange={(e) => setLogIda(e.target.value)}
              className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition"
              required
            />
          </div>

          {/* Retorno data */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] uppercase font-black tracking-wider text-slate-500">Data e Hora de Retorno</label>
            <input
              type="datetime-local"
              value={logVolta}
              onChange={(e) => setLogVolta(e.target.value)}
              className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition"
              required
            />
          </div>

          {/* Endereço Partida */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10.5px] uppercase font-black tracking-wider text-slate-500 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" /> Endereço de Partida
            </label>
            <input
              type="text"
              value={logPartida}
              onChange={(e) => setLogPartida(e.target.value)}
              className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition"
              placeholder="Ex: Rua Paraibuna, 561 - Paineiras, São Paulo/SP"
              required
            />
          </div>

          {/* Endereço Destino */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10.5px] uppercase font-black tracking-wider text-slate-500 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" /> Endereço do Sítio (Destino)
            </label>
            <input
              type="text"
              value={logDestino}
              onChange={(e) => setLogDestino(e.target.value)}
              className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition"
              placeholder="Ex: Estrada Santa Clara, 435 - Estância São Paulo, Campo Limpo Paulista/SP"
              required
            />
          </div>

          {/* Distância */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] uppercase font-black tracking-wider text-slate-500">Distância da Viagem (KM)</label>
            <input
              type="number"
              value={logDistancia}
              onChange={(e) => setLogDistancia(e.target.value)}
              className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition"
              placeholder="Ex: 65"
            />
          </div>

          {/* Tempo Estimado */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] uppercase font-black tracking-wider text-slate-500">Tempo Estimado</label>
            <input
              type="text"
              value={logTempo}
              onChange={(e) => setLogTempo(e.target.value)}
              className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition"
              placeholder="Ex: 1h 30m"
            />
          </div>

        </div>

        <div className="flex justify-end pt-3">
          <button
            id="btn-salvar-logistica"
            type="submit"
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black tracking-tight transition shadow-sm cursor-pointer"
          >
            Salvar Alterações
          </button>
        </div>
      </form>
    </motion.div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, QrCode } from 'lucide-react';

interface AdminPixProps {
  setActiveView: (view: 'menu' | 'logistica' | 'financeiro' | 'planilha' | 'pix') => void;
  pixKey: string;
  updatePixKey: (key: string) => Promise<void>;
  triggerFeedback: (type: 'success' | 'error', msg: string) => void;
}

export default function AdminPix({
  setActiveView,
  pixKey,
  updatePixKey,
  triggerFeedback
}: AdminPixProps) {

  const [localPix, setLocalPix] = useState(pixKey);

  useEffect(() => {
    if (pixKey) {
      setLocalPix(pixKey);
    }
  }, [pixKey]);

  const handleSavePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localPix.trim()) {
      triggerFeedback('error', 'A chave PIX não pode ser vazia.');
      return;
    }
    try {
      await updatePixKey(localPix.trim());
      triggerFeedback('success', 'Chave PIX atualizada no Firestore com sucesso!');
    } catch (err: any) {
      console.error(err);
      triggerFeedback('error', `Erro ao atualizar PIX: ${err.message || err}`);
    }
  };

  return (
    <motion.div
      key="admin-pix"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-5"
    >
      {/* Header / Voltar */}
      <div className="flex items-center justify-between">
        <button
          id="btn-pix-voltar"
          onClick={() => setActiveView('menu')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
          Coletas (Documento configuracoes/pagamento)
        </span>
      </div>

      <form onSubmit={handleSavePix} className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 space-y-5 text-left shadow-3xs">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Editar Chave PIX Oficial</h3>
          <p className="text-[11px] text-neutral-500 font-semibold leading-relaxed mt-0.5">
            Informe a chave Pix que os participantes devem utilizar para realizar os depósitos coletivos e as mensalidades da viagem.
          </p>
        </div>

        <div className="space-y-1.5 max-w-md">
          <label className="text-[10.5px] uppercase font-black tracking-wider text-slate-500 flex items-center gap-1">
            <QrCode className="h-3.5 w-3.5 text-slate-400 font-normal" /> Chave PIX da Coleta
          </label>
          <input
            type="text"
            value={localPix}
            onChange={(e) => setLocalPix(e.target.value)}
            className="w-full text-xs font-mono font-bold px-3.5 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-550 focus:bg-white transition"
            placeholder="Ex: yan.turismo@viagemgrupo.com ou e-mail/celular"
            required
          />
          <span className="text-[9.5px] text-neutral-400 font-semibold block leading-normal mt-1">
            Dica: Você pode inserir uma chave de e-mail, telefone, CPF, ou chave aleatória tradicional.
          </span>
        </div>

        <div className="flex justify-end pt-3">
          <button
            id="btn-salvar-pix"
            type="submit"
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black tracking-tight transition shadow-sm cursor-pointer"
          >
            Salvar Chave Pix
          </button>
        </div>
      </form>
    </motion.div>
  );
}

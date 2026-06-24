import React, { useState } from 'react';
import { useFirebase } from '../FirebaseContext';
import { FileCheck, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export const EnviarComprovanteForm: React.FC = () => {
  const { users, addPagamento } = useFirebase();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const [mesRef, setMesRef] = useState<string>('Janeiro 2025');
  const [comprovanteUrl, setComprovanteUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const meses = [
    'Janeiro 2025', 'Fevereiro 2025', 'Março 2025', 'Abril 2025', 'Maio 2025', 'Junho 2025',
    'Julho 2025', 'Agosto 2025', 'Setembro 2025', 'Outubro 2025', 'Novembro 2025', 'Dezembro 2025',
    'Janeiro 2026', 'Fevereiro 2026', 'Março 2026', 'Abril 2026', 'Maio 2026', 'Junho 2026',
    'Julho 2026', 'Agosto 2026', 'Setembro 2026', 'Outubro 2026', 'Novembro 2026'
  ];

  const sortedUsers = [...(users || [])].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedUserId) {
      setFeedback({ type: 'error', message: 'Selecione seu nome antes de enviar o comprovante.' });
      return;
    }

    const parsedValor = parseFloat(valor);
    if (isNaN(parsedValor) || parsedValor <= 0) {
      setFeedback({ type: 'error', message: 'Por favor, insira um valor válido de pagamento.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await addPagamento(parsedValor, mesRef, comprovanteUrl, selectedUserId);
      setFeedback({ 
        type: 'success', 
        message: `Comprovante de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsedValor)} enviado para homologação do coordenador!` 
      });
      setValor('');
      setComprovanteUrl('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao enviar comprovante de pagamento.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs space-y-4 text-left">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <FileCheck className="h-5 w-5 text-red-600" />
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Enviar Comprovante</h3>
          <p className="text-[10px] text-slate-400 font-medium">Informe os depósitos efetuados para atualizar suas parcelas.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {feedback && (
          <div className={`p-3 rounded-2xl text-xs flex gap-2.5 items-start ${
            feedback.type === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' : 'bg-rose-50 border border-rose-100 text-rose-800'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p className="font-semibold">{feedback.message}</p>
          </div>
        )}

        {/* Selecione seu Nome Field */}
        <div className="space-y-1.5">
          <label className="text-[9.5px] uppercase font-black tracking-wider text-slate-400">Selecione seu Nome</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
            className="w-full bg-slate-50 border border-gray-200 focus:border-red-650 focus:ring-1 focus:ring-red-650/30 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden transition cursor-pointer"
          >
            <option value="">-- Selecione seu nome da lista --</option>
            {sortedUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Valor Input */}
          <div className="space-y-1.5">
            <label className="text-[9.5px] uppercase font-black tracking-wider text-slate-400">Valor Pago</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-50 border border-gray-200 focus:border-red-600 focus:ring-1 focus:ring-red-600/30 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 outline-hidden transition"
              />
            </div>
          </div>

          {/* Mês Referência Select */}
          <div className="space-y-1.5">
            <label className="text-[9.5px] uppercase font-black tracking-wider text-slate-400">Mês de Referência</label>
            <select
              value={mesRef}
              onChange={(e) => setMesRef(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 focus:border-red-600 focus:ring-1 focus:ring-red-600/30 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-hidden transition cursor-pointer"
            >
              {meses.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Comprovante Link Input */}
        <div className="space-y-1.5">
          <label className="text-[9.5px] uppercase font-black tracking-wider text-slate-400">Linha Digitável / Link do Comprovante</label>
          <input
            type="text"
            value={comprovanteUrl}
            onChange={(e) => setComprovanteUrl(e.target.value)}
            placeholder="Chave de transação, link ou ID do comprovante"
            className="w-full bg-slate-50 border border-gray-200 focus:border-red-600 focus:ring-1 focus:ring-red-600/30 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-hidden transition"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-black tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer select-none"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isSubmitting ? 'Enviando...' : 'Registrar Comprovante'}
        </button>
      </form>
    </div>
  );
};

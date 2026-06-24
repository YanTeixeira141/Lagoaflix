import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Table, 
  TrendingUp, 
  DollarSign, 
  QrCode, 
  Copy, 
  Users, 
  CalendarCheck 
} from 'lucide-react';
import { useFirebase } from '../FirebaseContext';
import { EnviarComprovanteForm } from './EnviarComprovanteForm';

export default function FinanceiroView() {
  const { 
    users, 
    pagamentos, 
    gastos, 
    pixKey,
    currentUser,
    linkUserProfile
  } = useFirebase();

  // Public views: 'planilha' (Expense spreadsheet) or 'ranking' (Participant list & leaderboard)
  const [activeView, setActiveView] = useState<'planilha' | 'ranking'>('planilha');
  const [copiedPix, setCopiedPix] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState('');

  // Grouping despesas
  const filterAndSumByCategory = (cat: 'Moradia' | 'Transporte' | 'Alimentação' | 'Outros') => {
    const list = gastos.filter(g => g.categoria === cat);
    const sum = list.reduce((acc, curr) => acc + (curr.valor || 0), 0);
    return { list, sum };
  };

  const moradia = filterAndSumByCategory('Moradia');
  const transporte = filterAndSumByCategory('Transporte');
  const alimentacao = filterAndSumByCategory('Alimentação');
  const outros = filterAndSumByCategory('Outros');

  const totalGeralGastos = moradia.sum + transporte.sum + alimentacao.sum + outros.sum;
  const activeUsersCount = users.length || 1;
  const quotaPerPerson = totalGeralGastos / activeUsersCount;

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatQty = (qty: number | undefined) => {
    const q = qty !== undefined ? qty : 1;
    return q.toString().replace('.', ',');
  };

  return (
    <div id="financeiro_view_container" className="w-full space-y-6">
      
      {/* 1. FINANCIAL SUMMARY BADGES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Total Cost card */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 text-left flex items-center justify-between shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-red-650/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-1 relative z-10">
            <span className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">Custo Geral Total</span>
            <p className="text-2xl font-black tracking-tight">{formatBRL(totalGeralGastos)}</p>
            <p className="text-[10px] text-slate-400 font-medium">Soma de todas as despesas da planilha.</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 z-10">
            <TrendingUp className="h-5.5 w-5.5 text-red-500" />
          </div>
        </div>

        {/* Quota card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-150 text-left flex items-center justify-between shadow-3xs">
          <div className="space-y-1">
            <span className="text-[9.5px] uppercase font-bold text-neutral-400 tracking-wider">Cota por Participante</span>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{formatBRL(quotaPerPerson)}</p>
            <p className="text-[10px] text-neutral-400 font-medium">Dividido igualmente entre {activeUsersCount} pessoas.</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-red-50 text-red-650 text-red-600 flex items-center justify-center shrink-0">
            <DollarSign className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Total Arrecadado card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-150 text-left flex items-center justify-between shadow-3xs sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-[9.5px] uppercase font-bold text-neutral-400 tracking-wider">Total Arrecadado</span>
            <p className="text-2xl font-black text-emerald-600 tracking-tight">
              {formatBRL(users.reduce((acc, curr) => acc + (curr.totalPago || 0), 0))}
            </p>
            <p className="text-[10px] text-neutral-400 font-medium">Comprovantes aprovados pela organização.</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="h-5.5 w-5.5" />
          </div>
        </div>

      </div>

      {/* 2. DYNAMIC SUB-TABS TO TOGGLE VIEWS */}
      <div className="flex bg-neutral-100 border border-neutral-200/50 rounded-2xl p-1 relative max-w-sm mx-auto">
        <button
          onClick={() => setActiveView('planilha')}
          className={`flex-1 py-2 text-xs font-black tracking-wider uppercase rounded-xl transition cursor-pointer select-none ${
            activeView === 'planilha' ? 'bg-white text-slate-800 shadow-3xs font-black' : 'text-slate-450 text-slate-500 hover:text-slate-700'
          }`}
        >
          📊 Planilha Geral
        </button>
        <button
          onClick={() => setActiveView('ranking')}
          className={`flex-1 py-2 text-xs font-black tracking-wider uppercase rounded-xl transition cursor-pointer select-none ${
            activeView === 'ranking' ? 'bg-white text-slate-800 shadow-3xs font-black' : 'text-slate-450 text-slate-500 hover:text-slate-700'
          }`}
        >
          🏆 Ranking Pago
        </button>
      </div>

      {/* 3. CORE PUBLIC VIEW MATRICES */}
      <AnimatePresence mode="wait">
        
        {/* VIEW A: EXPENSE TABLES LIST */}
        {activeView === 'planilha' && (
          <motion.div
            key="pub-planilha"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Category: Moradia */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 flex flex-col justify-between min-h-[220px] text-left shadow-3xs">
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">🏠 Moradia</h3>
                  <span className="text-xs font-black text-red-650 text-red-600">{formatBRL(moradia.sum)}</span>
                </div>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {moradia.list.map((g) => (
                    <div key={g.id} className="flex justify-between items-center text-xs text-slate-600">
                      <span className="truncate max-w-[200px]" title={g.descricao}>
                        {g.descricao} <span className="text-slate-400 font-normal">({formatQty(g.quantidade)}x)</span>
                      </span>
                      <span className="font-extrabold text-slate-800">{formatBRL(g.valor)}</span>
                    </div>
                  ))}
                  {moradia.list.length === 0 && (
                    <p className="text-slate-400 italic text-[11px] py-2">Nenhum custo registrado.</p>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 mt-4 flex justify-between text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <span>Subtotal Moradia</span>
                <span className="text-slate-800 font-extrabold">{formatBRL(moradia.sum)}</span>
              </div>
            </div>

            {/* Category: Transporte */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 flex flex-col justify-between min-h-[220px] text-left shadow-3xs">
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">🚗 Transporte</h3>
                  <span className="text-xs font-black text-red-650 text-red-600">{formatBRL(transporte.sum)}</span>
                </div>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {transporte.list.map((g) => (
                    <div key={g.id} className="flex justify-between items-center text-xs text-slate-600">
                      <span className="truncate max-w-[200px]" title={g.descricao}>
                        {g.descricao} <span className="text-slate-400 font-normal">({formatQty(g.quantidade)}x)</span>
                      </span>
                      <span className="font-extrabold text-slate-800">{formatBRL(g.valor)}</span>
                    </div>
                  ))}
                  {transporte.list.length === 0 && (
                    <p className="text-slate-400 italic text-[11px] py-2">Nenhum custo registrado.</p>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 mt-4 flex justify-between text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <span>Subtotal Transporte</span>
                <span className="text-slate-800 font-extrabold">{formatBRL(transporte.sum)}</span>
              </div>
            </div>

            {/* Category: Alimentação */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 flex flex-col justify-between min-h-[220px] text-left shadow-3xs">
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">🥩 Alimentação</h3>
                  <span className="text-xs font-black text-red-650 text-red-600">{formatBRL(alimentacao.sum)}</span>
                </div>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {alimentacao.list.map((g) => (
                    <div key={g.id} className="flex justify-between items-center text-xs text-slate-600">
                      <span className="truncate max-w-[200px]" title={g.descricao}>
                        {g.descricao} <span className="text-slate-400 font-normal">({formatQty(g.quantidade)}x)</span>
                      </span>
                      <span className="font-extrabold text-slate-800">{formatBRL(g.valor)}</span>
                    </div>
                  ))}
                  {alimentacao.list.length === 0 && (
                    <p className="text-slate-400 italic text-[11px] py-2">Nenhum custo registrado.</p>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 mt-4 flex justify-between text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <span>Subtotal Alimentação</span>
                <span className="text-slate-800 font-extrabold">{formatBRL(alimentacao.sum)}</span>
              </div>
            </div>

            {/* Category: Outros */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 flex flex-col justify-between min-h-[220px] text-left shadow-3xs">
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">🎟️ Outros</h3>
                  <span className="text-xs font-black text-red-650 text-red-600">{formatBRL(outros.sum)}</span>
                </div>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {outros.list.map((g) => (
                    <div key={g.id} className="flex justify-between items-center text-xs text-slate-600">
                      <span className="truncate max-w-[200px]" title={g.descricao}>
                        {g.descricao} <span className="text-slate-400 font-normal">({formatQty(g.quantidade)}x)</span>
                      </span>
                      <span className="font-extrabold text-slate-800">{formatBRL(g.valor)}</span>
                    </div>
                  ))}
                  {outros.list.length === 0 && (
                    <p className="text-slate-400 italic text-[11px] py-2">Nenhum custo registrado.</p>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 mt-4 flex justify-between text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <span>Subtotal Outros</span>
                <span className="text-slate-800 font-extrabold">{formatBRL(outros.sum)}</span>
              </div>
            </div>

          </motion.div>
        )}

        {/* VIEW B: GUEST RANKING LIST */}
        {activeView === 'ranking' && (
          <motion.div
            key="pub-ranking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 text-left shadow-3xs space-y-5"
          >
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Leaderboard de Contribuições</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Ranking atualizado em tempo real de quitação individual da viagem LagoaFlix.</p>
            </div>

            <div className="space-y-3.5">
              {users
                .sort((a, b) => (b.totalPago || 0) - (a.totalPago || 0))
                .map((user, index) => {
                  const percent = Math.min(((user.totalPago || 0) / quotaPerPerson) * 100, 100);
                  const fullyPaid = user.totalPago && user.totalPago >= quotaPerPerson;

                  return (
                    <div 
                      key={user.id} 
                      className="border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-gray-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400 w-6 text-right">#{index + 1}</span>
                        <div className="h-8.5 w-8.5 rounded-full bg-red-100 text-red-600 font-extrabold text-xs flex items-center justify-center uppercase font-sans">
                          {(user.nome || 'Convidado').charAt(0)}
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 block leading-tight">{user.nome || 'Convidado'}</span>
                          <span className={`text-[8.5px] uppercase font-black tracking-wider ${
                            fullyPaid ? 'text-emerald-500' : 'text-amber-500'
                          }`}>
                            {fullyPaid ? 'Meta Mínima Quitada' : 'Em arrecadação'}
                          </span>
                        </div>
                      </div>

                      {/* Progress slider bar indicator */}
                      <div className="flex-1 max-w-xs hidden md:block">
                        <div className="h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              fullyPaid ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 font-semibold block text-right mt-1">
                          {percent.toFixed(0)}% da meta de {formatBRL(quotaPerPerson)}
                        </span>
                      </div>

                      <div className="text-right flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className="text-xs font-black text-slate-800 bg-white border border-gray-200 shadow-2xs px-3 py-1 rounded-xl">
                          {formatBRL(user.totalPago || 0)}
                        </span>
                        {fullyPaid && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2.5 py-0.5 rounded-full border border-emerald-100" title="Meta Coberta!">
                            ✓ Pago
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* 2.5 DYNAMIC RECEIPT UPLOADER CARD (FULL WIDTH) */}
      <div id="comprovantes-upload-grid" className="w-full">
        {/* Receipt Form Segment */}
        <EnviarComprovanteForm />
      </div>

      {/* 4. ALWAYS VISIBLE PUBLIC PIX METRIC ACTION CARD */}
      <div className="bg-[#fafbff] border border-blue-100/80 rounded-3xl p-6 text-left flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 h-32 w-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-1.5 relative z-10 max-w-lg">
          <div className="flex items-center gap-1.5">
            <QrCode className="h-4.5 w-4.5 text-blue-500 shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Coleta Centralizada Pix</h3>
          </div>
          <h4 className="text-sm font-extrabold text-slate-800 leading-snug">Chave Única do Sítio LagoaFlix</h4>
          <p className="text-xs text-slate-500 leading-normal font-medium">
            Envie depósitos e doações para as despesas do sítio de forma rápida. Lembre-se de enviar o extrato para Yan no privado para homologação.
          </p>
        </div>

        <div className="space-y-3 shrink-0 md:w-64">
          <div className="bg-white border-2 border-dashed border-blue-100/80 rounded-2xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Chave Oficial do Grupo</span>
            <span className="text-xs font-mono font-black text-slate-700 block truncate mt-1">
              {pixKey || 'Não cadastrada'}
            </span>
          </div>

          <button
            onClick={copyPixKey}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black tracking-tight transition flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none"
          >
            <Copy className="h-3.5 w-3.5" />
            {copiedPix ? 'Chave Copiada!' : 'Copiar Chave Pix'}
          </button>
        </div>
      </div>

    </div>
  );
}

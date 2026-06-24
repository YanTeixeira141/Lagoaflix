import React from 'react';
import { motion } from 'motion/react';
import { 
  Lock, 
  Calendar, 
  Users, 
  FileSpreadsheet, 
  QrCode, 
  ShieldCheck 
} from 'lucide-react';
import { Gasto, UserProfile, LogisticaInfo } from '../firebase';

interface AdminMenuProps {
  setActiveView: (view: 'menu' | 'logistica' | 'financeiro' | 'planilha' | 'pix') => void;
  users: UserProfile[];
  gastos: Gasto[];
  logistica: LogisticaInfo | null;
  pixKey: string;
  totalInExpenses: number;
  quotaPerPerson: number;
}

export default function AdminMenu({
  setActiveView,
  users,
  gastos,
  logistica,
  pixKey,
  totalInExpenses,
  quotaPerPerson
}: AdminMenuProps) {
  
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const listContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  return (
    <motion.div
      key="admin-menu"
      variants={listContainerVariants}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="text-left space-y-1">
        <span className="text-[10px] bg-red-50 text-red-600 font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-red-100">
          Painel Administrativo
        </span>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mt-2 flex items-center gap-1.5">
          <Lock className="h-5 w-5 text-red-600" />
          Coordenação de Viagem
        </h2>
        <p className="text-xs text-neutral-500 font-medium leading-relaxed">
          Acesse módulos restritos para controlar finanças, autorizar Pix comprovantes, alterar logística e delegar permissões da LagoaFlix.
        </p>
      </div>

      {/* Grid of 5 Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Card 1: Logística */}
        <motion.div
          id="btn-admin-logistica"
          variants={itemVariants}
          onClick={() => setActiveView('logistica')}
          className="group bg-white rounded-3xl p-5 border border-gray-150 hover:border-red-200 shadow-3xs hover:shadow-xs cursor-pointer transition-all hover:-translate-y-1 active:translate-y-0 text-left flex flex-col justify-between min-h-[224px]"
        >
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 group-hover:text-red-650 transition-colors">
                Logística e Transporte
              </h3>
              <p className="text-[11px] text-neutral-400 font-semibold leading-relaxed mt-0.5">
                Altere as datas, horários e pontos de partida ou destino do sítio.
              </p>
            </div>
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-2 text-[10px] font-semibold text-slate-700">
              📍 <span className="font-bold text-red-700">Destino:</span> {logistica?.enderecoDestino ? (logistica.enderecoDestino.split(',')[1] || logistica.enderecoDestino).trim() : 'Campo Limpo Paulista - SP'}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-red-500 duration-300">
              Gerenciar Rota &rarr;
            </span>
            <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black tracking-tight group-hover:bg-red-700 transition">
              Editar
            </span>
          </div>
        </motion.div>

        {/* Card 2: Financeiro */}
        <motion.div
          id="btn-admin-financeiro"
          variants={itemVariants}
          onClick={() => setActiveView('financeiro')}
          className="group bg-white rounded-3xl p-5 border border-gray-150 hover:border-emerald-200 shadow-3xs hover:shadow-xs cursor-pointer transition-all hover:-translate-y-1 active:translate-y-0 text-left flex flex-col justify-between min-h-[224px]"
        >
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 group-hover:text-emerald-650 transition-colors">
                Financeiro (Participantes)
              </h3>
              <p className="text-[11px] text-neutral-400 font-semibold leading-relaxed mt-0.5">
                Controle de pagamentos de parcelas e aprove comprovantes emitidos.
              </p>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2 text-[10px] font-semibold text-slate-700">
              👥 <span className="font-bold text-emerald-700">Participantes:</span> {users.length} • <span className="font-bold text-emerald-700">Cota:</span> {formatBRL(quotaPerPerson)}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-emerald-500 duration-300">
              Ver Depósitos &rarr;
            </span>
            <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black tracking-tight group-hover:bg-emerald-700 transition">
              Editar
            </span>
          </div>
        </motion.div>

        {/* Card 3: Planilha (Gastos) */}
        <motion.div
          id="btn-admin-planilha"
          variants={itemVariants}
          onClick={() => setActiveView('planilha')}
          className="group bg-white rounded-3xl p-5 border border-gray-150 hover:border-purple-200 shadow-3xs hover:shadow-xs cursor-pointer transition-all hover:-translate-y-1 active:translate-y-0 text-left flex flex-col justify-between min-h-[224px]"
        >
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 group-hover:text-purple-650 transition-colors">
                Planilha (Gastos)
              </h3>
              <p className="text-[11px] text-neutral-400 font-semibold leading-relaxed mt-0.5">
                CRUD de despesas com cálculo dinâmico do custo individual.
              </p>
            </div>
            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-2 text-[10px] font-semibold text-slate-700">
              💰 <span className="font-bold text-purple-700">Gastos Totais:</span> {formatBRL(totalInExpenses)}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-purple-500 duration-300">
              Cadastrar Contas &rarr;
            </span>
            <span className="px-3 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-black tracking-tight group-hover:bg-purple-700 transition">
              Editar
            </span>
          </div>
        </motion.div>

        {/* Card 4: Chave PIX */}
        <motion.div
          id="btn-admin-pix"
          variants={itemVariants}
          onClick={() => setActiveView('pix')}
          className="group bg-white rounded-3xl p-5 border border-gray-150 hover:border-amber-200 shadow-3xs hover:shadow-xs cursor-pointer transition-all hover:-translate-y-1 active:translate-y-0 text-left flex flex-col justify-between min-h-[224px]"
        >
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-550 group-hover:text-white transition-colors duration-300">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 group-hover:text-amber-605 transition-colors">
                Chave PIX Coleta
              </h3>
              <p className="text-[11px] text-neutral-400 font-semibold leading-relaxed mt-0.5">
                Edite as chaves oficiais do Pix visíveis nas abas públicas para cópia rápido.
              </p>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-2 text-[10px] font-mono font-semibold text-slate-700 truncate">
              🔑 <span className="font-sans font-bold text-amber-700">Chave:</span> {pixKey || 'Não cadastrada'}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-amber-600 duration-300">
              Chave Bancária &rarr;
            </span>
            <span className="px-3 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-black tracking-tight group-hover:bg-amber-600 transition">
              Editar
            </span>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

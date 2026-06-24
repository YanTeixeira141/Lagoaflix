import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseContext';
import { ParticipantProfile, UserProfile } from './firebase';
import { motion, AnimatePresence } from 'motion/react';
import FinanceiroView from './components/FinanceiroView';
import LogisticaView from './components/LogisticaView';
import AdminView from './components/AdminView';
import { 
  LogOut, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Plane, 
  CheckCircle2, 
  Clock, 
  Copy, 
  QrCode, 
  Lock, 
  Unlock,
  UserCheck, 
  FileText, 
  ShieldAlert, 
  Sparkles,
  X,
  User
} from 'lucide-react';

export default function App() {
  const { 
    connectionMode, 
    currentUser, 
    isAuthLoading, 
    errorMsg,
    clearError,
    pixKey,
    users,
    isAdminUnlocked,
    unlockAdmin,
    logoutAdmin
  } = useFirebase();

  const [passwordInput, setPasswordInput] = useState('');

  // Active Tab state for public/admin navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'financeiro' | 'logistica' | 'admin'>('dashboard');

  // Loading Screen (Styled using clean elegant typography)
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 border-4 border-red-650/20 border-t-red-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-black text-slate-400 tracking-widest uppercase animate-pulse">Sincronizando LagoaFlix...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col md:pb-0 select-none pb-20 selection:bg-red-100 selection:text-red-900">
      
      {/* 1. DYNAMIC HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-150 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Brand Segment */}
          <div className="flex items-center gap-2.5 text-left">
            <div className="h-9 w-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-xs shrink-0 select-none">
              <Plane className="h-5 w-5 transform -rotate-12" />
            </div>
            <div>
              <h1 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-3 font-sans">Campo Limpo Paulista - SP</h1>
              <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase mt-0.5">AMIGOS EM GRUPO • LAGOAFLIX</p>
            </div>
          </div>

          {/* User Status / Discrete Padlock Trigger */}
          <div className="flex items-center gap-2">
            
            {/* Active Admin Indicator */}
            {isAdminUnlocked ? (
              <div id="logged-admin-badge" className="flex items-center gap-2 bg-red-100 border border-red-200 text-red-700 rounded-full px-3 py-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-red-650 animate-pulse shrink-0" />
                <span className="text-[10px] font-bold text-red-700 tracking-tight block max-w-[100px] truncate">
                  Coord: {currentUser?.nome || 'Admin'}
                </span>
                
                {/* Logout Trigger */}
                <button
                  onClick={() => {
                    logoutAdmin();
                    setActiveTab('dashboard');
                  }}
                  className="p-1 hover:bg-red-200 rounded-full text-slate-500 hover:text-red-700 transition cursor-pointer"
                  title="Sair do Modo Admin"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              </div>
            ) : (
              /* Discrete Security Padlock Button to authenticate - switches to admin tab */
              <button
                onClick={() => {
                  setActiveTab('admin');
                }}
                className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100`}
                title="Acesso Administrativo (Coordenadores Only)"
              >
                <Lock className="h-4.5 w-4.5" />
              </button>
            )}

          </div>

        </div>
      </header>

      {/* 2. ERROR DISPLAY TOAST */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-4xl mx-auto px-4 mt-4"
          >
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl text-xs flex items-start justify-between gap-3 shadow-3xs">
              <div className="flex items-start gap-2.5 text-left">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-extrabold block text-slate-800">Acesso Restrito</span>
                  <p className="font-semibold text-rose-700">{errorMsg}</p>
                </div>
              </div>
              <button 
                onClick={clearError}
                className="p-1 hover:bg-rose-100 rounded-lg text-rose-500 transition cursor-pointer"
                title="Fechar Notificação"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN TAB ROUTER SWITCH */}
      <main className="flex-1 px-4 py-6 max-w-4xl w-full mx-auto space-y-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'financeiro' && <FinanceiroView />}
        {activeTab === 'logistica' && <LogisticaView />}
        {activeTab === 'admin' && (
          isAdminUnlocked ? (
            <AdminView />
          ) : (
            <div className="max-w-md mx-auto bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden my-6">
              <div className="absolute top-0 right-0 h-32 w-32 bg-red-650/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-neutral-850 text-red-500 border border-neutral-800 flex items-center justify-center">
                  <Lock className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white">Módulo de Edição Restrito</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Digite a senha administrativa do LagoaFlix para destravar os recursos de coordenação.
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (passwordInput.trim()) {
                    const success = unlockAdmin(passwordInput);
                    if (success) {
                      setPasswordInput('');
                    }
                  }
                }}
                className="space-y-4"
              >
                <div className="relative">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (errorMsg) clearError();
                    }}
                    placeholder="Senha de edição"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600 focus:ring-1 focus:ring-red-600/30 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 outline-hidden transition text-center"
                  />
                </div>

                {errorMsg && (
                  <p className="text-[11px] font-bold text-red-500 leading-snug">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Destrancar Painel
                </button>
              </form>
            </div>
          )
        )}
      </main>

      {/* 4. DYNAMIC BOTTOM MOBILE-FIRST NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-150 py-2 sm:py-3 px-4 shadow-lg md:relative md:border-t md:border-b md:shadow-none md:bg-white md:rounded-3xl md:max-w-md md:mx-auto md:mb-6 md:px-6">
        <div className="flex items-center justify-around md:gap-4 select-none">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1.5 transition text-[10px] font-extrabold tracking-tight cursor-pointer ${
              activeTab === 'dashboard' ? 'text-red-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            🗺️ <span className="uppercase block text-[9px] font-black tracking-wider font-sans mt-0.5">Painel</span>
          </button>

          <button
            onClick={() => setActiveTab('financeiro')}
            className={`flex flex-col items-center gap-1.5 transition text-[10px] font-extrabold tracking-tight cursor-pointer ${
              activeTab === 'financeiro' ? 'text-red-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            💳 <span className="uppercase block text-[9px] font-black tracking-wider font-sans mt-0.5">Financeiro</span>
          </button>

          <button
            onClick={() => setActiveTab('logistica')}
            className={`flex flex-col items-center gap-1.5 transition text-[10px] font-extrabold tracking-tight cursor-pointer ${
              activeTab === 'logistica' ? 'text-red-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            🚗 <span className="uppercase block text-[9px] font-black tracking-wider font-sans mt-0.5">Logística</span>
          </button>

          {/* Always accessible "Edição" tab, locks behavior inside router */}
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-1.5 transition text-[10px] font-extrabold tracking-tight cursor-pointer ${
              activeTab === 'admin' ? 'text-red-650 text-red-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>{isAdminUnlocked ? '📝' : '🔒'}</span>
            <span className="uppercase block text-[9px] font-black tracking-wider font-sans mt-0.5">Edição</span>
          </button>

        </div>
      </nav>

      {/* 5. GUEST FOOTER CREDIT GATES DETALHADO */}
      <footer className="py-6 text-center shrink-0 border-t border-slate-100 bg-white/20">
        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest select-none flex items-center justify-center gap-2">
          <span>LagoaFlix • Painel Público</span>
          <span>•</span>
          <button 
            onClick={() => {
              setActiveTab('admin');
            }}
            className="text-slate-500 hover:text-red-600 underline font-black uppercase transition shrink-0 inline-flex items-center gap-1 cursor-pointer"
          >
            <Lock className="h-3 w-3" /> Coordenadores
          </button>
        </p>
      </footer>

    </div>
  );
}

// ============================================================================
// COMPONENT 1: DASHBOARD VIEW
// ============================================================================
function DashboardView() {
  const { users, currentUser, logistica, pixKey, gastos } = useFirebase();

  // Copied Pix notification state
  const [copiedPix, setCopiedPix] = useState(false);

  // Dynamic quota computation
  const totalGeralGastos = (gastos || []).reduce((acc, curr) => acc + (curr.valor || 0), 0);
  const activeUsersCount = users.length || 1;
  const quotaPerPerson = totalGeralGastos / activeUsersCount;

  // Time remaining Countdown November 18th, 2026
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      // Countdown date until November 18th, 2026
      const targetDate = new Date('2026-11-18T20:00:00').getTime();
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff > 0) {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getReadableDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Não definido';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      }) + 'h';
    } catch (_) {
      return dateStr;
    }
  };

  // Group metric summary computations
  const totalGroupCollected = users.reduce((acc, curr) => acc + (curr.totalPago || 0), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 1. HERO REVERSIVE COUNTDOWN HEADER */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-white overflow-hidden relative flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md shadow-neutral-950/10 text-left">
        <div className="absolute top-0 right-0 h-40 w-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10 text-left">
          <span className="text-[10px] text-red-500 font-extrabold uppercase tracking-widest bg-red-950/60 border border-red-900/60 px-3 py-1 rounded-full">
            Contagem Regressiva
          </span>
          <h2 className="text-xl font-black text-white tracking-tight">Sítio em Campo Limpo Paulista - SP</h2>
          <p className="text-xs text-neutral-400 font-medium">Novembro de 2026 promete! Preparem os casacos, trajes de banho e a animação.</p>
        </div>

        {/* Big Countdown */}
        <div id="trip-countdown-container" className="flex items-center gap-3.5 bg-neutral-950/50 border border-neutral-800/80 rounded-2xl p-4 font-mono w-fit relative z-10">
          <div id="countdown-days-box" className="text-center min-w-[42px]">
            <span className="block text-2xl font-black text-white leading-tight">{String(timeLeft.days).padStart(2, '0')}</span>
            <span className="text-[8px] text-gray-500 uppercase font-black tracking-wider block">Dias</span>
          </div>
          <span className="text-red-650 text-red-600/80 text-lg font-bold -mt-3">:</span>
          <div id="countdown-hours-box" className="text-center min-w-[42px]">
            <span className="block text-2xl font-black text-white leading-tight">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-[8px] text-gray-500 uppercase font-black tracking-wider block">Horas</span>
          </div>
          <span className="text-red-650 text-red-600/80 text-lg font-bold -mt-3">:</span>
          <div id="countdown-minutes-box" className="text-center min-w-[42px]">
            <span className="block text-2xl font-black text-white leading-tight">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-[8px] text-gray-500 uppercase font-black tracking-wider block">Mins</span>
          </div>
          <span className="text-red-650 text-red-600/80 text-lg font-bold -mt-3">:</span>
          <div id="countdown-seconds-box" className="text-center min-w-[42px]">
            <span className="block text-2xl font-black text-rose-500 leading-tight">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-[8px] text-gray-500 uppercase font-black tracking-wider block text-rose-500/80">Segs</span>
          </div>
        </div>
      </div>

      {/* 2. CORE TIMES & CRONOGRAMA */}
      <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs space-y-4 text-left">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-red-600" />
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Cronograma de Viagem</h3>
        </div>

        {logistica ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-gray-100 rounded-2xl p-4 flex items-start gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider">Data de Ida (Embarque)</span>
                <span className="text-xs font-bold text-slate-750 leading-tight block">
                  {getReadableDateTime(logistica.dataIda)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">De: {logistica.enderecoPartida}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-gray-100 rounded-2xl p-4 flex items-start gap-3">
              <span className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider">Data de Volta (Retorno)</span>
                <span className="text-xs font-bold text-slate-755 leading-tight block">
                  {getReadableDateTime(logistica.dataVolta)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">Para: {logistica.enderecoPartida}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">Nenhum cronograma definido ainda.</p>
        )}
      </div>

      {/* 3. PARALLEL MATRICES: FINANCES (ADAPTIVE GUEST VS LOGGED) & PIX ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Payment overview */}
        <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs text-left flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <DollarSign className="h-5 w-5 text-red-650 text-red-600" />
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
                Resumo Financeiro
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-gray-100 rounded-2xl p-4">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Valor da Cota</span>
                <span className="text-xl md:text-2xl font-mono font-black text-slate-800 block mt-1">{formatCurrency(quotaPerPerson)}</span>
              </div>
              <div className="bg-neutral-900 text-white rounded-2xl p-4">
                <span className="text-[9px] text-neutral-400 uppercase font-black tracking-wider block">Total Arrecadado</span>
                <span className="text-xl md:text-2xl font-mono font-black text-emerald-400 block mt-1">{formatCurrency(totalGroupCollected)}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-gray-100 rounded-2xl text-[11px] text-slate-500 leading-normal font-normal">
            A meta mínima estimada para a hospedagem e custos básicos por participante é de <strong className="text-slate-800">{formatCurrency(quotaPerPerson)}</strong>. O administrador fará a baixa manual dos pagamentos.
          </div>
        </div>

        {/* Quick Pix Card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs text-left space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-red-650 text-red-600" />
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Depósito Pix Rápido</h3>
          </div>

          <p className="text-[11px] text-slate-500 leading-normal font-medium">
            Deposite parcelas ou faça o pagamento de despesas de forma centralizada e direta para o cofre da viagem LagoaFlix.
          </p>

          <div className="bg-slate-50 border border-gray-100 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">Chave Pix Coleta:</span>
              <span className="bg-white border border-gray-200/65 text-slate-700 font-mono font-bold px-2 py-1 rounded text-[11px] select-all max-w-[170px] truncate" title={pixKey}>
                {pixKey}
              </span>
            </div>
            
            <button
              onClick={copyPixKey}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer select-none"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedPix ? 'Chave Copiada!' : 'Copiar Chave Pix'}
            </button>
          </div>
        </div>

      </div>

      {/* 4. PASSENGERS PARTICIPANTS LIST */}
      <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs text-left space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-red-650 text-red-600" />
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Participantes Confirmados</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
            Total: {users.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {users.map((user) => (
            <div 
              key={user.id}
              className="bg-slate-50 border border-gray-100 rounded-2xl p-3 flex items-center justify-between relative shadow-3xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs uppercase font-sans">
                  {(user.nome || 'Convidado').charAt(0)}
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block truncate max-w-[110px]">
                    {user.nome || 'Convidado'}
                  </span>
                  <span className="text-[8.5px] uppercase tracking-wider font-black text-slate-400">
                    {user.role === 'admin' ? 'Coordenador' : 'Viajante'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11.5px] font-mono font-black text-slate-800 block">
                  {formatCurrency(user.totalPago || 0)}
                </span>
                <span className="text-[8px] uppercase tracking-widest font-bold text-slate-400 block">Total Homologado</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </motion.div>
  );
}

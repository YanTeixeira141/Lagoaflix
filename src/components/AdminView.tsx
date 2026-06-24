import React, { useState } from 'react';
import { useFirebase } from '../FirebaseContext';
import AdminMenu from './AdminMenu';
import AdminLogistica from './AdminLogistica';
import AdminFinanceiro from './AdminFinanceiro';
import AdminPix from './AdminPix';
import AdminParticipantes from './AdminParticipantes';
import { AnimatePresence, motion } from 'motion/react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export default function AdminView() {
  const { 
    users, 
    pagamentos, 
    gastos, 
    logistica, 
    pixKey,
    presetProfiles,
    updateLogistica, 
    addGasto, 
    deleteGasto, 
    updateGasto,
    updatePagamentoStatus, 
    updatePixKey,
    updateUserRole,
    addParticipante,
    updateUserNome,
    deleteUser,
    updateTotalPagoOverride,
    savePresetProfiles
  } = useFirebase();

  // Internal Navigation
  const [activeView, setActiveView] = useState<'menu' | 'logistica' | 'financeiro' | 'planilha' | 'pix'>('menu');

  // Status Notification Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, message: msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Computations
  const totalInExpenses = gastos.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const activeUsersCount = users.length || 1;
  const quotaPerPerson = totalInExpenses / activeUsersCount;

  return (
    <div id="admin-module-container" className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Dynamic inline notification banner */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`p-3.5 rounded-2xl border text-xs font-bold leading-relaxed shadow-sm text-left flex items-start gap-2.5 z-50 relative ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                : 'bg-rose-50 text-rose-800 border-rose-100'
            }`}
          >
            {feedback.type === 'success' ? (
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeView === 'menu' && (
          <AdminMenu
            setActiveView={setActiveView}
            users={users}
            gastos={gastos}
            logistica={logistica}
            pixKey={pixKey}
            totalInExpenses={totalInExpenses}
            quotaPerPerson={quotaPerPerson}
          />
        )}

        {activeView === 'logistica' && (
          <AdminLogistica
            setActiveView={setActiveView}
            logistica={logistica}
            updateLogistica={updateLogistica}
            triggerFeedback={triggerFeedback}
          />
        )}

        {activeView === 'planilha' && (
          <AdminFinanceiro
            setActiveView={setActiveView}
            gastos={gastos}
            activeUsersCount={activeUsersCount}
            addGasto={addGasto}
            deleteGasto={deleteGasto}
            updateGasto={updateGasto}
            triggerFeedback={triggerFeedback}
          />
        )}

        {activeView === 'financeiro' && (
          <AdminParticipantes
            setActiveView={setActiveView}
            users={users}
            pagamentos={pagamentos}
            presetProfiles={presetProfiles}
            quotaPerPerson={quotaPerPerson}
            addParticipante={addParticipante}
            updateUserNome={updateUserNome}
            updateUserRole={updateUserRole}
            deleteUser={deleteUser}
            updateTotalPagoOverride={updateTotalPagoOverride}
            updatePagamentoStatus={updatePagamentoStatus}
            savePresetProfiles={savePresetProfiles}
            triggerFeedback={triggerFeedback}
          />
        )}

        {activeView === 'pix' && (
          <AdminPix
            setActiveView={setActiveView}
            pixKey={pixKey}
            updatePixKey={updatePixKey}
            triggerFeedback={triggerFeedback}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

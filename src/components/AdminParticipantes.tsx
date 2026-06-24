import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Users, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  DollarSign, 
  ExternalLink,
  ShieldCheck,
  Palette,
  AlertCircle
} from 'lucide-react';
import { UserProfile, Pagamento, ParticipantProfile, PRESET_PROFILES } from '../firebase';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminParticipantesProps {
  setActiveView: (view: 'menu' | 'logistica' | 'financeiro' | 'planilha' | 'pix') => void;
  users: UserProfile[];
  pagamentos: Pagamento[];
  presetProfiles: ParticipantProfile[];
  quotaPerPerson: number;
  addParticipante: (nome: string) => Promise<void>;
  updateUserNome: (userId: string, nome: string) => Promise<void>;
  updateUserRole: (userId: string, role: 'admin' | 'user') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateTotalPagoOverride: (userId: string, total: number) => Promise<void>;
  updatePagamentoStatus: (payId: string, status: 'aprovado' | 'recusado') => Promise<void>;
  savePresetProfiles: (profiles: ParticipantProfile[]) => Promise<void>;
  triggerFeedback: (type: 'success' | 'error', msg: string) => void;
  viewOnlyRoleMode?: boolean;
}

export default function AdminParticipantes({
  setActiveView,
  users,
  pagamentos,
  presetProfiles,
  quotaPerPerson,
  addParticipante,
  updateUserNome,
  updateUserRole,
  deleteUser,
  updateTotalPagoOverride,
  updatePagamentoStatus,
  savePresetProfiles,
  triggerFeedback,
  viewOnlyRoleMode = false
}: AdminParticipantesProps) {

  // New Participant and Manual Payment states
  const [newParticipantName, setNewParticipantName] = useState('');
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [paymentUserId, setPaymentUserId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [userDraftNames, setUserDraftNames] = useState<{[key: string]: string}>({});

  // Preset Profiles Editing States
  const [showPresetsEditor, setShowPresetsEditor] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetRole, setNewPresetRole] = useState<'admin' | 'user'>('user');
  const [newPresetColor, setNewPresetColor] = useState('bg-teal-500 hover:ring-teal-400');

  // Modal / Detail States
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<{ id: string; name: string } | null>(null);
  const [pendingDeletePreset, setPendingDeletePreset] = useState<{ id: string; name: string } | null>(null);

  // Auto-fill paymentUserId with first participant if not set
  useEffect(() => {
    if (users && users.length > 0 && !paymentUserId) {
      setPaymentUserId(users[0].id);
    }
  }, [users, paymentUserId]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipantName.trim()) {
      triggerFeedback('error', 'Por favor, insira o nome do participante.');
      return;
    }
    try {
      await addParticipante(newParticipantName.trim());
      setNewParticipantName('');
      setIsAddingParticipant(false);
      triggerFeedback('success', 'Participante adicionado com sucesso!');
    } catch (err: any) {
      console.error(err);
      triggerFeedback('error', `Falha ao adicionar participante: ${err.message || err}`);
    }
  };

  const handleNameSave = async (userId: string, newName: string) => {
    if (!newName.trim()) {
      triggerFeedback('error', 'O nome não pode ser vazio.');
      return;
    }
    if (newName.trim().length < 2) {
      triggerFeedback('error', 'Nome muito curto, digite o nome completo');
      return;
    }
    try {
      await updateUserNome(userId, newName.trim());
      setUserDraftNames(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      triggerFeedback('success', 'Nome do participante atualizado com sucesso!');
    } catch (err: any) {
      console.error(err);
      triggerFeedback('error', `Erro ao atualizar nome: ${err.message || err}`);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateUserRole(userId, newRole);
      triggerFeedback('success', `Nível de acesso atualizado para ${newRole === 'admin' ? 'Administrador' : 'Participante'}!`);
    } catch (err: any) {
      console.error(err);
      triggerFeedback('error', `Falha ao atualizar nível de acesso: ${err.message || err}`);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setPendingDeleteUser({ id: userId, name: userName });
  };

  const confirmDeleteUser = async () => {
    if (!pendingDeleteUser) return;
    const { id, name } = pendingDeleteUser;
    try {
      await deleteUser(id);
      triggerFeedback('success', `Participante "${name}" excluído da viagem.`);
    } catch (err: any) {
      console.error(err);
      triggerFeedback('error', `Falha ao excluir participante: ${err.message || err}`);
    } finally {
      setPendingDeleteUser(null);
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentUserId) {
      triggerFeedback('error', 'Por favor, selecione um participante.');
      return;
    }
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerFeedback('error', 'Por favor, digite um valor de pagamento válido.');
      return;
    }
    
    const selectedProfile = users.find(u => u.id === paymentUserId);
    if (!selectedProfile) {
      triggerFeedback('error', 'Participante não encontrado.');
      return;
    }
    
    const currentTotal = selectedProfile.totalPago || 0;
    const newTotal = currentTotal + amount;
    
    try {
      await updateTotalPagoOverride(paymentUserId, newTotal);
      setPaymentAmount('');
      triggerFeedback('success', `Pagamento de ${formatBRL(amount)} lançado para ${selectedProfile.nome || 'Convidado'}!`);
    } catch (err: any) {
      console.error(err);
      triggerFeedback('error', `Falha ao registrar pagamento: ${err.message || err}`);
    }
  };

  const handleApprovePayment = async (payId: string) => {
    try {
      await updatePagamentoStatus(payId, 'aprovado');
      triggerFeedback('success', 'Pagamento APROVADO com sucesso!');
    } catch (err: any) {
      console.error(err);
      triggerFeedback('error', `Falha ao aprovar pagamento: ${err.message || err}`);
    }
  };

  const handleRejectPayment = async (payId: string) => {
    try {
      await updatePagamentoStatus(payId, 'recusado');
      triggerFeedback('success', 'Pagamento recusado / rejeitado.');
    } catch (err: any) {
      console.error(err);
      triggerFeedback('error', `Falha ao recusar pagamento: ${err.message || err}`);
    }
  };

  // Preset Profiles Actions
  const handleAddPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) {
      triggerFeedback('error', 'Insira um nome válido para o perfil predefinido.');
      return;
    }
    const id = newPresetName.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
    const duplicate = presetProfiles.some(p => p.id === id);
    if (duplicate) {
      triggerFeedback('error', 'Já existe um perfil predefinido com o mesmo identificador.');
      return;
    }

    const item: ParticipantProfile = {
      id,
      name: newPresetName.trim(),
      role: newPresetRole,
      color: newPresetColor
    };

    try {
      const updatedList = [...presetProfiles, item];
      await savePresetProfiles(updatedList);
      setNewPresetName('');
      triggerFeedback('success', `Perfil "${item.name}" adicionado às predefinições!`);
    } catch (err: any) {
      console.error(err);
      triggerFeedback('error', `Erro ao adicionar predefinição: ${err.message}`);
    }
  };

  const handleDeletePreset = (presetId: string, name: string) => {
    if (presetProfiles.length <= 1) {
      triggerFeedback('error', 'É necessário manter pelo menos 1 perfil predefinido para onboarding.');
      return;
    }
    setPendingDeletePreset({ id: presetId, name });
  };

  const confirmDeletePreset = async () => {
    if (!pendingDeletePreset) return;
    const { id, name } = pendingDeletePreset;
    try {
      const updated = presetProfiles.filter(p => p.id !== id);
      await savePresetProfiles(updated);
      triggerFeedback('success', 'Perfil predefinido removido com sucesso!');
    } catch (err: any) {
      triggerFeedback('error', 'Erro ao excluir perfil predefinido.');
    } finally {
      setPendingDeletePreset(null);
    }
  };

  const pendingApprovals = pagamentos.filter(p => p.status === 'pendente');

  // Predefined colors list for customizable presets
  const availableColors = [
    { value: 'bg-red-500 hover:ring-red-400', label: 'Vermelho' },
    { value: 'bg-emerald-500 hover:ring-emerald-400', label: 'Esmeralda' },
    { value: 'bg-indigo-500 hover:ring-indigo-400', label: 'Índigo' },
    { value: 'bg-yellow-500 hover:ring-yellow-400', label: 'Amarelo' },
    { value: 'bg-pink-500 hover:ring-pink-400', label: 'Rosa' },
    { value: 'bg-purple-500 hover:ring-purple-400', label: 'Roxo' },
    { value: 'bg-orange-500 hover:ring-orange-400', label: 'Laranja' },
    { value: 'bg-teal-500 hover:ring-teal-400', label: 'Azul-Verde' },
    { value: 'bg-rose-500 hover:ring-rose-400', label: 'Rosa-Forte' },
    { value: 'bg-slate-800', label: 'Escuro' }
  ];

  if (viewOnlyRoleMode) {
    return (
      <motion.div
        key="admin-perfis"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-5"
      >
        <div className="flex items-center justify-between">
          <button
            id="btn-perfis-voltar"
            onClick={() => setActiveView('menu')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            Módulo Segurança (Regras do Firestore)
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 space-y-6 text-left shadow-3xs">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Perfis de Acesso de Usuários</h3>
            <p className="text-[11px] text-neutral-500 font-semibold leading-relaxed mt-0.5">
              Promova ou mude papéis de acesso no Firestore em tempo real. Usuários com acesso "Administrador" conseguem visualizar esta aba de ferramentas administrativas.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 px-4 py-2 flex items-center justify-between rounded-xl border border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <span>Nome / Perfil</span>
              <span>Papel de Acesso (Role)</span>
            </div>

            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <div key={user.id} className="py-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      {user.role === 'admin' && (
                        <ShieldCheck className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <span className="text-xs font-black text-slate-800">{user.nome}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 font-medium">
                      ID Perfil: <span className="font-mono text-[9px] uppercase">{user.id}</span> {user.email ? `• ${user.email}` : '• Sem e-mail cadastrado'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      id={`select-role-${user.id}`}
                      value={user.role}
                      onChange={(e: any) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                      className="text-xs font-black tracking-tight px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none cursor-pointer hover:bg-slate-100 transition"
                    >
                      <option value="user">Participante</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="admin-financeiro"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-5"
    >
      {/* Header / Voltar */}
      <div className="flex items-center justify-between">
        <button
          id="btn-financeiro-voltar"
          onClick={() => setActiveView('menu')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full">
            Cota Individual: {formatBRL(quotaPerPerson)}
          </span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            Módulo Financeiro / Pagamentos
          </span>
        </div>
      </div>

      {/* Fila de Aprovação Pendente se existir */}
      {pendingApprovals.length > 0 && (
        <div className="bg-amber-50 rounded-3xl border border-amber-200 p-6 space-y-4 shadow-3xs text-left animate-pulse">
          <div className="pb-2 border-b border-amber-150 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest">Fila de Aprovação de Comprovantes ({pendingApprovals.length})</h4>
          </div>

          <div className="space-y-2.5">
            {pendingApprovals.map((p) => {
              const u = users.find(usr => usr.id === p.uid);
              return (
                <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800">
                  <div>
                    <p className="text-xs font-black"><span className="text-slate-500">Participante:</span> {u?.nome || 'Convidado'} (ID: {p.uid})</p>
                    <p className="text-xs font-semibold text-neutral-500 mt-0.5">Mês Ref: {p.mesRef} • Valor: <span className="font-extrabold text-neutral-700">{formatBRL(p.valor)}</span></p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setViewingReceiptUrl(p.comprovanteUrl)}
                      className="px-2.5 py-1 text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-slate-100 transition flex items-center gap-1 shrink-0"
                    >
                      Visualizar <ExternalLink className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleRejectPayment(p.id)}
                      className="px-2.5 py-1 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition whitespace-nowrap"
                    >
                      Recusar
                    </button>
                    <button
                      onClick={() => handleApprovePayment(p.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black whitespace-nowrap"
                    >
                      Aprovar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Painéis de Gestão Manual Desejados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* 1. Gestão de Participantes (Adicionar Participante) */}
        <div className="bg-white rounded-3xl border border-gray-150 p-6 space-y-4 shadow-3xs text-left">
          <div className="flex items-center justify-between pb-2 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-red-600" />
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Gestão de Participantes</h4>
            </div>
            <button
              onClick={() => setIsAddingParticipant(!isAddingParticipant)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black tracking-wider uppercase transition cursor-pointer select-none shrink-0"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </button>
          </div>

          {isAddingParticipant && (
            <form onSubmit={handleAddParticipant} className="bg-slate-50 border border-gray-100 p-3.5 rounded-2xl space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 block">Nome do Participante</label>
                <input
                  type="text"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingParticipant(false);
                    setNewParticipantName('');
                  }}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-mono">Lista Atual ({users.length})</p>
            <div className="space-y-20 p-px" />
            <div className="space-y-2">
              {users.map((u) => {
                const draftValue = userDraftNames[u.id] ?? (u.nome || '');
                const hasChanged = draftValue !== (u.nome || '');
                const isShortName = (u.nome || '').trim().length < 2;
                return (
                  <div 
                    key={u.id} 
                    className={`p-2 border rounded-2xl hover:shadow-3xs transition flex items-center justify-between gap-2 ${
                      isShortName 
                        ? 'border-amber-400 bg-amber-50/40 hover:border-amber-500' 
                        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {isShortName && (
                        <div className="text-amber-600 shrink-0" title="Nome inválido ou muito curto. Digite o nome completo.">
                          <AlertCircle className="h-4 w-4 stroke-[2.5px] animate-pulse" />
                        </div>
                      )}
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={draftValue}
                          onChange={(e) => setUserDraftNames(prev => ({ ...prev, [u.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleNameSave(u.id, draftValue);
                            }
                          }}
                          className={`w-full bg-slate-100/50 border hover:bg-slate-100 hover:border-slate-200 focus:bg-white focus:border-red-500 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 transition focus:outline-none ${
                            isShortName ? 'border-amber-200 focus:border-amber-500' : 'border-slate-100'
                          } ${hasChanged ? 'pr-16' : 'pr-8'}`}
                          placeholder="Nome do participante"
                        />
                        {hasChanged && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleNameSave(u.id, draftValue);
                              }}
                              className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition cursor-pointer"
                              title="Salvar Nome"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setUserDraftNames(prev => {
                                  const copy = { ...prev };
                                  delete copy[u.id];
                                  return copy;
                                });
                              }}
                              className="p-1 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition cursor-pointer"
                              title="Cancelar Edição"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={u.role || 'user'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as 'admin' | 'user')}
                        className="bg-slate-100/50 border border-slate-100 hover:border-slate-200 text-[10px] font-black uppercase rounded-xl px-1.5 py-1.5 text-slate-700 cursor-pointer focus:outline-none focus:border-red-500 transition"
                      >
                        <option value="user">Membro</option>
                        <option value="admin">Admin</option>
                      </select>

                      <button
                        onClick={() => handleDeleteUser(u.id, u.nome || 'Convidado')}
                        className="p-1.5 hover:bg-neutral-100 text-red-600 rounded-xl transition cursor-pointer"
                        title="Excluir participante"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Lançamento Manual de Pagamentos */}
        <div className="bg-white rounded-3xl border border-gray-150 p-6 space-y-4 shadow-3xs text-left">
          <div className="pb-2 border-b border-gray-50 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Lançar Pagamento</h4>
          </div>

          <form onSubmit={handleConfirmPayment} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 block font-mono">Participante</label>
                <select
                  value={paymentUserId}
                  onChange={(e) => setPaymentUserId(e.target.value)}
                  className="w-full text-xs font-bold px-2 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 transition cursor-pointer"
                  required
                >
                  <option value="">Selecione...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome || 'Convidado'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 block font-mono">Valor (R$)</label>
                <input
                  type="number"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Ex: 150.00"
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                  min="0.01"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none flex items-center justify-center gap-1.5"
            >
              Confirmar Pagamento
            </button>
          </form>

          {/* Quick toggle to dynamic custom presets editor */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <div>
              <h5 className="text-[11px] font-extrabold text-slate-700">Perfis Predefinidos (Database Presets)</h5>
              <p className="text-[9.5px] text-zinc-400 font-semibold">Customize os perfis de seed de auto-onboarding.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPresetsEditor(!showPresetsEditor)}
              className="flex items-center gap-1 px-3 py-1 text-[10px] font-black text-purple-600 bg-purple-50 hover:bg-slate-100 border border-purple-100 rounded-lg transition"
            >
              <Palette className="h-3.5 w-3.5" /> {showPresetsEditor ? 'Fechar Edit' : 'Gerenciar'}
            </button>
          </div>
        </div>

      </div>

      {/* Dynamic customizable preset profiles list */}
      <AnimatePresence>
        {showPresetsEditor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-purple-50/40 rounded-3xl border border-purple-100 p-6 text-left space-y-4"
          >
            <div>
              <h4 className="text-sm font-black text-purple-950 flex items-center gap-1.5">
                <Palette className="h-4.5 w-4.5 text-purple-700" />
                Editor de Perfis Predefinidos do Grupo
              </h4>
              <p className="text-[11px] text-purple-800 font-semibold mt-0.5">
                Estes perfis definem os rostos/nomes predefinidos da viagem. Quando o banco está vazio ou você reinicia as configurações, eles servem como catálogo para as chaves Netflix da LagoaFlix.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Presets List */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                <p className="text-[9.5px] font-black uppercase text-purple-700 tracking-wider">Perfis Salvosatualmente ({presetProfiles.length})</p>
                <div className="space-y-1.5">
                  {presetProfiles.map((p) => (
                    <div key={p.id} className="p-2 border border-purple-100/50 bg-white rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={`h-5 w-5 rounded-md ${p.color || 'bg-slate-500'} flex items-center justify-center text-[10px] text-white font-black uppercase`}>
                          {p.name.charAt(0)}
                        </span>
                        <div>
                          <span>{p.name}</span>
                          <span className="text-[9px] text-zinc-400 block capitalize">ID: {p.id} • Acesso: {p.role}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(p.id, p.name)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                        title="Remover predefinição"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Preset Form */}
              <form onSubmit={handleAddPreset} className="bg-white rounded-2xl border border-purple-100 p-4 space-y-3">
                <p className="text-[9.5px] font-black uppercase text-purple-700 tracking-wider">Criar Novo Perfil Predefinido</p>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 font-black uppercase">Nome do Viajante</label>
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Ex: Amanda Santos"
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-black uppercase">Permissão Inicial</label>
                    <select
                      value={newPresetRole}
                      onChange={(e: any) => setNewPresetRole(e.target.value)}
                      className="w-full text-xs font-medium p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="user">Viajante comum</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-black uppercase font-mono">Avatar Cor</label>
                    <select
                      value={newPresetColor}
                      onChange={(e) => setNewPresetColor(e.target.value)}
                      className="w-full text-xs font-medium p-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      {availableColors.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 mt-1 bg-purple-650 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider"
                >
                  Adicionar Predefinição
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users table showing payments status & access levels */}
      <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 space-y-4 text-left shadow-3xs overflow-x-auto">
        <div className="border-b border-gray-105 pb-3">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Gerenciamento de Participantes</h3>
          <p className="text-[11px] text-neutral-500 font-semibold leading-relaxed mt-0.5">
            Mude permissões no sistema em tempo real, aprove comprovantes e confira o status de quitação de cada cota.
          </p>
        </div>

        <table className="w-full text-slate-800 text-left min-w-[620px]">
          <thead>
            <tr className="border-b border-gray-150 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Participante</th>
              <th className="py-3 px-2">Nível de Acesso (Role)</th>
              <th className="py-3 px-4">Total Pago</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Comprovantes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const isPaid = u.totalPago >= quotaPerPerson;
              const preset = presetProfiles.find(p => p.id === u.id) || PRESET_PROFILES.find(p => p.id === u.id);
              return (
                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                  {/* Nome do Participante */}
                  <td className="py-4 px-4 flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-full ${preset?.color || 'bg-slate-300'} flex items-center justify-center text-xs text-white font-black overflow-hidden shrink-0`}>
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.nome || 'Convidado'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        (u.nome || 'Convidado').charAt(0)
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800 block">{u.nome || 'Convidado'}</span>
                      <span className="text-[9px] font-semibold text-slate-400 font-mono block uppercase leading-none mt-0.5">ID: {u.id}</span>
                    </div>
                  </td>

                  {/* Nível de Acesso (Role) */}
                  <td className="py-4 px-2">
                    <select
                      id={`select-role-financeiro-${u.id}`}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as 'admin' | 'user')}
                      className="text-xs font-black px-2 py-1 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none cursor-pointer hover:bg-slate-100 transition"
                    >
                      <option value="user">Viajante (user)</option>
                      <option value="admin">Coordenador (admin)</option>
                    </select>
                  </td>

                  {/* Total Pago */}
                  <td className="py-4 px-4 text-xs font-black text-slate-700">
                    {formatBRL(u.totalPago || 0)}
                  </td>

                  {/* Status (Quitado / Devendo) */}
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      {isPaid ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-full px-2.5 py-0.5 flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider">
                          <Check className="h-3 w-3 text-emerald-600 stroke-[3px]" /> Quitado
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200/50 rounded-full px-2.5 py-0.5 inline-block text-[9.5px] font-black uppercase tracking-wider">
                          Devendo
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Ação */}
                  <td className="py-4 px-4 text-right">
                    <button
                      id={`btn-ver-historico-${u.id}`}
                      onClick={() => setSelectedUser(u)}
                      className="inline-flex py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black tracking-tight transition items-center gap-1 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" /> Histórico
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Individual Payments History Modal / Drawer for the Selected Participant */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-[#121212c4] backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-200 w-full max-w-lg p-6 relative shadow-2xl text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-150 mb-4">
                <div>
                  <span className="text-[10px] text-purple-600 font-extrabold uppercase tracking-widest block font-mono">Histórico de Comprovantes</span>
                  <h3 className="text-base font-black text-slate-800 tracking-tight leading-4 mt-0.5">
                    {selectedUser.nome}
                  </h3>
                </div>
                <button
                  id="btn-fechar-historico"
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 text-neutral-400 hover:text-slate-800 rounded-full hover:bg-slate-50 transition border border-gray-150 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content List */}
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {pagamentos.filter((p) => p.uid === selectedUser.id).length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200/80 text-xs text-slate-400">
                    Este participante ainda não enviou nenhum comprovante de pagamento no sistema.
                  </div>
                ) : (
                  pagamentos
                    .filter((p) => p.uid === selectedUser.id)
                    .map((p) => (
                      <div key={p.id} className="bg-slate-50 p-4 rounded-2xl border border-gray-150 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">{p.mesRef}</span>
                              <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                p.status === 'aprovado' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : p.status === 'recusado'
                                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {p.status}
                              </span>
                            </div>
                            <p className="text-sm font-black text-slate-800">{formatBRL(p.valor)}</p>
                          </div>

                          <button
                            id={`btn-open-doc-${p.id}`}
                            onClick={() => setViewingReceiptUrl(p.comprovanteUrl)}
                            className="text-[10px] font-black text-purple-600 hover:text-purple-700 underline flex items-center gap-0.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-150 shadow-3xs"
                          >
                            Visualizar <ExternalLink className="h-3 w-3 ml-0.5" />
                          </button>
                        </div>

                        {/* Admin actions block */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-150">
                          {p.status !== 'recusado' && (
                            <button
                              id={`btn-recusar-comprovante-${p.id}`}
                              onClick={() => handleRejectPayment(p.id)}
                              className="px-3 py-1.5 bg-white border border-rose-200 hover:border-rose-400 text-rose-600 text-[10.5px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1"
                            >
                              <X className="h-3.5 w-3.5 stroke-[3px]" /> Recusar
                            </button>
                          )}
                          {p.status !== 'aprovado' && (
                            <button
                              id={`btn-aprovar-comprovante-${p.id}`}
                              onClick={() => handleApprovePayment(p.id)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1"
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3px]" /> Aprovar
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Proof Zoom / Popup Modal Preview */}
      <AnimatePresence>
        {viewingReceiptUrl && (
          <div className="fixed inset-0 bg-[#000000f0] p-4 flex items-center justify-center z-[100]">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <a
                href={viewingReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-black tracking-tight transition flex items-center gap-1"
              >
                Abrir em nova aba <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                id="btn-close-receipt-zoom"
                onClick={() => setViewingReceiptUrl(null)}
                className="p-1.5 text-white/70 hover:text-white bg-white/10 rounded-full transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <img
              src={viewingReceiptUrl}
              alt="Expanded Zoom Comprovante"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-xl border border-white/15"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={pendingDeleteUser !== null}
        onClose={() => setPendingDeleteUser(null)}
        onConfirm={confirmDeleteUser}
        title="Excluir Participante"
        message={pendingDeleteUser ? `Tem certeza que deseja excluir o participante "${pendingDeleteUser.name}" da viagem?` : ''}
      />

      <ConfirmDialog
        isOpen={pendingDeletePreset !== null}
        onClose={() => setPendingDeletePreset(null)}
        onConfirm={confirmDeletePreset}
        title="Excluir Perfil Predefinido"
        message={pendingDeletePreset ? `Excluir o perfil predefinido "${pendingDeletePreset.name}"?` : ''}
      />
    </motion.div>
  );
}

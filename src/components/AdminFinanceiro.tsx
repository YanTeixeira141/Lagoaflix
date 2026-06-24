import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Trash2 
} from 'lucide-react';
import { Gasto } from '../firebase';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminFinanceiroProps {
  setActiveView: (view: 'menu' | 'logistica' | 'financeiro' | 'planilha' | 'pix') => void;
  gastos: Gasto[];
  activeUsersCount: number;
  addGasto: (categoria: 'Moradia' | 'Transporte' | 'Alimentação' | 'Outros', descricao: string, valor: number) => Promise<void>;
  deleteGasto: (id: string) => Promise<void>;
  updateGasto: (id: string, updates: Partial<Gasto>) => Promise<void>;
  triggerFeedback: (type: 'success' | 'error', msg: string) => void;
}

export default function AdminFinanceiro({
  setActiveView,
  gastos,
  activeUsersCount,
  addGasto,
  deleteGasto,
  updateGasto,
  triggerFeedback
}: AdminFinanceiroProps) {

  // Inline Editing States
  const [editingCellId, setEditingCellId] = useState<string | null>(null); // formatted as "gastoId-field"
  const [editingValue, setEditingValue] = useState<string>('');
  const [pendingDeleteGastoId, setPendingDeleteGastoId] = useState<string | null>(null);

  const totalInExpenses = gastos.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const quotaPerPerson = totalInExpenses / (activeUsersCount || 1);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleAddSubtleGasto = async (category: 'Moradia' | 'Transporte' | 'Alimentação' | 'Outros') => {
    try {
      await addGasto(category, 'Nova Despesa', 0);
      triggerFeedback('success', `Nova despesa criada em ${category}. Clique na célula para customizar!`);
    } catch (err: any) {
      triggerFeedback('error', `Falha ao criar despesa: ${err.message || err}`);
    }
  };

  const handleDeleteGasto = (id: string) => {
    setPendingDeleteGastoId(id);
  };

  const confirmDeleteGasto = async () => {
    if (!pendingDeleteGastoId) return;
    try {
      await deleteGasto(pendingDeleteGastoId);
      triggerFeedback('success', 'Despesa removida com sucesso!');
    } catch (err: any) {
      console.error(err);
      triggerFeedback('error', `Erro ao deletar despesa: ${err.message || err}`);
    } finally {
      setPendingDeleteGastoId(null);
    }
  };

  const handleSaveInlineCell = async (id: string, field: 'descricao' | 'valorUnitario' | 'quantidade', value: string) => {
    setEditingCellId(null);
    const existingGasto = gastos.find(g => g.id === id);
    if (!existingGasto) return;

    const currentDesc = existingGasto.descricao || '';
    const currentValUnit = existingGasto.valorUnitario !== undefined ? existingGasto.valorUnitario : (existingGasto.valor || 0);
    const currentQty = existingGasto.quantidade !== undefined ? existingGasto.quantidade : 1;

    let finalDesc = currentDesc;
    let finalValUnit = currentValUnit;
    let finalQty = currentQty;

    if (field === 'descricao') {
      if (!value.trim()) {
        triggerFeedback('error', 'A descrição do item não pode ser vazia.');
        return;
      }
      finalDesc = value.trim();
    } else if (field === 'valorUnitario') {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        triggerFeedback('error', 'Valor unitário inválido.');
        return;
      }
      finalValUnit = num;
    } else if (field === 'quantidade') {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        triggerFeedback('error', 'Quantidade inválida.');
        return;
      }
      finalQty = num;
    }

    const finalTotal = finalValUnit * finalQty;

    try {
      await updateGasto(id, {
        descricao: finalDesc,
        valorUnitario: finalValUnit,
        quantidade: finalQty,
        valor: finalTotal
      });
      triggerFeedback('success', 'Planilha atualizada com sucesso!');
    } catch (err: any) {
      triggerFeedback('error', `Falha ao salvar alteração: ${err.message || err}`);
    }
  };

  return (
    <motion.div
      key="admin-planilha"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-5"
    >
      {/* Header / Voltar */}
      <div className="flex items-center justify-between">
        <button
          id="btn-planilha-voltar"
          onClick={() => setActiveView('menu')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
          Planilha de Custos Interativa (LagoaFlix)
        </span>
      </div>

      {/* Calculations Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        
        <div className="bg-slate-900 text-white rounded-3xl p-6 text-left flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9.5px] uppercase font-bold text-slate-300 tracking-wider">Valor Total da Viagem</span>
            <p className="text-2xl font-black tracking-tight mt-1">
              {formatBRL(totalInExpenses)}
            </p>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
              Soma de todas as despesas cadastradas abaixo.
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 text-left border border-gray-150 flex items-center justify-between shadow-3xs">
          <div>
            <span className="text-[9.5px] uppercase font-bold text-neutral-400 tracking-wider">Cota por Pessoa</span>
            <p className="text-2xl font-black text-rose-600 tracking-tight mt-1">
              {formatBRL(quotaPerPerson)}
            </p>
            <p className="text-[10px] text-neutral-400 font-medium leading-relaxed mt-1">
              {formatBRL(totalInExpenses)} dividido por {activeUsersCount} participantes ativos.
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
            <DollarSign className="h-6 w-6 text-rose-500" />
          </div>
        </div>

      </div>

      {/* Spreadsheet Sections (4 Interactive Tables, one for each category) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {(['Moradia', 'Transporte', 'Alimentação', 'Outros'] as const).map((cat) => {
          const catExpenses = gastos.filter(g => g.categoria === cat);
          const catTotal = catExpenses.reduce((sum, g) => sum + g.valor, 0);

          return (
            <div key={cat} className="bg-white rounded-3xl border border-gray-150 p-6 space-y-4 shadow-3xs text-left">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    cat === 'Moradia' ? 'bg-indigo-500' :
                    cat === 'Transporte' ? 'bg-cyan-500' :
                    cat === 'Alimentação' ? 'bg-emerald-500' : 'bg-purple-500'
                  }`} />
                  <h4 className="text-sm font-black text-slate-800 tracking-tight">{cat}</h4>
                  <span className="text-[9px] font-bold text-slate-400">({catExpenses.length})</span>
                </div>
                
                {/* Subtle plus button for fast quick-adding to the precise category */}
                <button
                  type="button"
                  onClick={() => handleAddSubtleGasto(cat)}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-slate-100 border border-indigo-100 hover:border-slate-300 rounded-lg transition shrink-0 cursor-pointer"
                  title={`Rápido adicionar em ${cat}`}
                >
                  <Plus className="h-3 w-3 stroke-[3px]" /> Adicionar
                </button>
              </div>

              <div className="overflow-x-auto min-h-[140px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-2 px-1">Item (Clique para editar)</th>
                      <th className="py-2 px-1 text-right w-28">Val. Unitário (R$)</th>
                      <th className="py-2 px-1 text-center w-16">Qnt.</th>
                      <th className="py-2 px-1 text-right w-24">Total (R$)</th>
                      <th className="py-2 px-1 text-center w-12">Remover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {catExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 px-1 text-center text-[11px] text-neutral-400 font-medium">
                          Nenhuma despesa em {cat}. Use o botão "+ Adicionar" acima.
                        </td>
                      </tr>
                    ) : (
                      catExpenses.map((g) => {
                        const isEditingDesc = editingCellId === `${g.id}-descricao`;
                        const isEditingValUnit = editingCellId === `${g.id}-valorUnitario`;
                        const isEditingQty = editingCellId === `${g.id}-quantidade`;

                        const valUnit = g.valorUnitario !== undefined ? g.valorUnitario : g.valor;
                        const qty = g.quantidade !== undefined ? g.quantidade : 1;
                        const valTotal = g.valor;

                        return (
                          <tr key={g.id} className="hover:bg-slate-50/50 transition">
                            {/* Item (descricao) cell */}
                            <td className="py-2 px-1">
                              {isEditingDesc ? (
                                <input
                                  type="text"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={() => handleSaveInlineCell(g.id, 'descricao', editingValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveInlineCell(g.id, 'descricao', editingValue);
                                    } else if (e.key === 'Escape') {
                                      setEditingCellId(null);
                                    }
                                  }}
                                  className="w-full text-xs font-bold px-2 py-1 bg-white border-2 border-indigo-500 rounded focus:outline-none shadow-sm"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  onClick={() => {
                                    setEditingCellId(`${g.id}-descricao`);
                                    setEditingValue(g.descricao);
                                  }}
                                  className="block cursor-pointer px-2 py-1 hover:bg-slate-100 rounded border border-transparent hover:border-gray-200 transition text-xs font-semibold text-slate-800"
                                  title="Clique para editar"
                                >
                                  {g.descricao}
                                </span>
                              )}
                            </td>

                            {/* Unit Price cell */}
                            <td className="py-2 px-1 text-right">
                              {isEditingValUnit ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={() => handleSaveInlineCell(g.id, 'valorUnitario', editingValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveInlineCell(g.id, 'valorUnitario', editingValue);
                                    } else if (e.key === 'Escape') {
                                      setEditingCellId(null);
                                    }
                                  }}
                                  className="w-full text-xs font-black text-right px-2 py-1 bg-white border-2 border-indigo-500 rounded focus:outline-none shadow-sm"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  onClick={() => {
                                    setEditingCellId(`${g.id}-valorUnitario`);
                                    setEditingValue(valUnit.toString());
                                  }}
                                  className="block cursor-pointer px-2 py-1 hover:bg-slate-100 rounded border border-transparent hover:border-gray-200 transition text-right text-xs font-bold text-slate-700"
                                  title="Clique para editar"
                                >
                                  {formatBRL(valUnit)}
                                </span>
                              )}
                            </td>

                            {/* Quantity cell */}
                            <td className="py-2 px-1 text-center">
                              {isEditingQty ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={() => handleSaveInlineCell(g.id, 'quantidade', editingValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveInlineCell(g.id, 'quantidade', editingValue);
                                    } else if (e.key === 'Escape') {
                                      setEditingCellId(null);
                                    }
                                  }}
                                  className="w-16 text-xs font-black text-center mx-auto px-2 py-1 bg-white border-2 border-indigo-500 rounded focus:outline-none shadow-sm"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  onClick={() => {
                                    setEditingCellId(`${g.id}-quantidade`);
                                    setEditingValue(qty.toString());
                                  }}
                                  className="block cursor-pointer px-2 py-1 hover:bg-slate-100 rounded border border-transparent hover:border-gray-200 transition text-center text-xs font-bold text-slate-700"
                                  title="Clique para editar"
                                >
                                  {qty.toString().replace('.', ',')}x
                                </span>
                              )}
                            </td>

                            {/* Total Price cell */}
                            <td className="py-2 px-1 text-right">
                              <span className="block px-2 py-1 text-xs font-black text-slate-900">
                                {formatBRL(valTotal)}
                              </span>
                            </td>

                            {/* Delete button */}
                            <td className="py-2 px-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteGasto(g.id)}
                                className="p-1 px-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-150 hover:border-rose-100 rounded-lg transition shrink-0 cursor-pointer"
                                title="Apagar despesa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Auto-summation Footer */}
                  <tfoot>
                    <tr className="border-t border-slate-100">
                      <td colSpan={3} className="py-2 px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Subtotal {cat}:
                      </td>
                      <td className="py-2 px-2 text-right text-[11px] font-black text-slate-800">
                        {formatBRL(catTotal)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={pendingDeleteGastoId !== null}
        onClose={() => setPendingDeleteGastoId(null)}
        onConfirm={confirmDeleteGasto}
        title="Excluir Despesa"
        message="Tem certeza que deseja apagar esta despesa?"
      />
    </motion.div>
  );
}

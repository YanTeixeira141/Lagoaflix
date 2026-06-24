import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { 
  ref as dbRef,
  set,
  get as dbGet,
  update,
  push,
  remove,
  onValue
} from 'firebase/database';
import {
  database,
  db,
  auth,
  googleProvider,
  isFirebaseOnline,
  UserProfile,
  Pagamento,
  Gasto,
  LogisticaInfo,
  Sugestao,
  PRESET_PROFILES,
  ParticipantProfile
} from './firebase';

interface FirebaseContextType {
  connectionMode: 'online' | 'offline_simulated';
  isFirebaseOnline: boolean;
  currentUser: UserProfile | null;
  googleUser: any;
  isAuthLoading: boolean;
  users: UserProfile[];
  pagamentos: Pagamento[];
  gastos: Gasto[];
  logistica: LogisticaInfo | null;
  sugestoes: Sugestao[];
  errorMsg: string | null;
  
  // Simple Password Auth Operations
  isAdminUnlocked: boolean;
  unlockAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  loginAdminWithGoogle: () => Promise<boolean>;
  linkUserProfile: (profileId: string) => Promise<void>;
  adminUids: string[];
  
  // Legacy Auth Operations for compatibility
  loginWithProfile: (profileId: string) => Promise<void>;
  loginGoogleDirect: () => Promise<void>;
  simulateGoogleLogin: (profileId: string, email: string, displayName: string) => void;
  onLoginSuccess: (simulatedUser: UserProfile) => void;
  logout: () => Promise<void>;
  clearError: () => void;
  
  // Firestore Operations (Online & Simulated)
  addPagamento: (valor: number, mesRef: string, comprovanteUrl: string, userId?: string) => Promise<void>;
  updatePagamentoStatus: (id: string, status: Pagamento['status']) => Promise<void>;
  deletePagamento: (id: string) => Promise<void>;
  
  addGasto: (categoria: Gasto['categoria'], descricao: string, valor: number) => Promise<void>;
  deleteGasto: (id: string) => Promise<void>;
  updateGasto: (id: string, updates: Partial<Gasto>) => Promise<void>;
  
  updateLogistica: (info: LogisticaInfo) => Promise<void>;
  
  addSugestao: (texto: string) => Promise<void>;
  deleteSugestao: (id: string) => Promise<void>;

  updateUserRole: (userId: string, role: 'admin' | 'user') => Promise<void>;
  updateTotalPagoOverride: (userId: string, total: number) => Promise<void>;
  updateUserAvatar: (userId: string, avatarUrl: string) => Promise<void>;
  addParticipante: (nome: string) => Promise<void>;
  updateUserNome: (userId: string, nome: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  pixKey: string;
  updatePixKey: (key: string) => Promise<void>;
  presetProfiles: ParticipantProfile[];
  savePresetProfiles: (profiles: ParticipantProfile[]) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within a FirebaseProvider');
  return context;
};

// Seed/Mock fallback data
const INITIAL_SIMULATED_USERS: UserProfile[] = PRESET_PROFILES.map((p) => ({
  id: p.id,
  nome: p.name,
  role: p.role,
  linkedUid: p.id === 'yan' ? 'mock-google-uid-yan' : null, // Yan is linked as demo
  email: p.id === 'yan' ? 'yan@google.com' : null,
  totalPago: p.id === 'yan' ? 500 : p.id === 'jullyanny' ? 300 : 0,
}));

const INITIAL_SIMULATED_PAGAMENTOS: Pagamento[] = [
  { id: 'pay_1', uid: 'yan', valor: 250, mesRef: 'Janeiro', status: 'aprovado', comprovanteUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400' },
  { id: 'pay_2', uid: 'yan', valor: 250, mesRef: 'Fevereiro', status: 'aprovado', comprovanteUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400' },
  { id: 'pay_3', uid: 'jullyanny', valor: 300, mesRef: 'Janeiro', status: 'aprovado', comprovanteUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400' },
  { id: 'pay_4', uid: 'enzo', valor: 250, mesRef: 'Janeiro', status: 'pendente', comprovanteUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400' },
];

const INITIAL_SIMULATED_GASTOS: Gasto[] = [
  { id: 'g_1', categoria: 'Moradia', descricao: 'Aluguel do Sítio Campo Limpo (Sinal)', valor: 2500 },
  { id: 'g_2', categoria: 'Transporte', descricao: 'Locação de Van Translado', valor: 650 },
  { id: 'g_3', categoria: 'Alimentação', descricao: 'Supermercado Café da Manhã', valor: 420 },
];

const INITIAL_SIMULATED_LOGISTICA: LogisticaInfo = {
  dataIda: '2026-11-18T20:00',
  dataVolta: '2026-11-21T15:00',
  enderecoPartida: 'Rua Paraibuna, 561 - QT. da Paineira, São Paulo/SP',
  enderecoDestino: 'Estrada Santa Clara, 435 - Estância São Paulo, Campo Limpo Paulista/SP',
  distanciaKm: 65,
  tempoEstimado: '1h 30m',
};

const INITIAL_SIMULATED_SUGESTOES: Sugestao[] = [
  { id: 's_1', texto: 'Fazer uma noite de fondue e massas com todo o grupo no sítio!' },
  { id: 's_2', texto: 'Fazer caminhadas na natureza ao redor do sítio pela manhã.' },
  { id: 's_3', texto: 'Aproveitar a piscina aquecida e organizar uma tarde de churrasco.' },
];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Database Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionMode, setConnectionMode] = useState<'online' | 'offline_simulated'>(
    isFirebaseOnline ? 'online' : 'offline_simulated'
  );
  
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    const unlocked = localStorage.getItem('bt_admin_unlocked') === 'true';
    if (unlocked) {
      const unlockedAt = localStorage.getItem('bt_unlocked_at');
      if (unlockedAt) {
        const timeDiff = Date.now() - parseInt(unlockedAt, 10);
        const fourHoursInMs = 4 * 60 * 60 * 1000;
        if (timeDiff > fourHoursInMs) {
          localStorage.removeItem('bt_admin_unlocked');
          localStorage.removeItem('bt_unlocked_at');
          return false;
        }
      } else {
        localStorage.setItem('bt_unlocked_at', Date.now().toString());
      }
    }
    return unlocked;
  });

  const setAdminUnlockedWithSession = (unlocked: boolean) => {
    setIsAdminUnlocked(unlocked);
    if (unlocked) {
      localStorage.setItem('bt_admin_unlocked', 'true');
      localStorage.setItem('bt_unlocked_at', Date.now().toString());
    } else {
      localStorage.removeItem('bt_admin_unlocked');
      localStorage.removeItem('bt_unlocked_at');
    }
  };

  const [presetProfiles, setPresetProfiles] = useState<ParticipantProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [adminUids, setAdminUids] = useState<string[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Core Data Lists
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [logistica, setLogistica] = useState<LogisticaInfo | null>(null);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [pixKey, setPixKey] = useState<string>('yan.turismo@viagemgrupo.com');

  const clearError = () => setErrorMsg(null);

  const addAdminUid = async (uid: string) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        const secRef = dbRef(database, 'config/seguranca');
        const snapshot = await dbGet(secRef);
        let adminUids: string[] = [];
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data && Array.isArray(data.adminUids)) {
            adminUids = data.adminUids;
          }
        }
        if (!adminUids.includes(uid)) {
          adminUids.push(uid);
          await set(secRef, { adminUids });
        }
      } catch (err) {
        console.warn("Failed to add admin uid to seguranca:", err);
      }
    }
  };

  const removeAdminUid = async (uid: string) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        const secRef = dbRef(database, 'config/seguranca');
        const snapshot = await dbGet(secRef);
        let adminUids: string[] = [];
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data && Array.isArray(data.adminUids)) {
            adminUids = data.adminUids;
          }
        }
        if (adminUids.includes(uid)) {
          adminUids = adminUids.filter(id => id !== uid);
          await set(secRef, { adminUids });
        }
      } catch (err) {
        console.warn("Failed to remove admin uid from seguranca:", err);
      }
    }
  };

  // Synchronize Auth sessions & perform automatic anonymous login under the hood
  useEffect(() => {
    if (connectionMode === 'online' && isFirebaseOnline && auth) {
      setIsAuthLoading(true);
      const unsub = onAuthStateChanged(auth, (gUser) => {
        setGoogleUser(gUser);
        if (!gUser) {
          signInAnonymously(auth)
            .catch(err => {
              console.error("Anonymous authentication failed:", err);
              setErrorMsg("Erro de conexão com o banco de dados.");
            })
            .finally(() => {
              setIsAuthLoading(false);
            });
        } else {
          setIsAuthLoading(false);
        }
      });
      return unsub;
    }
  }, [connectionMode]);

  // Keep adminUids empty as Google Auth is removed
  useEffect(() => {
    setAdminUids([]);
  }, []);

  // Read and maintain presetProfiles from database config/perfis_preset or fallback
  useEffect(() => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      const presetRef = dbRef(database, 'config/perfis_preset');
      const unsub = onValue(presetRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (Array.isArray(data)) {
            setPresetProfiles(data);
          } else if (data && typeof data === 'object') {
            setPresetProfiles(Object.values(data));
          }
        } else {
          setPresetProfiles(PRESET_PROFILES);
          set(presetRef, PRESET_PROFILES)
            .catch(err => console.warn("Failed to seed config/perfis_preset:", err));
        }
      });
      return unsub;
    } else {
      const stored = localStorage.getItem('sim_trip_perfis_preset');
      if (stored) {
        try {
          setPresetProfiles(JSON.parse(stored));
        } catch {
          setPresetProfiles(PRESET_PROFILES);
        }
      } else {
        setPresetProfiles(PRESET_PROFILES);
        localStorage.setItem('sim_trip_perfis_preset', JSON.stringify(PRESET_PROFILES));
      }
    }
  }, [connectionMode]);

  const savePresetProfiles = async (newProfiles: ParticipantProfile[]) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      const presetRef = dbRef(database, 'config/perfis_preset');
      await set(presetRef, newProfiles);
    } else {
      localStorage.setItem('sim_trip_perfis_preset', JSON.stringify(newProfiles));
      setPresetProfiles(newProfiles);
    }
  };

  // Synchronize current user profile dynamically in real-time
  useEffect(() => {
    if (connectionMode === 'online' && isFirebaseOnline && auth) {
      if (googleUser) {
        const linkedProfile = users.find(u => u.linkedUid === googleUser.uid);

        if (linkedProfile) {
          setCurrentUser(linkedProfile);
        } else if (isAdminUnlocked) {
          setCurrentUser({
            id: 'admin_coord',
            nome: 'Coordenador',
            role: 'admin',
            linkedUid: googleUser.uid,
            email: '',
            totalPago: 0
          });
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } else if (connectionMode === 'offline_simulated') {
      if (isAdminUnlocked) {
        setCurrentUser({
          id: 'teste_admin',
          nome: 'Teste Admin',
          role: 'admin',
          linkedUid: 'simulado123',
          email: 'teste@admin.com',
          totalPago: 0
        });
      } else {
        const activeProfileId = localStorage.getItem('bt_profile_id');
        if (activeProfileId) {
          const profile = users.find(u => u.id === activeProfileId);
          if (profile) {
            setCurrentUser(profile);
          } else {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
    }
  }, [isAdminUnlocked, googleUser, users, connectionMode]);

  // Initialize and run offline setup if in simulation mode
  useEffect(() => {
    setIsAuthLoading(false);
    if (connectionMode === 'offline_simulated') {
      setupOfflineSimulatedMode();
    }
  }, [connectionMode]);

  const unlockAdmin = (password: string): boolean => {
    const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    if (password === expectedPassword) {
      setAdminUnlockedWithSession(true);
      setErrorMsg(null);
      return true;
    } else {
      setErrorMsg('Senha incorreta! Digite a senha administrativa correta.');
      return false;
    }
  };

  const loginAdminWithGoogle = async (): Promise<boolean> => {
    // Deprecated in favor of simple password unlockAdmin
    return false;
  };

  const logoutAdmin = () => {
    setAdminUnlockedWithSession(false);
  };

  const linkUserProfile = async (profileId: string) => {
    setErrorMsg(null);
    if (connectionMode === 'online' && isFirebaseOnline && auth && database) {
      let gUser = auth.currentUser;
      if (!gUser) {
        try {
          setIsAuthLoading(true);
          gUser = (await signInAnonymously(auth)).user;
          setGoogleUser(gUser);
        } catch (err: any) {
          setErrorMsg(err.message || 'Falha ao autenticar.');
          setIsAuthLoading(false);
          return;
        }
      }
      if (!gUser) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const userRef = dbRef(database, `users/${profileId}`);
        const snapshot = await dbGet(userRef);
        if (snapshot.exists()) {
          const pData = snapshot.val() as UserProfile;
          if (!pData.linkedUid) {
            await update(userRef, { linkedUid: gUser.uid, email: null });
          } else if (pData.linkedUid !== gUser.uid) {
            setErrorMsg(`Este perfil já está vinculado a outra conta.`);
          }
        }
        setIsAuthLoading(false);
      } catch (err: any) {
        setErrorMsg(err.message || 'Falha ao vincular perfil.');
        setIsAuthLoading(false);
      }
    } else if (connectionMode === 'offline_simulated') {
      const sUsers = getSimulatedValue('users', INITIAL_SIMULATED_USERS);
      const pIdx = sUsers.findIndex(u => u.id === profileId);
      if (pIdx !== -1) {
        const pData = sUsers[pIdx];
        const simUid = `mock-google-uid-${profileId}`;
        const updated = { ...pData, linkedUid: simUid, email: `${profileId}@google.com` };
        sUsers[pIdx] = updated;
        saveAndSetSimulatedData('users', sUsers, setUsers);
        localStorage.setItem('bt_profile_id', profileId);
        setCurrentUser(updated);
        setGoogleUser({ uid: simUid, email: `${profileId}@google.com`, displayName: pData.nome });
      }
    }
  };

  // Synchronize database collections in real-time in Online Mode for public reading
  useEffect(() => {
    const isOnline = connectionMode === 'online' && isFirebaseOnline && database;

    if (!isOnline) return;

    // Active collection listeners
    const unsubUsers = onValue(dbRef(database, 'users'), (snap) => {
      const uList: UserProfile[] = [];
      if (snap.exists()) {
        snap.forEach((childSnap) => {
          uList.push(childSnap.val() as UserProfile);
        });
      }
      
      // If our list is completely empty, write the initial preset users for easy onboarding!
      if (uList.length === 0) {
        const isAdminUser = currentUser && currentUser.role === 'admin';
        const isAuthAdmin = auth && auth.currentUser && adminUids.includes(auth.currentUser.uid);
        if (isAdminUser || isAuthAdmin) {
          const profilesToSeed = presetProfiles.length > 0 ? presetProfiles : PRESET_PROFILES;
          profilesToSeed.forEach(async (p) => {
            if (p.id !== 'teste_admin') {
              try {
                await set(dbRef(database, `users/${p.id}`), {
                  id: p.id,
                  nome: p.name,
                  role: p.role,
                  linkedUid: null,
                  email: null,
                  totalPago: 0
                });
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, `users/${p.id}`);
              }
            }
          });
        }
      } else {
        setUsers(uList);
      }
    }, (error) => {
      console.warn("Users database snapshot read warning (Permissions/Offline):", error);
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    const unsubPagamentos = onValue(dbRef(database, 'pagamentos'), (snap) => {
      const pList: Pagamento[] = [];
      if (snap.exists()) {
        snap.forEach((childSnap) => {
          const data = childSnap.val();
          pList.push({ id: childSnap.key, ...data } as Pagamento);
        });
      }
      setPagamentos(pList);
    }, (error) => {
      console.warn("Pagamentos snapshot warning:", error);
      handleFirestoreError(error, OperationType.GET, 'pagamentos');
    });

    const unsubGastos = onValue(dbRef(database, 'gastos'), (snap) => {
      const gList: Gasto[] = [];
      if (snap.exists()) {
        snap.forEach((childSnap) => {
          const data = childSnap.val();
          gList.push({ id: childSnap.key, ...data } as Gasto);
        });
      }
      setGastos(gList);
    }, (error) => {
      console.warn("Gastos snapshot warning:", error);
      handleFirestoreError(error, OperationType.GET, 'gastos');
    });

    const unsubLogistica = onValue(dbRef(database, 'logistica/viagem_info'), (docSnap) => {
      if (docSnap.exists()) {
        setLogistica(docSnap.val() as LogisticaInfo);
      } else {
        // If no logistics defined, seed it!
        if (currentUser && currentUser.role === 'admin') {
          set(dbRef(database, 'logistica/viagem_info'), INITIAL_SIMULATED_LOGISTICA).then(() => {
            setLogistica(INITIAL_SIMULATED_LOGISTICA);
          }).catch(err => {
            console.warn("Setting logistics seed warning:", err);
            handleFirestoreError(err, OperationType.WRITE, 'logistica/viagem_info');
          });
        }
      }
    }, (error) => {
      console.warn("Logistica snapshot warning:", error);
      handleFirestoreError(error, OperationType.GET, 'logistica/viagem_info');
    });

    const unsubSugestoes = onValue(dbRef(database, 'sugestoes'), (snap) => {
      const sList: Sugestao[] = [];
      if (snap.exists()) {
        snap.forEach((childSnap) => {
          const data = childSnap.val();
          sList.push({ id: childSnap.key, ...data } as Sugestao);
        });
      }
      setSugestoes(sList);
    }, (error) => {
      console.warn("Sugestoes snapshot warning:", error);
      handleFirestoreError(error, OperationType.GET, 'sugestoes');
    });

    const unsubPix = onValue(dbRef(database, 'configuracoes/pagamento'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.val();
        if (data && data.chave) {
          setPixKey(data.chave);
        }
      } else {
        if (currentUser && currentUser.role === 'admin') {
          set(dbRef(database, 'configuracoes/pagamento'), { chave: 'yan.turismo@viagemgrupo.com' }).then(() => {
            setPixKey('yan.turismo@viagemgrupo.com');
          }).catch(err => {
            console.warn("Setting pix seed warning:", err);
            handleFirestoreError(err, OperationType.WRITE, 'configuracoes/pagamento');
          });
        }
      }
    }, (error) => {
      console.warn("Configuracoes snapshot warning:", error);
      handleFirestoreError(error, OperationType.GET, 'configuracoes/pagamento');
    });

    return () => {
      unsubUsers();
      unsubPagamentos();
      unsubGastos();
      unsubLogistica();
      unsubSugestoes();
      unsubPix();
    };
  }, [connectionMode, googleUser, currentUser]);

  // Recalculates total paid value automatically when approved payments change (Only in Online Mode)
  useEffect(() => {
    if (connectionMode !== 'online' || !database || pagamentos.length === 0 || users.length === 0) return;
    
    // We update every user's totalPago based on approved status payments
    const approvedPayments = pagamentos.filter(p => p.status === 'aprovado');
    users.forEach(async (u) => {
      const sum = approvedPayments
        .filter(p => p.uid === u.id)
        .reduce((acc, curr) => acc + Number(curr.valor), 0);
      if (u.totalPago !== sum) {
        const isSelf = currentUser && currentUser.id === u.id;
        const isAdminUser = currentUser && currentUser.role === 'admin';
        if (isSelf || isAdminUser) {
          try {
            await update(dbRef(database, `users/${u.id}`), { totalPago: sum });
          } catch (err) {
            console.error("Failed to sync approved payments total:", err);
            handleFirestoreError(err, OperationType.UPDATE, `users/${u.id}`);
          }
        }
      }
    });
  }, [pagamentos, connectionMode, currentUser, users]);

  // Recalculates total paid in Simulated offline mode
  useEffect(() => {
    if (connectionMode !== 'offline_simulated') return;
    
    const approvedPayments = pagamentos.filter(p => p.status === 'aprovado');
    let hasChanged = false;
    const nextUsers = users.map(u => {
      const sum = approvedPayments
        .filter(p => p.uid === u.id)
        .reduce((acc, curr) => acc + Number(curr.valor), 0);
      if (u.totalPago !== sum) {
        hasChanged = true;
        return { ...u, totalPago: sum };
      }
      return u;
    });

    if (hasChanged && nextUsers.length > 0) {
      saveAndSetSimulatedData('users', nextUsers, setUsers);
      if (currentUser) {
        const freshUser = nextUsers.find(u => u.id === currentUser.id);
        if (freshUser) {
          setCurrentUser(freshUser);
        }
      }
    }
  }, [pagamentos, connectionMode]);

  // Offline initializer
  const setupOfflineSimulatedMode = () => {
    setConnectionMode('offline_simulated');
    setIsAuthLoading(true);

    const sUsers = getSimulatedValue('users', INITIAL_SIMULATED_USERS);
    const sPagamentos = getSimulatedValue('pagamentos', INITIAL_SIMULATED_PAGAMENTOS);
    const sGastos = getSimulatedValue('gastos', INITIAL_SIMULATED_GASTOS);
    const sLogistica = getSimulatedValue('logistica', INITIAL_SIMULATED_LOGISTICA);
    const sSugestoes = getSimulatedValue('sugestoes', INITIAL_SIMULATED_SUGESTOES);
    const sPix = localStorage.getItem('sim_trip_pix_key') || 'yan.turismo@viagemgrupo.com';

    setUsers(sUsers);
    setPagamentos(sPagamentos);
    setGastos(sGastos);
    setLogistica(sLogistica);
    setSugestoes(sSugestoes);
    setPixKey(sPix);

    // Profile loading from storage
    const activeProfileId = localStorage.getItem('bt_profile_id');
    const isMockAuth = localStorage.getItem('bt_sim_auth') === 'true';
    const isBypass = localStorage.getItem('bt_bypass_auth') === 'true';

    if (activeProfileId === 'teste_admin' || isBypass) {
      setCurrentUser({
        id: 'teste_admin',
        nome: 'Teste Admin',
        role: 'admin',
        linkedUid: 'simulado123',
        email: 'teste@admin.com',
        totalPago: 0
      });
      setGoogleUser({ uid: 'simulado123', email: 'teste@admin.com', displayName: 'Teste Admin' });
    } else if (activeProfileId && isMockAuth) {
      const profile = sUsers.find(u => u.id === activeProfileId);
      if (profile) {
        // Validate mock uid is linked correctly or free
        setCurrentUser(profile);
        setGoogleUser({ uid: `mock-google-uid-${profile.id}`, email: `${profile.id}@google.com`, displayName: profile.nome });
      } else {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
    
    setIsAuthLoading(false);
  };

  const getSimulatedValue = <T,>(key: string, backup: T): T => {
    const value = localStorage.getItem(`sim_trip_${key}`);
    if (value) {
      try { return JSON.parse(value); } catch (_) { return backup; }
    }
    localStorage.setItem(`sim_trip_${key}`, JSON.stringify(backup));
    return backup;
  };

  const saveAndSetSimulatedData = <T,>(key: string, value: T, setter: (val: T) => void) => {
    localStorage.setItem(`sim_trip_${key}`, JSON.stringify(value));
    setter(value);
  };

  // Login click profile logic
  const loginWithProfile = async (profileId: string) => {
    // Legacy support, no-op or trigger unlock
  };

  // Direct Google Login without preset profile restrictions
  const loginGoogleDirect = async () => {
    // Legacy support, no-op or trigger unlock
  };

  // Function to explicitly simulate logging in with different google variables if offline
  const simulateGoogleLogin = (profileId: string, googleEmail: string, gName: string) => {
    // Legacy support
  };

  const onLoginSuccess = (simulatedUser: UserProfile) => {
    // Legacy support
  };

  const logout = async () => {
    logoutAdmin();
  };

  // CRUD FOR COMPROVANTES DE PAGAMENTO
  const addPagamento = async (valor: number, mesRef: string, comprovanteUrl: string, userId?: string) => {
    const finalUserId = userId || currentUser?.id;
    if (!finalUserId) throw new Error('Operação negada: participante não selecionado.');
    
    const newPayment = {
      uid: finalUserId, // linked profile ID (like 'yan')
      valor: Number(valor),
      mesRef,
      comprovanteUrl: comprovanteUrl || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400',
      status: 'pendente' as const
    };

    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        const newItemRef = push(dbRef(database, 'pagamentos'));
        const itemWithId = { ...newPayment, id: newItemRef.key };
        await set(newItemRef, itemWithId);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'pagamentos');
      }
    } else {
      const currentList = getSimulatedValue('pagamentos', INITIAL_SIMULATED_PAGAMENTOS);
      const added = { id: `pay_${Date.now()}`, ...newPayment };
      saveAndSetSimulatedData('pagamentos', [...currentList, added], setPagamentos);
    }
  };

  const updatePagamentoStatus = async (id: string, status: Pagamento['status']) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        await update(dbRef(database, `pagamentos/${id}`), { status });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `pagamentos/${id}`);
      }
    } else {
      const currentList = getSimulatedValue('pagamentos', INITIAL_SIMULATED_PAGAMENTOS);
      const updated = currentList.map(p => p.id === id ? { ...p, status } : p);
      saveAndSetSimulatedData('pagamentos', updated, setPagamentos);
    }
  };

  const deletePagamento = async (id: string) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        await remove(dbRef(database, `pagamentos/${id}`));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `pagamentos/${id}`);
      }
    } else {
      const currentList = getSimulatedValue('pagamentos', INITIAL_SIMULATED_PAGAMENTOS);
      const filtered = currentList.filter(p => p.id !== id);
      saveAndSetSimulatedData('pagamentos', filtered, setPagamentos);
    }
  };

  // CRUD FOR EXPENSES/GASTOS
  const addGasto = async (categoria: Gasto['categoria'], descricao: string, valor: number) => {
    const payload = {
      categoria,
      descricao,
      valorUnitario: 0,
      quantidade: 1,
      valor: Number(valor)
    };

    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        const newItemRef = push(dbRef(database, 'gastos'));
        const itemWithId = { ...payload, id: newItemRef.key };
        await set(newItemRef, itemWithId);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'gastos');
      }
    } else {
      const currentList = getSimulatedValue('gastos', INITIAL_SIMULATED_GASTOS);
      const added = { id: `g_${Date.now()}`, ...payload };
      saveAndSetSimulatedData('gastos', [...currentList, added], setGastos);
    }
  };

  const deleteGasto = async (id: string) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        await remove(dbRef(database, `gastos/${id}`));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `gastos/${id}`);
      }
    } else {
      const currentList = getSimulatedValue('gastos', INITIAL_SIMULATED_GASTOS);
      const filtered = currentList.filter(g => g.id !== id);
      saveAndSetSimulatedData('gastos', filtered, setGastos);
    }
  };

  const updateGasto = async (id: string, updates: Partial<Gasto>) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        await update(dbRef(database, `gastos/${id}`), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `gastos/${id}`);
      }
    } else {
      const currentList = getSimulatedValue('gastos', INITIAL_SIMULATED_GASTOS);
      const updated = currentList.map(g => g.id === id ? { ...g, ...updates } : g);
      saveAndSetSimulatedData('gastos', updated, setGastos);
    }
  };

  // UPDATE TRIP LOGISTICS INFO (Single doc viagem_info)
  const updateLogistica = async (info: LogisticaInfo) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        await set(dbRef(database, 'logistica/viagem_info'), info);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'logistica/viagem_info');
      }
    } else {
      saveAndSetSimulatedData('logistica', info, setLogistica);
    }
  };

  // CRUD FOR SUGGESTIONS
  const addSugestao = async (texto: string) => {
    const payload = { texto };
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        const newItemRef = push(dbRef(database, 'sugestoes'));
        const itemWithId = { ...payload, id: newItemRef.key };
        await set(newItemRef, itemWithId);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'sugestoes');
      }
    } else {
      const currentList = getSimulatedValue('sugestoes', INITIAL_SIMULATED_SUGESTOES);
      const added = { id: `s_${Date.now()}`, ...payload };
      saveAndSetSimulatedData('sugestoes', [...currentList, added], setSugestoes);
    }
  };

  const deleteSugestao = async (id: string) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        await remove(dbRef(database, `sugestoes/${id}`));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `sugestoes/${id}`);
      }
    } else {
      const currentList = getSimulatedValue('sugestoes', INITIAL_SIMULATED_SUGESTOES);
      const filtered = currentList.filter(s => s.id !== id);
      saveAndSetSimulatedData('sugestoes', filtered, setSugestoes);
    }
  };

  // UPDATE ROLE FOR USER (Admin setting permissions)
  const updateUserRole = async (userId: string, role: 'admin' | 'user') => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        const uRef = dbRef(database, `users/${userId}`);
        await update(uRef, { role });
        
        const targetUser = users.find(u => u.id === userId);
        if (targetUser && targetUser.linkedUid) {
          if (role === 'admin') {
            await addAdminUid(targetUser.linkedUid);
          } else {
            await removeAdminUid(targetUser.linkedUid);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      }
    } else {
      const currentList = getSimulatedValue('users', INITIAL_SIMULATED_USERS);
      const updated = currentList.map(u => u.id === userId ? { ...u, role } : u);
      saveAndSetSimulatedData('users', updated, setUsers);
      
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({ ...currentUser, role });
      }
    }
  };

  // MANUAL FORCE OVERRIDE Total Pago (if needed, or calculated)
  const updateTotalPagoOverride = async (userId: string, total: number) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        await update(dbRef(database, `users/${userId}`), { totalPago: Number(total) });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      }
    } else {
      const currentList = getSimulatedValue('users', INITIAL_SIMULATED_USERS);
      const updated = currentList.map(u => u.id === userId ? { ...u, totalPago: Number(total) } : u);
      saveAndSetSimulatedData('users', updated, setUsers);
      
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({ ...currentUser, totalPago: Number(total) });
      }
    }
  };

  const updateUserAvatar = async (userId: string, avatarUrl: string) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        await update(dbRef(database, `users/${userId}`), { avatarUrl });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      }
    } else {
      const currentList = getSimulatedValue('users', INITIAL_SIMULATED_USERS);
      const updated = currentList.map(u => u.id === userId ? { ...u, avatarUrl } : u);
      saveAndSetSimulatedData('users', updated, setUsers);
    }
    
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, avatarUrl } : null);
    }
  };

  const addParticipante = async (nome: string) => {
    const payload = {
      id: `u_${Date.now()}`,
      nome,
      role: 'user' as const,
      linkedUid: null,
      email: null,
      totalPago: 0
    };

    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        await set(dbRef(database, `users/${payload.id}`), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${payload.id}`);
      }
    } else {
      const currentList = getSimulatedValue('users', INITIAL_SIMULATED_USERS);
      saveAndSetSimulatedData('users', [...currentList, payload], setUsers);
    }
  };

  const updateUserNome = async (userId: string, nome: string) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        await update(dbRef(database, `users/${userId}`), { nome });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      }
    } else {
      const currentList = getSimulatedValue('users', INITIAL_SIMULATED_USERS);
      const updated = currentList.map(u => u.id === userId ? { ...u, nome } : u);
      saveAndSetSimulatedData('users', updated, setUsers);
      
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, nome } : null);
      }
    }
  };

  const deleteUser = async (userId: string) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        await remove(dbRef(database, `users/${userId}`));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
      }
    } else {
      const currentList = getSimulatedValue('users', INITIAL_SIMULATED_USERS);
      const updated = currentList.filter(u => u.id !== userId);
      saveAndSetSimulatedData('users', updated, setUsers);
    }
  };

  const updatePixKey = async (key: string) => {
    if (connectionMode === 'online' && isFirebaseOnline && database) {
      try {
        await set(dbRef(database, 'configuracoes/pagamento'), { chave: key });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'configuracoes/pagamento');
      }
    } else {
      localStorage.setItem('sim_trip_pix_key', key);
      setPixKey(key);
    }
  };

  return (
    <FirebaseContext.Provider value={{
      connectionMode,
      isFirebaseOnline,
      currentUser,
      googleUser,
      isAuthLoading,
      users,
      pagamentos,
      gastos,
      logistica,
      sugestoes,
      errorMsg,
      isAdminUnlocked,
      unlockAdmin,
      logoutAdmin,
      loginAdminWithGoogle,
      linkUserProfile,
      adminUids,
      loginWithProfile,
      loginGoogleDirect,
      simulateGoogleLogin,
      onLoginSuccess,
      logout,
      clearError,
      addPagamento,
      updatePagamentoStatus,
      deletePagamento,
      addGasto,
      deleteGasto,
      updateGasto,
      updateLogistica,
      addSugestao,
      deleteSugestao,
      updateUserRole,
      updateTotalPagoOverride,
      updateUserAvatar,
      addParticipante,
      updateUserNome,
      deleteUser,
      pixKey,
      updatePixKey,
      presetProfiles,
      savePresetProfiles
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

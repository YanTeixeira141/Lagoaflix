// Interfaces based on exact user specification
export interface UserProfile {
  id: string; // e.g. "yan", "jullyanny", same as preset profiles
  nome: string;
  role: 'admin' | 'user';
  linkedUid: string | null;
  email: string | null;
  totalPago: number;
  avatarUrl?: string;
}

export interface Pagamento {
  id: string;
  uid: string; // participant profile id, e.g. "yan"
  valor: number;
  mesRef: string;
  comprovanteUrl: string;
  status: 'pendente' | 'aprovado' | 'recusado';
}

export interface Gasto {
  id: string;
  categoria: 'Moradia' | 'Transporte' | 'Alimentação' | 'Outros';
  descricao: string;
  valorUnitario: number;
  quantidade: number;
  valor: number; // valor total, sempre recalculado como valorUnitario * quantidade
}

export interface LogisticaInfo {
  dataIda: string;
  dataVolta: string;
  enderecoPartida: string;
  enderecoDestino: string;
  distanciaKm: number;
  tempoEstimado: string;
}

export interface Sugestao {
  id: string;
  texto: string; // anonymous text
}

// Preset Profiles (Netflix Style)
export interface ParticipantProfile {
  id: string;
  name: string;
  role: 'admin' | 'user';
  color: string;
}

export const PRESET_PROFILES: ParticipantProfile[] = [
  { id: 'yan', name: 'Yan', role: 'admin', color: 'bg-slate-500 hover:ring-slate-400' },
  { id: 'jullyanny', name: 'Jullyanny', role: 'user', color: 'bg-slate-500 hover:ring-slate-400' },
  { id: 'enzo', name: 'Enzo', role: 'user', color: 'bg-slate-500 hover:ring-slate-400' },
  { id: 'kevyen', name: 'Kevyen', role: 'user', color: 'bg-slate-500 hover:ring-slate-400' },
  { id: 'amanda', name: 'Amanda', role: 'user', color: 'bg-slate-500 hover:ring-slate-400' },
  { id: 'leandro', name: 'Leandro', role: 'user', color: 'bg-slate-500 hover:ring-slate-400' },
  { id: 'thiago', name: 'Thiago', role: 'user', color: 'bg-slate-500 hover:ring-slate-400' },
  { id: 'joao', name: 'João', role: 'user', color: 'bg-slate-500 hover:ring-slate-400' },
  { id: 'gisandri', name: 'Gi Sandri', role: 'user', color: 'bg-slate-500 hover:ring-slate-400' },
  { id: 'namodagi', name: 'Namo da Gi', role: 'user', color: 'bg-slate-500 hover:ring-slate-400' },
];

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Firebase Config from import.meta.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ai-studio-0846c333-4d1b-41a3-97e1-ab697fceee09'}-default-rtdb.firebaseio.com`,
};

// Check if credentials are valid for online operations
export const isFirebaseOnline = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.trim() !== ""
);

let app;
let database: any = null;
let db: any = null; // Alias for backward compatibility
let auth: any = null;
let storage: any = null;
let googleProvider: any = null;

if (isFirebaseOnline) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    database = getDatabase(app);
    db = database;
    auth = getAuth(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Failed to initialize Firebase SDK:", error);
  }
}

export { database, db, auth, storage, googleProvider };

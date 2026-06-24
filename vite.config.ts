import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config from firebase-applet-config.json
let firebaseConfig: Record<string, string> = {};
try {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn("Could not read firebase-applet-config.json in vite.config.ts", e);
}

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(
      process.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey || ''
    ),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(
      process.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain || ''
    ),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(
      process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || ''
    ),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(
      process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || ''
    ),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId || ''
    ),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(
      process.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId || ''
    ),
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});

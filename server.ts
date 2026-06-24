import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing and URL encoding middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Route 1: Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // API Route 2: Firebase configuration endpoint
  app.get('/api/firebase-config', (req, res) => {
    let config = {
      apiKey: process.env['VITE_FIREBASE_API_KEY'] || process.env['FIREBASE_API_KEY'] || '',
      authDomain: process.env['VITE_FIREBASE_AUTH_DOMAIN'] || process.env['FIREBASE_AUTH_DOMAIN'] || '',
      projectId: process.env['VITE_FIREBASE_PROJECT_ID'] || process.env['FIREBASE_PROJECT_ID'] || '',
      storageBucket: process.env['VITE_FIREBASE_STORAGE_BUCKET'] || process.env['FIREBASE_STORAGE_BUCKET'] || '',
      messagingSenderId: process.env['VITE_FIREBASE_MESSAGING_SENDER_ID'] || process.env['FIREBASE_MESSAGING_SENDER_ID'] || '',
      appId: process.env['VITE_FIREBASE_APP_ID'] || process.env['FIREBASE_APP_ID'] || ''
    };

    try {
      const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config = {
          apiKey: fileConfig.apiKey || config.apiKey,
          authDomain: fileConfig.authDomain || config.authDomain,
          projectId: fileConfig.projectId || config.projectId,
          storageBucket: fileConfig.storageBucket || config.storageBucket,
          messagingSenderId: fileConfig.messagingSenderId || config.messagingSenderId,
          appId: fileConfig.appId || config.appId
        };
      }
    } catch (e) {
      console.warn("Failed to read firebase-applet-config.json:", e);
    }

    res.json(config);
  });

  // Serve Frontend depending on environment
  if (process.env.NODE_ENV !== 'production') {
    // Development mode with Vite Middleware
    console.log('Loading Vite middleware in development mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode serving pre-compiled static files
    console.log('Serving pre-compiled static files in production mode...');
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      index: false,
      redirect: false,
    }));
    
    // Fallback for Single Page App client routing
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Node Express full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

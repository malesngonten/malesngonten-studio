import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  // Binds to 0.0.0.0 for AI Studio container dev environment
  const HOST = '0.0.0.0';
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount API endpoints
  app.use('/api', apiRouter);

  if (!isProd) {
    // Development mode: use Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve static files from dist
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Males Ngonten Studio] Server started at http://127.0.0.1:${PORT}`);
    console.log(`[Males Ngonten Studio] Bound to ${HOST}:${PORT} (BYOK local-first architecture)`);
  });
}

startServer().catch((err) => {
  console.error('[Males Ngonten Studio] Failed to start server:', err);
  process.exit(1);
});

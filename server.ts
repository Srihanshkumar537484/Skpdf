import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// --- ZERO API KEY LOCAL DOCUMENT ENDPOINTS ---
// All inference and processing runs 100% locally with zero external API dependencies.

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mode: 'zero-api-key-local',
    app: 'SkPDF'
  });
});

// --- VITE DEV MIDDLEWARE OR STATIC PRODUCTION SERVING ---
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving for Vercel/Node deployment
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`SkPDF Zero-API-Key server running on http://0.0.0.0:${port}`);
  });
}

startServer();

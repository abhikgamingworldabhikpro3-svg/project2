import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDiagram, deepThinkProblem } from './server/geminiService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// API Endpoints for Gemini
app.post('/api/gemini/generate-diagram', async (req, res) => {
  try {
    const { prompt, aspectRatio, imageSize } = req.body;
    const result = await generateDiagram({ prompt, aspectRatio, imageSize });
    res.json(result);
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({ error: error.message || 'Image generation failed' });
  }
});

app.post('/api/gemini/deep-think', async (req, res) => {
  try {
    const { query, subject, targetAudience } = req.body;
    const result = await deepThinkProblem({ query, subject, targetAudience });
    res.json(result);
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({ error: error.message || 'Deep thinking failed' });
  }
});

// Serve Vite build assets
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`TutorFlow production server running on port ${PORT}`);
});

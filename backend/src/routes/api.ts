import { Router, Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { crawlPower55, exportResults } from '../services/crawler';
import { analyseResults, exportAnalysis } from '../services/analyser';
import { exportPrediction } from '../services/predictor';

const DATA_FILE = path.resolve(__dirname, '../../data/power-55-result.json');

export const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Vietlott Analyser API' });
});

// GET /api/results — return all draw results from the data file
router.get('/results', async (_req: Request, res: Response) => {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    res.json(JSON.parse(raw));
  } catch {
    res.status(404).json({ error: 'Data file not found. Run /api/crawl first.' });
  }
});

// GET /api/analyse — compute and return analysis of all draw results
router.get('/analyse', async (_req: Request, res: Response) => {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const { results } = JSON.parse(raw);
    res.json(analyseResults(results));
  } catch {
    res.status(404).json({ error: 'Data file not found. Run /api/crawl first.' });
  }
});

// POST /api/analyse/export — run analysis and export result to power-55-analyse.json
router.post('/analyse/export', async (_req: Request, res: Response) => {
  try {
    const { file, totalDraws } = await exportAnalysis();
    res.json({ success: true, file, totalDraws });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/predict/export — run prediction and export to power-55-predict.json
router.post('/predict/export', async (_req: Request, res: Response) => {
  try {
    const { file, predictedNumbers, generatedAt } = await exportPrediction();
    res.json({ success: true, file, predictedNumbers, generatedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/crawl  — crawl all Power 6/55 results and export to power-55-result.json
router.post('/crawl', async (_req: Request, res: Response) => {
  try {
    console.log('[crawl] Starting Power 6/55 crawl...');

    const { results, newCount } = await crawlPower55((page, total) => {
      console.log(`[crawl] Page ${page + 1}/${total}`);
    });

    const filePath = await exportResults(results);
    console.log(`[crawl] Done. ${newCount} new results, ${results.length} total. Exported to ${filePath}`);

    res.json({
      success: true,
      newCount,
      totalCount: results.length,
      file: 'power-55-result.json',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[crawl] Error:', message);
    res.status(500).json({ success: false, error: message });
  }
});

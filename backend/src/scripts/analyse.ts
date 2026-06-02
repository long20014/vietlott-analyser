import { exportAnalysis } from '../services/analyser';

(async () => {
  console.log('[analyse] Running analysis...');
  const { file, totalDraws } = await exportAnalysis();
  console.log(`[analyse] Done. ${totalDraws} draws analysed. Exported to ${file}`);
})().catch((err) => {
  console.error('[analyse] Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

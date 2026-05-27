import { crawlPower55, exportResults } from '../services/crawler';

(async () => {
  console.log('[crawl] Starting Power 6/55 crawl...');
  const { results, newCount } = await crawlPower55((page, total) => {
    console.log(`[crawl] Page ${page + 1}/${total}`);
  });
  const filePath = await exportResults(results);
  console.log(`[crawl] Done. ${newCount} new results, ${results.length} total. Exported to ${filePath}`);
})().catch((err) => {
  console.error('[crawl] Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

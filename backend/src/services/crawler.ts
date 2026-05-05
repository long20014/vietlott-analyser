import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

const BASE_URL = 'https://vietlott.vn';
const PAGE_URL = `${BASE_URL}/vi/trung-thuong/ket-qua-trung-thuong/winning-number-655`;
const AJAXPRO_URL = `${BASE_URL}/ajaxpro/Vietlott.PlugIn.WebParts.Game655CompareWebPart,Vietlott.PlugIn.WebParts.ashx`;
const OUTPUT_FILE = path.resolve(__dirname, '../../data/power-55-result.json');

const RENDER_INFO = {
  SiteId: 'main.frontend.vi',
  SiteAlias: 'main.vi',
  UserSessionId: '',
  SiteLang: 'vi',
  IsPageDesign: false,
  ExtraParam1: '',
  ExtraParam2: '',
  ExtraParam3: '',
  SiteURL: '',
  WebPage: null,
  SiteName: 'Vietlott',
  OrgPageAlias: null,
  PageAlias: null,
  FullPageAlias: null,
  RefKey: null,
  System: 1,
};

// The page uses a 5×18 matrix of empty strings as the "no filter" state
const ARR_NUMBERS: string[][] = Array(5).fill(null).map(() => Array(18).fill(''));

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export interface DrawResult {
  numbers: number[];
  date: string;
}

async function getCookies(): Promise<string> {
  const resp = await axios.get(PAGE_URL, {
    headers: { 'User-Agent': USER_AGENT },
  });
  const setCookie = resp.headers['set-cookie'] as string[] | undefined;
  if (!setCookie) return '';
  return setCookie.map((c) => c.split(';')[0]).join('; ');
}

async function fetchPage(pageIndex: number, cookies: string): Promise<{ results: DrawResult[]; totalPages: number }> {
  const body = JSON.stringify({
    ORenderInfo: RENDER_INFO,
    Key: '2148dafe',
    GameDrawId: '',
    ArrayNumbers: ARR_NUMBERS,
    CheckMulti: false,
    PageIndex: pageIndex,
  });

  const resp = await axios.post(AJAXPRO_URL, body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-AjaxPro-Method': 'ServerSideDrawResult',
      Cookie: cookies,
      'User-Agent': USER_AGENT,
      Referer: PAGE_URL,
    },
  });

  const value = resp.data?.value;
  if (!value || value.Error) {
    throw new Error(value?.InfoMessage ?? 'Unknown API error');
  }

  const $ = cheerio.load(value.HtmlContent as string);
  const results: DrawResult[] = [];

  $('tbody tr').each((_, row) => {
    const tds = $(row).find('td');
    const dateRaw = $(tds[0]).text().trim(); // DD/MM/YYYY
    const numbers = $(tds[2])
      .find('span')
      .filter((_, el) => {
        const cls = $(el).attr('class') ?? '';
        return cls.includes('bong_tron') && !cls.includes('bong_tron-sperator');
      })
      .map((_, el) => parseInt($(el).text().trim(), 10))
      .get()
      .filter((n) => !isNaN(n));

    if (dateRaw && numbers.length === 7) {
      results.push({
        numbers: [...numbers].sort((a, b) => a - b),
        date: dateRaw,
      });
    }
  });

  // Parse total pages from pagination links: javascript:NextPage(N)
  const pageNums: number[] = [];
  $('.pagination a').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const match = href.match(/NextPage\((\d+)\)/);
    if (match) pageNums.push(parseInt(match[1], 10));
  });
  const totalPages = pageNums.length > 0 ? Math.max(...pageNums) + 1 : pageIndex + 1;

  return { results, totalPages };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Convert DD/MM/YYYY to a sortable number YYYYMMDD
function dateToSortKey(date: string): number {
  const [day, month, year] = date.split('/');
  return parseInt(`${year}${month}${day}`, 10);
}

async function loadExisting(): Promise<DrawResult[]> {
  try {
    const raw = await fs.readFile(OUTPUT_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as { results: DrawResult[] };
    return parsed.results ?? [];
  } catch {
    return [];
  }
}

export async function crawlPower55(onProgress?: (page: number, total: number) => void): Promise<{ results: DrawResult[]; newCount: number }> {
  const existing = await loadExisting();

  // Results are sorted newest-first, so index 0 is the latest date
  const latestKey = existing.length > 0 ? dateToSortKey(existing[0].date) : 0;

  const cookies = await getCookies();

  const newResults: DrawResult[] = [];
  let done = false;

  // Fetch page 0 first to get total pages
  const first = await fetchPage(0, cookies);
  let totalPages = first.totalPages;
  onProgress?.(0, totalPages);

  for (const result of first.results) {
    if (dateToSortKey(result.date) > latestKey) {
      newResults.push(result);
    } else {
      done = true;
      break;
    }
  }

  for (let page = 1; page < totalPages && !done; page++) {
    await sleep(300);
    const { results, totalPages: discoveredTotal } = await fetchPage(page, cookies);

    if (discoveredTotal > totalPages) totalPages = discoveredTotal;
    onProgress?.(page, totalPages);

    for (const result of results) {
      if (dateToSortKey(result.date) > latestKey) {
        newResults.push(result);
      } else {
        done = true;
        break;
      }
    }
  }

  const merged = [...newResults, ...existing];
  merged.sort((a, b) => dateToSortKey(b.date) - dateToSortKey(a.date));

  return { results: merged, newCount: newResults.length };
}

export async function exportResults(results: DrawResult[]): Promise<string> {
  const output = { results };
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  return OUTPUT_FILE;
}

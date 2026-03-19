// ═══════════════════════════════════════════════
// CryptoPulse AI — Vercel Serverless Proxy
// 解决浏览器 CORS 限制，代理所有交易所 API 请求
// ═══════════════════════════════════════════════

const ALLOWED_DOMAINS = [
  'api.binance.com',
  'fapi.binance.com',
  'dapi.binance.com',
  'www.okx.com',
  'api.coingecko.com',
  'api.alternative.me',
  'generativelanguage.googleapis.com',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const isAllowed = ALLOWED_DOMAINS.some(d => parsedUrl.hostname === d || parsedUrl.hostname.endsWith('.' + d));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Domain not allowed: ' + parsedUrl.hostname });
  }

  try {
    const opts = {
      method: req.method,
      headers: { 'User-Agent': 'CryptoPulse-Proxy/1.0', 'Accept': 'application/json' },
    };

    if (req.method === 'POST' && req.body) {
      opts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      opts.headers['Content-Type'] = 'application/json';
      if (req.headers['authorization']) opts.headers['Authorization'] = req.headers['authorization'];
      if (req.headers['x-api-key']) opts.headers['x-api-key'] = req.headers['x-api-key'];
      if (req.headers['anthropic-version']) opts.headers['anthropic-version'] = req.headers['anthropic-version'];
    }

    const response = await fetch(targetUrl, opts);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    const data = await response.text();
    return res.status(response.status).send(data);
  } catch (error) {
    return res.status(502).json({ error: 'Proxy failed', message: error.message });
  }
}

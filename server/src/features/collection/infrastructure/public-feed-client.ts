import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import ipaddr from 'ipaddr.js';
import robotsParser from 'robots-parser';
import { parseFeed } from './parse-feed.js';

const agentName = 'RadarFeedReader';
const redirectCodes = new Set([301, 302, 303, 307, 308]);

interface Reply {
  status: number;
  location?: string;
  body: string;
}

type RequestPage = (url: URL, byteLimit: number) => Promise<Reply>;

export function publicFeedClient(request: RequestPage = requestPublicPage, pause = delay<void>) {
  const robots = new Map<string, Promise<ReturnType<typeof robotsParser>>>();
  const lastVisit = new Map<string, number>();
  const rateLimited = new Set<string>();

  async function fetchPage(url: URL, forRobots: boolean, hops = 0): Promise<{ url: URL; reply: Reply }> {
    if (hops > 5) throw new Error('Nguồn chuyển hướng quá nhiều lần.');
    if (rateLimited.has(url.origin)) throw new Error('Nguồn giới hạn tần suất (HTTP 429).');
    let gap = 1000;
    if (!forRobots) {
      const policy = await readRobots(url);
      if (!policy.isAllowed(url.href, agentName)) throw new Error('robots.txt không cho phép đọc feed.');
      const crawlDelay = policy.getCrawlDelay(agentName);
      if (crawlDelay && Number.isFinite(crawlDelay)) gap = Math.max(gap, crawlDelay * 1000);
      if (gap > 30_000) throw new Error('Nguồn yêu cầu giãn cách hơn 30 giây.');
    }
    const remaining = (lastVisit.get(url.origin) ?? 0) + gap - Date.now();
    if (remaining > 0) await pause(remaining);
    lastVisit.set(url.origin, Date.now());
    const reply = await request(url, forRobots ? 512_000 : 2_000_000);
    if (reply.status === 429) rateLimited.add(url.origin);
    if (!redirectCodes.has(reply.status)) return { url, reply };
    const next = reply.location && URL.parse(reply.location, url.href);
    if (!next || (url.protocol === 'https:' && next.protocol !== 'https:')) {
      throw new Error('Nguồn chuyển hướng tới URL không hợp lệ.');
    }
    return fetchPage(next, forRobots, hops + 1);
  }

  function readRobots(url: URL) {
    let policy = robots.get(url.origin);
    if (!policy) {
      const robotsUrl = new URL('/robots.txt', url);
      policy = fetchPage(robotsUrl, true).then(({ reply }) => {
        if ([404, 410].includes(reply.status)) return robotsParser(robotsUrl.href, '');
        if (reply.status !== 200) throw new Error(`Không đọc được robots.txt (HTTP ${reply.status}).`);
        if (/^\s*</.test(reply.body)) throw new Error('robots.txt trả về HTML thay cho quy tắc thu thập.');
        return robotsParser(robotsUrl.href, reply.body);
      });
      robots.set(url.origin, policy);
    }
    return policy;
  }

  return async (feedUrl: string) => {
    const { url, reply } = await fetchPage(new URL(feedUrl), false);
    if (reply.status !== 200) throw new Error(`Feed trả về HTTP ${reply.status}.`);
    return parseFeed(reply.body, url);
  };
}

async function requestPublicPage(url: URL, byteLimit: number): Promise<Reply> {
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port || isIP(host)) {
    throw new Error('Nguồn phải dùng tên miền công khai và cổng HTTP/HTTPS tiêu chuẩn.');
  }
  const addresses = await lookup(host, { all: true });
  const [firstAddress] = addresses;
  if (!firstAddress || addresses.some(({ address }) => ipaddr.process(address).range() !== 'unicast')) {
    throw new Error('Nguồn phân giải tới địa chỉ không công khai.');
  }
  const address = addresses.find(({ family }) => family === 4) ?? firstAddress;
  const request = url.protocol === 'https:' ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const client = request(url, {
      family: address.family,
      lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
      signal: AbortSignal.timeout(12_000),
      headers: { 'User-Agent': `${agentName}/1.0`, 'Accept-Encoding': 'identity' },
    }, async (response) => {
      const status = response.statusCode ?? 0;
      if (status !== 200) {
        resolve({ status, location: response.headers.location, body: '' });
        response.destroy();
        return;
      }
      try {
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of response as AsyncIterable<Buffer>) {
          size += chunk.length;
          if (size > byteLimit) throw new Error('Phản hồi nguồn vượt giới hạn dung lượng.');
          chunks.push(chunk);
        }
        resolve({ status, body: Buffer.concat(chunks).toString('utf8') });
      } catch (error) {
        reject(error);
      }
    });
    client.on('error', reject);
    client.end();
  });
}

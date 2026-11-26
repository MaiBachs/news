const englishTerms = [
  'retrieval-augmented generation', 'large language models', 'large language model', 'model context protocol',
  'voice agents', 'voice agent', 'AI agents', 'AI agent', 'agentic AI', 'speech-to-text', 'text-to-speech',
  'fine-tuning', 'open weights', 'KV caching', 'KV cache', 'micro-SaaS', 'self-hosted',
  'workflow', 'framework', 'benchmark', 'WebSocket', 'JavaScript', 'TypeScript', 'Python', 'OpenAI',
  'ChatGPT', 'Claude', 'Anthropic', 'Gemini', 'DeepSeek', 'NVIDIA', 'MediaTek', 'GitHub', 'OpenClaw', 'Xiaozhi',
  'The Information', 'Muse Charm', 'Muse Spark', 'Apple Intelligence', 'ElevenLabs', 'Perplexity',
  'Magpie', 'Anki', 'Obsidian', 'Startup Qatar', 'Web Summit Qatar',
  'ESP32', 'ESP-IDF', 'Raspberry Pi', 'LLMs', 'LLM', 'SaaS', 'AIoT', 'IoT', 'API', 'APIs',
  'AI', 'OCR', 'RAG', 'GPU', 'GPUs', 'CPU', 'NPU', 'SDK', 'MCP', 'ASR', 'STT', 'TTS', 'NLP', 'SQL', 'CUDA',
  'Wi-Fi', 'Bluetooth', 'USB-C', 'IPO', 'ETF',
];

const chineseTerms = new Map([
  ['大语言模型', 'LLM'], ['大語言模型', 'LLM'], ['大模型', 'LLM'],
  ['语音智能体', 'voice agent'], ['語音智能體', 'voice agent'],
  ['智能体', 'AI agent'], ['智能體', 'AI agent'],
  ['语音识别', 'speech recognition'], ['語音辨識', 'speech recognition'],
  ['人工智能', 'AI'], ['物联网', 'IoT'], ['物聯網', 'IoT'], ['英伟达', 'NVIDIA'], ['輝達', 'NVIDIA'],
  ['黄仁勋', 'Jensen Huang'], ['黃仁勳', 'Jensen Huang'], ['小鹏汽车', 'XPeng'], ['小鵬汽車', 'XPeng'],
  ['零跑汽车', 'Leapmotor'], ['零跑汽車', 'Leapmotor'], ['比亚迪', 'BYD'], ['比亞迪', 'BYD'],
  ['华为', 'Huawei'], ['華為', 'Huawei'], ['腾讯', 'Tencent'], ['騰訊', 'Tencent'],
  ['字节跳动', 'ByteDance'], ['字節跳動', 'ByteDance'], ['阿里巴巴', 'Alibaba'], ['百度', 'Baidu'],
  ['优必选', 'UBTECH'], ['優必選', 'UBTECH'], ['科大讯飞', 'iFlytek'], ['科大訊飛', 'iFlytek'],
  ['36氪', '36Kr'], ['36 氪', '36Kr'],
]);

const vocabulary = new RegExp(
  `(?<![A-Za-z0-9])(?:${englishTerms.sort(byLength).join('|')})(?![A-Za-z0-9])|${[...chineseTerms.keys()].sort(byLength).join('|')}`,
  'giu',
);

function byLength(left: string, right: string) {
  return right.length - left.length;
}

export function protectTechnicalTerms(text: string) {
  let prefix = '78432';
  while (text.includes(prefix)) prefix += '7';
  const terms: { marker: string; text: string }[] = [];
  const protectedText = text.replace(vocabulary, (term: string) => {
    const marker = prefix + String(terms.length).padStart(2, '0');
    terms.push({ marker, text: chineseTerms.get(term) ?? term });
    return ` ${marker} `;
  }).replace(/ +/g, ' ').trim();
  return { protectedText, terms };
}

export function restoreTechnicalTerms(text: string, terms: ReturnType<typeof protectTechnicalTerms>['terms']) {
  let result = text;
  for (const { marker, text: term } of terms) {
    const matches = new RegExp(`(?<!\\d)${marker.split('').join('[ ,.]?')}(?!\\d)`, 'g');
    if ([...result.matchAll(matches)].length !== 1) return undefined;
    result = result.replace(matches, () => term);
  }
  return result;
}

export function cleanTranslatedText(text: string, original: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return /(?:…|\.\.\.)$/u.test(original) ? `${clean.replace(/[.… ]+$/u, '')}…` : clean;
}

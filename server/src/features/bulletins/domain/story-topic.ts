import type { BulletinStory, NewsTopic } from '../../../../../shared/bulletins.js';

const topicRules: ReadonlyArray<readonly [NewsTopic, RegExp]> = [
  ['bao-mat', /\b(?:ro ri du lieu|du lieu.{1,50}ro ri|data breach|security advisory|cybersecurity|an ninh mang|tan cong mang|ma doc|tin tac|malware|ransomware|cve-\d{4}-\d+|openid connect|audit log)\b|数据泄露|网络安全|远程锁定/],
  ['aiot', /\b(?:aiot|iot|esp32|xiaozhi|esphome|gateway|thiet bi thong minh|ai-powered gadgets|cam bien|smart home|robots?|robotics)\b|物联网|智能家居|(?<!聊天|客服)机器人/],
  ['giong-noi', /\b(?:voice ?(?:agent|bot|ai)|speech.to.text|text.to.speech|speech synthesis|voice recognition|conversation relay|elevenlabs|giong noi|luot noi|am thanh|tieng noi)\b|语音识别|语音助手/],
  ['chatbot', /\b(?:chatbots?|zalo oa|messenger bots?|tro ly ao|virtual assistants?)\b|聊天机器人|客服机器人/],
  ['ai-agent', /\b(?:ai agent|tac nhan ai|agentic ai|agent style|gemini.{1,35}use your|copilot)\b|智能体/],
  ['nghe-tay-trai', /\b(?:nghe tay trai|viec lam them|side hustle|freelanc(?:e|er|ing))\b|副业|自由职业/],
  ['nong-nghiep', /\b(?:nong nghiep|nong san|chan nuoi|thuy san|trong trot|trun que|trang trai|robusta|farm(?:ing)?)\b|农业|畜牧|种植/],
  ['tai-chinh', /\b(?:ipo|len san|niem yet|chung khoan|bao hiem|co phieu|co dong|lai suat|ngan hang|thi truong von|fintech|stock market|insurance)\b|上市|股市|保险|银行/],
  ['kinh-doanh', /\b(?:micro-saas|saas|cong ty mot nguoi|solopreneur|bootstrapp(?:ed|ing)|thuong mai dien tu|tmdt|startups?|goi von|revenue|doanh thu|financing|earnings report|jensen huang.{0,16}scandal|ceo.{0,60}be boi|doanh nghiep cong nghe so|doanh nghiep.{0,30}lam chu cong nghe)\b|初创|融资|电商|销售额|员工投诉/],
  ['ha-tang-so', /\b(?:tcp\/ip|data cent(?:er|re)|trung tam du lieu|mang di dong|song di dong|tram phat|con khat dien)\b|数据中心|移动网络/],
  ['phan-cung', /\b(?:rtx \d+|gpus?|chip(?:s|set)?|tablet|phone|smartphone|iphone|macbook|ipad|galaxy [sz]\d*|pixel|may in 3d|linh kien|uav|drone|smartwatch|thiet bi|ddr\d|dien thoai|bo nho)\b|显卡|无人机|芯片|骁龙|手机|手表|存储引擎|首款机型/],
  ['phan-mem', /\b(?:github|gitlab|azure devops|linux|windows|win11|api|sdk|android|postgresql|mysql|phan mem|ma nguon mo|ung dung so|infinite scroll)\b|开发者|操作系统|无限滚动|编程语言|数据库/],
  ['khoa-hoc', /\b(?:khoa hoc|luong tu|vat lieu|vu tru|starship|voyager|riemann hypothesis|tai hoang da|nghien cuu y khoa)\b|癌症|大脑|黎曼猜想|小鼠/],
  ['mo-hinh-ai', /\b(?:ung dung ai|ai tao sinh|llms?|model card|open weights|trong so|mo hinh ngon ngu|suy luan|machine learning|gemini|openai|chatgpt)\b|人工智能|大模型|算力/],
];

const sourceTopics = new Map<string, NewsTopic>([
  ['GitHub Changelog', 'phan-mem'], ['Insurance Journal', 'tai-chinh'],
  ['CafeF Thị trường chứng khoán', 'tai-chinh'], ['CafeF Tài chính ngân hàng', 'tai-chinh'],
  ['OpenAI News', 'mo-hinh-ai'], ['AWS Machine Learning', 'mo-hinh-ai'],
  ['IEEE Spectrum AI', 'mo-hinh-ai'], ['MIT Technology Review AI', 'mo-hinh-ai'],
  ['Crunchbase News', 'kinh-doanh'], ['Raspberry Pi News', 'aiot'],
  ['Home Assistant Blog', 'aiot'], ['IEEE Spectrum Robotics', 'aiot'],
  ['开源中国 OSCHINA', 'phan-mem'], ['Cloudflare Blog', 'ha-tang-so'],
]);

const businessSources = new Set([
  '36Kr 科技创投', 'SCMP Business', 'TechCrunch Startups',
  'VietNamNet Kinh doanh', 'VnExpress Kinh doanh', 'Tuổi Trẻ Kinh doanh', 'Thanh Niên Kinh tế',
]);

export function resolveStoryTopic(story: BulletinStory): NewsTopic | undefined {
  if (story.topic) return story.topic;
  const titleTopic = matchTopic(story.title);
  if (titleTopic === 'chatbot') {
    const fallback = sourceTopics.get(story.source) ?? matchTopic(story.summary);
    if (fallback === 'aiot' || fallback === 'giong-noi') return fallback;
  }
  return titleTopic
    ?? sourceTopics.get(story.source)
    ?? matchTopic(story.summary)
    ?? (businessSources.has(story.source) ? 'kinh-doanh' : undefined);
}

function matchTopic(text: string): NewsTopic | undefined {
  const normalized = text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replaceAll('đ', 'd');
  return topicRules.find(([, pattern]) => pattern.test(normalized))?.[0]
    ?? (/\bAI\b/.test(text) ? 'mo-hinh-ai' : undefined);
}

import type { LibraryTheme } from '../../../../../shared/library.js';
import { selectBackfillEntries } from './feed-entry.js';
import type { FeedEntry } from './feed-entry.js';

const noise = /抽奖|邀请码|兑换码|免费领取|破解版|免实名|薅羊毛|送码|收号|卖号|机场推荐|福利群|求互关|^\s*[【\[]\s*(?:广告|商业推广|推广)\s*[】\]]/iu;
const ideas = /独立开发|产品|工具|开源|插件|小程序|工作流|自动化|智能体|大模型|人工智能|做了|自荐|发布|上线|首发|用户反馈|需求|替代|\b(?:AI|LLM|ESP32|API|agent|workflow|makers?|open.source)\b/iu;
const monetization = /变现|赚[钱了到]|营收|收入|收益|盈利|付费|收费|定价|订阅|利润|获客|流量|转化|冷启动|引流|复盘|出海|接单|副业|创业|商业模式|生意|首单|\b(?:saas|micro-saas|monetiz\w*|pricing|bootstrapp\w*)\b/iu;
const pricingField = /(?:是否(?:付费|收费)|收费情况)\s*[:：]?\s*(?:完全免费|免费|不收费|否)?/g;
const softwareCatalog = /软件名称|应用平台|推荐类型/;
const ai = /智能体|大模型|人工智能|\b(?:AI|LLM|chatgpt|agent|claude|deepseek|minimax)\b/iu;
const hardware = /物联网|硬件|智能家居|\b(?:AIoT|IoT|ESP32|Arduino|Raspberry Pi)\b/iu;

export function selectCommunityEntries(entries: FeedEntry[], backfill: boolean, now: number) {
  return selectBackfillEntries(entries, 'LIBRARY', now)
    .map((entry) => {
      const earns = monetization.test(entry.title)
        || (!softwareCatalog.test(entry.excerpt) && monetization.test(entry.excerpt.replace(pricingField, '')));
      return { entry, earns };
    })
    .filter(({ entry, earns }) => !noise.test(entry.title) && (ideas.test(entry.title) || earns))
    .slice(0, backfill ? 80 : 4)
    .map(({ entry, earns }) => {
      const isAi = ai.test(entry.title);
      const isHardware = hardware.test(entry.title);
      const theme: LibraryTheme = earns ? 'BUSINESS' : isHardware ? 'IOT' : isAi ? 'AI' : 'TOOLS';
      const topics = [earns ? 'Kiếm tiền & tìm khách' : 'Sản phẩm & xu hướng'];
      if (isHardware) topics.push('IoT & thiết bị');
      if (isAi) topics.push('AI & tự động hóa');
      return { ...entry, theme, topics };
    });
}

export type NewsLanguage = 'en' | 'zh' | 'zh-Hant' | 'ja' | 'ko';

const vietnamese = /[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/iu;
const traditionalChinese = /[報發體臺灣應與這個為從於無關業證資國灣網檔軟啟學習訊]/u;

export function translationLanguage(text: string): NewsLanguage | null {
  if (/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)) return 'ja';
  if (/\p{Script=Hangul}/u.test(text)) return 'ko';
  const han = text.match(/\p{Script=Han}/gu)?.length ?? 0;
  if (han && (!vietnamese.test(text) || han >= 10)) return traditionalChinese.test(text) ? 'zh-Hant' : 'zh';
  if (!/\p{Script=Latin}/u.test(text) || vietnamese.test(text)) return null;
  return 'en';
}

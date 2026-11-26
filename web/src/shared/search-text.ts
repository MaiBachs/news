export function normalizeSearch(value: string) {
  return value.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{M}/gu, '').replaceAll('đ', 'd');
}

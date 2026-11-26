const dateFormatters = {
  long: new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeZone: 'UTC' }),
  short: new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeZone: 'UTC' }),
};

export function formatBulletinDate(date: string, style: keyof typeof dateFormatters = 'long') {
  return dateFormatters[style].format(new Date(`${date}T00:00:00Z`));
}

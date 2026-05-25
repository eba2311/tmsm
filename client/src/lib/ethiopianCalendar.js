/** Ethiopian calendar display (uses Unicode extension when supported). */
export function formatEthiopianDate(date = new Date(), locale = 'am-ET') {
  try {
    return new Intl.DateTimeFormat(`${locale}-u-ca-ethiopic`, {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString('en-ET', { dateStyle: 'medium' });
  }
}

export function formatGregorianET(date = new Date()) {
  return date.toLocaleString('en-GB', {
    timeZone: 'Africa/Addis_Ababa',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

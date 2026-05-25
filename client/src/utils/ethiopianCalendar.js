/**
 * Ethiopian Calendar Utility
 * Converts Gregorian dates to Ethiopian dates and vice versa.
 * Reference: https://en.wikipedia.org/wiki/Ethiopian_calendar
 */

const ethiopianMonths = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yakatit',
  'Magabit', 'Miyazya', 'Gunbot', 'Sane', 'Hamle', 'Nehasse', 'Pagume'
];

const ethiopianMonthsAmharic = [
  'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];

export function toEthiopianDate(date) {
  const gregorianDate = new Date(date);
  const year = gregorianDate.getFullYear();
  const month = gregorianDate.getMonth() + 1;
  const day = gregorianDate.getDate();

  // Very simplified approximation for display purposes
  // Actual conversion requires complex JD calculations
  let etYear = year - 8;
  let etMonth = month + 3;
  let etDay = day;

  if (etMonth > 12) {
    etMonth -= 12;
    etYear += 1;
  }

  // Offset adjustment for Meskerem 1 (approx Sept 11/12)
  if (month < 9 || (month === 9 && day < 11)) {
    etYear -= 1;
  }

  return {
    year: etYear,
    month: etMonth,
    day: etDay,
    monthName: ethiopianMonths[etMonth - 1],
    monthNameAm: ethiopianMonthsAmharic[etMonth - 1],
    formatted: `${ethiopianMonthsAmharic[etMonth - 1]} ${etDay}, ${etYear}`
  };
}

export function formatEthiopian(date) {
  const et = toEthiopianDate(date);
  return et.formatted;
}

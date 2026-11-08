/**
 * Converts a numeric amount to Indian/Nepali numbering system words
 * e.g. 100000 -> "One Lakh"
 * e.g. 113000 -> "One Lakh Thirteen Thousand"
 */
export function numberToWordsNPR(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Zero Rupees Only';

  const absAmount = Math.abs(amount);
  const rupees = Math.floor(absAmount);
  const paisa = Math.round((absAmount - rupees) * 100);

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(num: number): string {
    if (num === 0) return '';
    if (num < 20) return ones[num];
    const t = Math.floor(num / 10);
    const o = num % 10;
    return (tens[t] + (o > 0 ? ' ' + ones[o] : '')).trim();
  }

  function convertThreeDigits(num: number): string {
    if (num === 0) return '';
    const h = Math.floor(num / 100);
    const rest = num % 100;
    const hStr = h > 0 ? ones[h] + ' Hundred' : '';
    const restStr = convertTwoDigits(rest);
    if (hStr && restStr) return `${hStr} and ${restStr}`;
    return hStr || restStr;
  }

  // South Asian numbering system: Crore (1,00,00,000), Lakh (1,00,000), Thousand (1,000), Hundred
  let n = rupees;
  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;

  const lakh = Math.floor(n / 100000);
  n %= 100000;

  const thousand = Math.floor(n / 1000);
  n %= 1000;

  const remainder = n;

  if (crore > 0) {
    parts.push(`${convertTwoDigits(crore)} Crore`);
  }
  if (lakh > 0) {
    parts.push(`${convertTwoDigits(lakh)} Lakh`);
  }
  if (thousand > 0) {
    parts.push(`${convertTwoDigits(thousand)} Thousand`);
  }
  if (remainder > 0) {
    parts.push(convertThreeDigits(remainder));
  }

  const rupeeStr = parts.join(' ').trim();
  let result = `Nepalese Rupees ${rupeeStr || 'Zero'}`;

  if (paisa > 0) {
    result += ` and ${convertTwoDigits(paisa)} Paisa`;
  }

  result += ' Only';
  return amount < 0 ? `Minus ${result}` : result;
}

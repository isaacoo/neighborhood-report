/** 만원 단위 가격 → 한국식 표기 */
export function formatPrice(priceInManWon: number): string {
  if (priceInManWon >= 10000) {
    const eok = Math.floor(priceInManWon / 10000);
    const remainder = priceInManWon % 10000;
    return remainder > 0
      ? `${eok}억 ${remainder.toLocaleString()}만원`
      : `${eok}억`;
  }
  return `${priceInManWon.toLocaleString()}만원`;
}

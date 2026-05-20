/**
 * 만원 단위 가격을 한국식 표기로 변환.
 * - 1억 이상: "X억 Y만원" 또는 "X억"
 * - 1억 미만: "X만원" (천 단위 콤마)
 */
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

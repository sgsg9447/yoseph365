/** 이름 가운데를 O로 마스킹. 김지희 → 김O희 */
export function maskName(name: string): string {
  const n = name.trim();
  if (n.length <= 1) return n;
  if (n.length === 2) return `${n[0]}O`;
  return `${n[0]}${"O".repeat(n.length - 2)}${n[n.length - 1]}`;
}

/** 전화 뒤 4자리 마스킹. 01012345678 → 010-1234-•••• */
export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-••••`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-••••`;
  if (d.length > 4) return `${d.slice(0, d.length - 4)}••••`;
  return `${d.slice(0, 1)}••••`;
}

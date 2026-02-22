const DEFAULT_RISK_TERMS = [
  "리콜",
  "불매",
  "논란",
  "소송",
  "위기",
  "불법",
  "저작권",
  "권리침해",
  "허위",
  "위반",
  "처벌",
  "징계",
  "환불",
  "피해",
  "해킹",
  "유출",
  "사기"
];

export function getRiskTerms() {
  const fromEnv = process.env.REPORT_RISK_TERMS;
  if (!fromEnv) return DEFAULT_RISK_TERMS;
  const terms = fromEnv
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);
  return terms.length > 0 ? terms : DEFAULT_RISK_TERMS;
}

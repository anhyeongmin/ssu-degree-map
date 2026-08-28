export type AiPriority = {
  rank: number;
  title: string;
  reason: string;
  action: string;
  basis: string;
};

export type AiAnalysis = {
  summary: string;
  riskLevel: "낮음" | "보통" | "높음" | "확인 필요";
  riskReason: string;
  priorities: AiPriority[];
  warnings: string[];
  confidenceNote: string;
  model: string;
  generatedAt: string;
  aiGenerated: true;
  inputHash?: string;
};

export function validateAiAnalysis(value: unknown): value is AiAnalysis {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.summary !== "string" || item.summary.length < 2) return false;
  if (!["낮음", "보통", "높음", "확인 필요"].includes(String(item.riskLevel))) return false;
  if (typeof item.riskReason !== "string" || typeof item.confidenceNote !== "string") return false;
  if (typeof item.model !== "string" || typeof item.generatedAt !== "string" || item.aiGenerated !== true) return false;
  if (!Array.isArray(item.priorities) || item.priorities.length > 3) return false;
  if (!Array.isArray(item.warnings) || !item.warnings.every((warning) => typeof warning === "string")) return false;
  return item.priorities.every((priority) => {
    if (!priority || typeof priority !== "object") return false;
    const p = priority as Record<string, unknown>;
    return Number.isInteger(p.rank)
      && typeof p.title === "string"
      && typeof p.reason === "string"
      && typeof p.action === "string"
      && typeof p.basis === "string";
  });
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function hashPayload(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(stableStringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function readSessionCache(key: string): AiAnalysis | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return validateAiAnalysis(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSessionCache(key: string, value: AiAnalysis) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Session storage can be unavailable in privacy-restricted browsers.
  }
}

import { studentCases, type StudentCase } from "./degree-map.ts";

export type DegreeMapMode = "entry" | "demo" | "live";

export function visibleStudentCases(mode: DegreeMapMode, importedCase: StudentCase | null): StudentCase[] {
  if (mode === "live") return importedCase ? [importedCase] : [];
  if (mode === "demo") return studentCases;
  return [];
}

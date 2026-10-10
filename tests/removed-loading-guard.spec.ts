import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? sourceFiles(path.join(directory, entry.name)) : /\.(tsx?|css)$/.test(entry.name) ? [path.join(directory, entry.name)] : []);
}

test("removed splash and duplicate advisory skeleton cannot be reintroduced", () => {
  const failures = sourceFiles("src").flatMap(file => {
    const source = fs.readFileSync(file, "utf8");
    return /\b(?:QedLoader|QedSplash|AdvisorySkeleton|DashboardSkeleton|QuizLoading)\b|\.qed-(?:splash|spinner)(?:\b|-)/.test(source) ? [file] : [];
  });
  expect(failures, "obsolete data loaders must not be imported, used, or restyled").toEqual([]);
  for (const file of ["src/routes/ProtectedRoute.tsx", "src/features/profiles/principal/pages/gradebooks/components/DashboardStatus.tsx"])
    expect(fs.existsSync(file), `unused legacy loading UI must not be restored: ${file}`).toBe(false);
});

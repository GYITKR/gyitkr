import { defineConfig } from "vitest/config";

// 단위 테스트는 lib/ 로 한정 — e2e/*.spec.ts(Playwright)는 vitest가 수집하지 않도록 제외
export default defineConfig({
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
});

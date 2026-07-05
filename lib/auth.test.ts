import { describe, it, expect } from "vitest";
import { createToken, verifyToken } from "./auth";

describe("auth token", () => {
  const secret = "test-secret-0123456789";

  it("발급한 토큰은 같은 시크릿으로 검증된다", async () => {
    const t = await createToken(secret);
    expect(await verifyToken(t, secret)).toBe(true);
  });
  it("다른 시크릿으로는 검증 실패", async () => {
    const t = await createToken(secret);
    expect(await verifyToken(t, "other-secret")).toBe(false);
  });
  it("변조된 토큰은 실패", async () => {
    const t = await createToken(secret);
    expect(await verifyToken(t + "x", secret)).toBe(false);
    expect(await verifyToken(undefined, secret)).toBe(false);
    expect(await verifyToken("garbage", secret)).toBe(false);
  });
});

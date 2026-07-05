import { describe, it, expect, beforeEach, vi } from "vitest";

// @vercel/blob 를 인메모리로 모킹
const store = new Map<string, string>();
vi.mock("@vercel/blob", () => ({
  list: async ({ prefix }: { prefix: string }) => ({
    blobs: [...store.keys()]
      .filter((k) => k.startsWith(prefix))
      .map((k) => ({ pathname: k, url: `https://blob.test/${k}` })),
  }),
  put: async (pathname: string, body: string) => {
    store.set(pathname, body);
    return { url: `https://blob.test/${pathname}`, pathname };
  },
}));

// fetch(url) → store 내용 반환
vi.stubGlobal("fetch", async (url: string) => {
  const key = url.replace("https://blob.test/", "");
  const body = store.get(key);
  return { ok: body !== undefined, json: async () => JSON.parse(body ?? "{}") } as Response;
});

import { readManifest, addItem, removeItem } from "./manifest";

describe("manifest", () => {
  beforeEach(() => {
    store.clear();
    process.env.BLOB_READ_WRITE_TOKEN = "test-token"; // 모킹된 Blob 경로 활성화
  });

  it("빈 저장소에서 빈 items 반환", async () => {
    const m = await readManifest();
    expect(m.items).toEqual([]);
  });

  it("addItem 은 항목을 추가하고 order 를 증가시킨다", async () => {
    const a = await addItem({ url: "u1", pathname: "p1", width: 400, height: 1200 });
    const b = await addItem({ url: "u2", pathname: "p2", width: 400, height: 800 });
    expect(a.order).toBe(1);
    expect(b.order).toBe(2);
    expect(a.category).toBe("상세페이지");
    const m = await readManifest();
    expect(m.items.length).toBe(2);
  });

  it("removeItem 은 항목을 지우고 지워진 항목을 반환", async () => {
    const a = await addItem({ url: "u1", pathname: "p1", width: 1, height: 1 });
    const removed = await removeItem(a.id);
    expect(removed?.pathname).toBe("p1");
    const m = await readManifest();
    expect(m.items.length).toBe(0);
    expect(await removeItem("nope")).toBeNull();
  });
});

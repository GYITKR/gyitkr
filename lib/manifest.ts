import { put, list } from "@vercel/blob";
import type { Manifest, PortfolioItem } from "./types";

const MANIFEST_PATH = "portfolio/manifest.json";

export async function readManifest(): Promise<Manifest> {
  const { blobs } = await list({ prefix: MANIFEST_PATH, limit: 1 });
  const found = blobs.find((b) => b.pathname === MANIFEST_PATH);
  if (!found) return { items: [] };
  const res = await fetch(found.url, { cache: "no-store" });
  if (!res.ok) return { items: [] };
  return (await res.json()) as Manifest;
}

export async function writeManifest(m: Manifest): Promise<void> {
  await put(MANIFEST_PATH, JSON.stringify(m), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function addItem(input: {
  url: string; pathname: string; width: number; height: number;
  title?: string; category?: string;
}): Promise<PortfolioItem> {
  const m = await readManifest();
  const maxOrder = m.items.reduce((mx, it) => Math.max(mx, it.order), 0);
  const item: PortfolioItem = {
    id: crypto.randomUUID(),
    url: input.url,
    pathname: input.pathname,
    title: input.title ?? "",
    category: input.category ?? "상세페이지",
    width: input.width,
    height: input.height,
    order: maxOrder + 1,
    createdAt: new Date().toISOString(),
  };
  m.items.push(item);
  await writeManifest(m);
  return item;
}

export async function removeItem(id: string): Promise<PortfolioItem | null> {
  const m = await readManifest();
  const idx = m.items.findIndex((it) => it.id === id);
  if (idx === -1) return null;
  const [removed] = m.items.splice(idx, 1);
  await writeManifest(m);
  return removed;
}

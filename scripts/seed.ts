import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { put } from "@vercel/blob";
import { addItem } from "../lib/manifest";

// PNG IHDR에서 width/height 파싱 (8바이트 시그니처 + 4길이 + 'IHDR' 이후 8바이트)
function pngSize(buf: Buffer): { width: number; height: number } {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function main() {
  const dir = join(process.cwd(), "p_images");
  const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".png"))
    .sort((a, b) => parseInt(a) - parseInt(b));
  for (const f of files) {
    const data = readFileSync(join(dir, f));
    const { width, height } = pngSize(data);
    const blob = await put(`portfolio/${f}`, data, { access: "public", addRandomSuffix: true, contentType: "image/png" });
    const item = await addItem({ url: blob.url, pathname: blob.pathname, width, height });
    console.log(`seeded ${f} -> ${item.id} (${width}x${height})`);
  }
  console.log("done");
}
main().catch((e) => { console.error(e); process.exit(1); });

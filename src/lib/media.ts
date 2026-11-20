import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

// 관리자 페이지가 올린 파일은 모두 src/uploads 아래에 있다.
// 콘텐츠에는 "/uploads/works/a.png" 같은 문자열로 적히므로 여기서 실제 파일로 바꾼다.
const images = import.meta.glob<ImageMetadata>(
  '/src/uploads/**/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF,gif,GIF}',
  { eager: true, import: 'default' },
);
const files = import.meta.glob<string>('/src/uploads/**/*.{pdf,PDF}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function toKey(p: string): string {
  let s = p.trim().replaceAll(String.fromCharCode(92), '/');
  try {
    s = decodeURI(s);
  } catch {}
  s = s.replace(/^(\.\.\/)+/, '').replace(/^\.?\//, '').replace(/^src\//, '');
  if (!s.startsWith('uploads/')) s = `uploads/${s}`;
  return `/src/${s}`;
}

export function findImage(p: string | null | undefined): ImageMetadata | undefined {
  if (!p) return undefined;
  return images[toKey(p)];
}

export function findFileUrl(p: string | null | undefined): string | undefined {
  if (!p) return undefined;
  return files[toKey(p)];
}

const WEBP_MAX = 16383; // WebP 한 변 최대 픽셀

export interface Responsive {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

/** 세로로 긴 이미지를 여러 폭으로 변환한다. WebP 한계를 넘는 크기는 JPEG로 만든다. */
export async function responsive(img: ImageMetadata, widths: number[], quality = 80): Promise<Responsive> {
  const ws = [...new Set(widths.map((w) => Math.min(w, img.width)))].sort((a, b) => a - b);
  const out: { url: string; w: number; h: number }[] = [];
  for (const w of ws) {
    const h = Math.round((img.height * w) / img.width);
    const format = h <= WEBP_MAX ? 'webp' : 'jpeg';
    const r = await getImage({ src: img, width: w, format, quality });
    out.push({ url: r.src, w, h });
  }
  const last = out[out.length - 1];
  return {
    src: last.url,
    srcset: out.map((o) => `${o.url} ${o.w}w`).join(', '),
    width: last.w,
    height: last.h,
  };
}

/** 카드용: 이미지 윗부분만 잘라 낸 작은 미리보기 */
export async function topCrop(img: ImageMetadata, width: number, height: number): Promise<string> {
  const w = Math.min(width, img.width);
  const h = Math.min(Math.round((height * w) / width), img.height);
  const r = await getImage({ src: img, width: w, height: h, fit: 'cover', position: 'top', format: 'webp', quality: 78 });
  return r.src;
}

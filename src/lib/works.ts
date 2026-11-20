import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { findImage } from './media';
import profileData from '../data/profile.json';

export interface Section {
  name: string;
  note: string;
  start: number; // 상세페이지 위에서부터 몇 % 지점에서 시작하는지 (0~100)
}

export interface Work {
  id: string;
  title: string;
  hasTitle: boolean;
  data: CollectionEntry<'works'>['data'];
  detail: ImageMetadata;
  thumbnail?: ImageMetadata;
  wireframe?: ImageMetadata;
  sections: Section[];
  tall: boolean;
}

export async function getWorks(): Promise<Work[]> {
  const entries = await getCollection('works', (e) => e.data.published !== false);
  entries.sort((a, b) => (a.data.order ?? 9999) - (b.data.order ?? 9999) || a.id.localeCompare(b.id));
  const works: Work[] = [];
  for (const e of entries) {
    const detail = findImage(e.data.detail);
    if (!detail) {
      console.warn(`[works] "${e.id}" 상세페이지 이미지를 찾지 못해 건너뜀: ${e.data.detail || '(비어 있음)'}`);
      continue;
    }
    const named = [e.data.brand, e.data.product].filter(Boolean).join(' ');
    works.push({
      id: e.id,
      title: named,
      hasTitle: !!named,
      data: e.data,
      detail,
      thumbnail: findImage(e.data.thumbnail),
      wireframe: findImage(e.data.wireframe),
      sections: normalizeSections(e.data.sections),
      tall: detail.height / detail.width > 2.2,
    });
  }
  works.forEach((w, i) => {
    if (!w.hasTitle) w.title = `상세페이지 작업 ${String(i + 1).padStart(2, '0')}`;
  });
  return works;
}

function normalizeSections(list: { name: string; note: string; start?: number | null }[]): Section[] {
  const n = list.length;
  const out = list.map((s, i) => ({
    name: s.name,
    note: s.note,
    start: typeof s.start === 'number' && Number.isFinite(s.start) ? Math.min(100, Math.max(0, s.start)) : (i / n) * 100,
  }));
  out.sort((a, b) => a.start - b.start);
  if (out[0]) out[0].start = 0;
  return out;
}

export function featuredWorks(works: Work[], count = 3): Work[] {
  const picked = works.filter((w) => w.data.featured && w.tall);
  for (const w of works) {
    if (picked.length >= count) break;
    if (w.tall && !picked.includes(w)) picked.push(w);
  }
  return picked.slice(0, count);
}

export const profile = profileData as {
  name: string;
  nameEn: string;
  role: string;
  pitch: string;
  career: { period: string; text: string }[];
  tools: string[];
  email: string;
  links: { label: string; url: string }[];
  resume: string;
};

export const url = (p = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${p.replace(/^\//, '')}`;

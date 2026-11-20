import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 관리자 페이지(Pages CMS)에서 비워 둔 칸은 null 로 저장될 수 있어 모두 너그럽게 받는다.
const str = z.string().nullish().transform((v) => (v ?? '').trim());
const strList = z.array(z.string().nullish()).nullish().transform((v) => (v ?? []).map((s) => (s ?? '').trim()).filter(Boolean));

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    brand: str,
    product: str,
    category: str,
    year: z.coerce.number().nullish(),
    summary: str,
    roles: strList,
    period: str,
    client: str,
    target: str,
    results: z
      .array(z.object({ label: str, value: str }).nullish())
      .nullish()
      .transform((v) => (v ?? []).filter((r): r is { label: string; value: string } => !!r && !!r.value)),
    detail: str,
    thumbnail: str,
    wireframe: str,
    sections: z
      .array(z.object({ name: str, note: str, start: z.coerce.number().nullish() }).nullish())
      .nullish()
      .transform((v) => (v ?? []).filter((s): s is { name: string; note: string; start: number | null | undefined } => !!s && !!s.name)),
    order: z.coerce.number().nullish(),
    featured: z.boolean().nullish(),
    published: z.boolean().nullish(),
  }),
});

export const collections = { works };

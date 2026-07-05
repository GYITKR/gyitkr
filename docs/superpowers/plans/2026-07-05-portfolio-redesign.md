# LIM GAYEON 포트폴리오 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지인이 직접 디자인 작업물을 업로드/삭제하고 모든 방문자에게 즉시 반영되는, 미니멀한 핀터레스트형 포트폴리오를 Next.js + Vercel Blob으로 재구축한다.

**Architecture:** Next.js(App Router) 앱. 공개 페이지는 Vercel Blob의 `portfolio/manifest.json`(진실의 원천)을 읽어 메이슨리 갤러리를 서버 렌더링한다. 관리자는 `/admin`에서 비밀번호로 로그인(HttpOnly 서명 쿠키) 후, 브라우저에서 Blob으로 **직접 업로드**(대용량 상세페이지 대응)하고 완료 후 서버 액션으로 매니페스트를 갱신한다. 삭제는 서버 액션이 Blob과 매니페스트를 함께 정리한다.

**Tech Stack:** Next.js 15(App Router), TypeScript, pnpm, `@vercel/blob`, Vitest(단위), Playwright(E2E), Vercel 배포.

## Global Constraints

- 런타임: **Node.js 20+** (`.nvmrc` = `20`).
- 패키지 매니저: **pnpm** 전용 (`packageManager` 필드 고정, `npm`/`yarn` 사용 금지).
- 언어: **TypeScript** strict 모드.
- 비주얼 토큰(고정값): `--bg:#0A0A08` `--surface:#141412` `--ink:#F4F4EF` `--muted:#7C7C73` `--accent:#C8FF00` `--line:rgba(255,255,255,.09)`.
- 매니페스트 경로 상수: `portfolio/manifest.json` (`addRandomSuffix:false`, `allowOverwrite:true`).
- 공개 화면에 네비 탭·About·Contact·카테고리 필터 UI 없음. 데이터 모델에 `category` 필드만 예약.
- 폰트는 CDN 링크 금지 — 로컬 self-host(`next/font/local`).
- 모든 변경 서버 액션/토큰 라우트는 **인증 검증 필수**(방어적으로 액션 내부에서도 재검증).
- 커밋 메시지는 한국어, 말미에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

- `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `.nvmrc`, `.gitignore`, `.env.example` — 프로젝트 설정
- `app/layout.tsx` — 루트 레이아웃, 폰트, 전역 CSS
- `app/globals.css` — 토큰 + 공통 스타일
- `app/page.tsx` — 공개 갤러리(서버 컴포넌트)
- `app/admin/page.tsx` — 관리자 갤러리(인증)
- `app/admin/login/page.tsx` — 로그인 폼
- `app/admin/actions.ts` — `login`/`logout`/`addItem`/`deleteItem` 서버 액션
- `app/api/blob/upload/route.ts` — 클라이언트 업로드 토큰 발급(+인증)
- `components/Gallery.tsx` — 메이슨리 갤러리(공개/관리자 공용, `admin` prop)
- `components/Lightbox.tsx` — 전체보기(클라이언트)
- `components/Uploader.tsx` — 드래그&드롭 업로드(클라이언트)
- `lib/manifest.ts` — 매니페스트 읽기/쓰기/추가/삭제
- `lib/auth.ts` — 쿠키 서명/검증, `requireAuth`
- `lib/types.ts` — 공용 타입
- `middleware.ts` — `/admin/**` 보호
- `scripts/seed.ts` — 기존 `p_images/*.png` → Blob 마이그레이션
- `lib/manifest.test.ts`, `lib/auth.test.ts` — 단위 테스트
- `e2e/portfolio.spec.ts` — Playwright E2E
- `fonts/` — Pretendard 로컬 폰트 파일

---

## Task 1: 프로젝트 스캐폴딩 + 비주얼 토큰

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.nvmrc`, `.gitignore`, `.env.example`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`(임시)
- Modify: 기존 루트 `index.html`, `admin.html` → `legacy/`로 이동 (참고용 보존, `p_images/`는 마이그레이션 소스로 유지)

**Interfaces:**
- Produces: 실행 가능한 Next 앱(`pnpm dev`), 전역 CSS 토큰(위 Global Constraints 값).

- [ ] **Step 1: 기존 정적 파일 이동**

```bash
cd C:/code/gyitkr
mkdir -p legacy && git mv index.html legacy/index.html && git mv admin.html legacy/admin.html
```

- [ ] **Step 2: Next 앱 스캐폴딩**

```bash
pnpm dlx create-next-app@latest . --ts --app --no-tailwind --no-src-dir --no-eslint --import-alias "@/*" --use-pnpm
```
`.` 에 기존 파일이 있으면 유지되도록 진행. 충돌 시 생성 파일 우선, `docs/`·`legacy/`·`p_images/`는 보존.

- [ ] **Step 3: `.nvmrc`와 `packageManager` 고정**

`.nvmrc`:
```
20
```
`package.json`에 추가:
```json
"packageManager": "pnpm@9.0.0",
"engines": { "node": ">=20" }
```

- [ ] **Step 4: 전역 토큰 CSS 작성**

`app/globals.css` (전문 교체):
```css
:root{
  --maxw:1360px; --gap:18px;
  --bg:#0A0A08; --surface:#141412; --ink:#F4F4EF; --muted:#7C7C73;
  --line:rgba(255,255,255,.09); --accent:#C8FF00;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font-family:var(--font-body),-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}
@media(prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto}}
```

- [ ] **Step 5: 루트 레이아웃 + 폰트 자리**

`app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LIM GAYEON — Design Portfolio",
  description: "상세페이지 · 커머스 비주얼 디자인",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: `.env.example` 작성**

```
# Vercel Blob 연결 시 자동 주입
BLOB_READ_WRITE_TOKEN=
# 관리자 로그인 비밀번호
ADMIN_PASSWORD=
# 세션 쿠키 서명 키 (openssl rand -hex 32)
AUTH_SECRET=
```

- [ ] **Step 7: 임시 홈 + 개발 서버 확인**

`app/page.tsx`(임시):
```tsx
export default function Home() {
  return <main style={{ padding: 40 }}>LIM GAYEON — setup ok</main>;
}
```
Run: `pnpm dev` → http://localhost:3000
Expected: "LIM GAYEON — setup ok" 표시, 콘솔 에러 없음.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: Next.js 스캐폴딩 및 비주얼 토큰 설정"
```

---

## Task 2: 공용 타입 + 매니페스트 라이브러리 (TDD)

**Files:**
- Create: `lib/types.ts`, `lib/manifest.ts`, `lib/manifest.test.ts`
- Config: `vitest.config.ts`, `package.json`(test 스크립트, devDeps)

**Interfaces:**
- Produces:
  - `type PortfolioItem = { id:string; url:string; pathname:string; title:string; category:string; width:number; height:number; order:number; createdAt:string }`
  - `type Manifest = { items: PortfolioItem[] }`
  - `readManifest(): Promise<Manifest>`
  - `writeManifest(m: Manifest): Promise<void>`
  - `addItem(input: { url:string; pathname:string; width:number; height:number; title?:string; category?:string }): Promise<PortfolioItem>`
  - `removeItem(id: string): Promise<PortfolioItem | null>` — 삭제된 항목 반환(pathname으로 Blob 삭제에 사용), 없으면 null

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add @vercel/blob
pnpm add -D vitest
```

- [ ] **Step 2: 타입 정의**

`lib/types.ts`:
```ts
export type PortfolioItem = {
  id: string;
  url: string;
  pathname: string;
  title: string;
  category: string;
  width: number;
  height: number;
  order: number;
  createdAt: string;
};
export type Manifest = { items: PortfolioItem[] };
```

- [ ] **Step 3: vitest 설정**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node" } });
```
`package.json` scripts에 추가: `"test": "vitest run"`, `"test:watch": "vitest"`

- [ ] **Step 4: 실패 테스트 작성**

`lib/manifest.test.ts`:
```ts
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
  beforeEach(() => store.clear());

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
```

- [ ] **Step 5: 테스트 실패 확인**

Run: `pnpm test`
Expected: FAIL — `./manifest` 모듈/함수 없음.

- [ ] **Step 6: 매니페스트 구현**

`lib/manifest.ts`:
```ts
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
```

- [ ] **Step 7: 테스트 통과 확인**

Run: `pnpm test`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: 매니페스트 라이브러리 및 단위 테스트 추가"
```

---

## Task 3: 인증 라이브러리 (TDD)

**Files:**
- Create: `lib/auth.ts`, `lib/auth.test.ts`

**Interfaces:**
- Produces:
  - `createToken(secret: string): Promise<string>` — 서명된 세션 토큰 문자열
  - `verifyToken(token: string | undefined, secret: string): Promise<boolean>`
  - `requireAuth(): Promise<void>` — 쿠키 검증 실패 시 throw (서버 액션용)
  - 상수: `SESSION_COOKIE = "gy_session"`
- Web Crypto(HMAC-SHA256) 사용 → Edge 미들웨어와 Node 양쪽에서 동작.

- [ ] **Step 1: 실패 테스트 작성**

`lib/auth.test.ts`:
```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test lib/auth.test.ts`
Expected: FAIL — `./auth` 없음.

- [ ] **Step 3: 인증 구현**

`lib/auth.ts`:
```ts
import { cookies } from "next/headers";

export const SESSION_COOKIE = "gy_session";
const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return b64url(sig);
}

export async function createToken(secret: string): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ role: "admin" })));
  const sig = await hmac(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifyToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = await hmac(payload, secret);
  // 길이 다르면 즉시 false, 같으면 상수시간 비교
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function requireAuth(): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET 미설정");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifyToken(token, secret))) throw new Error("unauthorized");
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test lib/auth.test.ts`
Expected: PASS (3 tests). (`createToken`/`verifyToken`은 `next/headers` 불필요.)

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: HMAC 서명 세션 인증 라이브러리 추가"
```

---

## Task 4: 로그인/로그아웃 + 미들웨어 보호

**Files:**
- Create: `app/admin/login/page.tsx`, `app/admin/actions.ts`(login/logout), `middleware.ts`

**Interfaces:**
- Consumes: `createToken`, `verifyToken`, `SESSION_COOKIE` (Task 3).
- Produces: 서버 액션 `login(formData: FormData)`, `logout()`. `/admin/**`(login 제외) 접근 시 미인증이면 `/admin/login`으로 리다이렉트.

- [ ] **Step 1: 로그인/로그아웃 액션 작성**

`app/admin/actions.ts` (login/logout 부분; addItem/deleteItem은 Task 7·8에서 이어붙임):
```ts
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createToken, SESSION_COOKIE } from "@/lib/auth";

export async function login(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!expected || !secret) throw new Error("서버 환경변수 미설정");
  if (password !== expected) redirect("/admin/login?error=1");
  const token = await createToken(secret);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
```

- [ ] **Step 2: 로그인 페이지 작성**

`app/admin/login/page.tsx`:
```tsx
import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main style={{ maxWidth: 340, margin: "18vh auto", padding: 24 }}>
      <h1 style={{ fontSize: 20, letterSpacing: "-.03em", marginBottom: 18 }}>
        <span style={{ color: "var(--accent)" }}>GY</span> 관리자 로그인
      </h1>
      <form action={login} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="password" name="password" placeholder="비밀번호" autoFocus required
          style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)",
                   background: "var(--surface)", color: "var(--ink)" }}
        />
        {error && <p style={{ color: "#e5484d", fontSize: 13 }}>비밀번호가 올바르지 않습니다.</p>}
        <button style={{ padding: "12px 14px", borderRadius: 10, border: "none",
                         background: "var(--accent)", color: "#0A0A08", fontWeight: 800, cursor: "pointer" }}>
          로그인
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: 미들웨어 작성**

`middleware.ts`:
```ts
import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? "";
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (await verifyToken(token, secret)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

// 로그인 페이지는 제외하고 /admin 하위만 보호
export const config = { matcher: ["/admin", "/admin/((?!login).*)"] };
```

- [ ] **Step 4: 수동 검증**

Run: `pnpm dev`
- `.env.local`에 `ADMIN_PASSWORD`, `AUTH_SECRET` 임시값 설정.
- http://localhost:3000/admin 접속 → `/admin/login`으로 리다이렉트되는지 확인.
- 잘못된 비밀번호 → 에러 문구. 올바른 비밀번호 → `/admin` 진입(현재는 빈/기본 페이지여도 됨).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: 관리자 로그인/로그아웃 및 미들웨어 보호"
```

---

## Task 5: 클라이언트 업로드 토큰 라우트

**Files:**
- Create: `app/api/blob/upload/route.ts`

**Interfaces:**
- Consumes: `verifyToken`, `SESSION_COOKIE` (Task 3).
- Produces: `POST /api/blob/upload` — `@vercel/blob/client`의 `upload()`가 호출하는 토큰 엔드포인트. 인증된 요청에만 토큰 발급(이미지 MIME 한정).

- [ ] **Step 1: 라우트 작성**

`app/api/blob/upload/route.ts`:
```ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const secret = process.env.AUTH_SECRET ?? "";
        const token = (await cookies()).get(SESSION_COOKIE)?.value;
        if (!(await verifyToken(token, secret))) throw new Error("unauthorized");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // 매니페스트 갱신은 클라이언트가 업로드 성공 후 addItem 액션으로 수행
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 });
  }
}
```

- [ ] **Step 2: 인증 없는 호출 거부 확인**

Run: `pnpm dev` (로그아웃 상태에서)
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/blob/upload \
  -H "Content-Type: application/json" \
  -d '{"type":"blob.generate-client-token","payload":{"pathname":"x.png","callbackUrl":"http://localhost:3000/api/blob/upload"}}'
```
Expected: `401`.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: 인증된 클라이언트 업로드 토큰 라우트"
```

---

## Task 6: 공개 갤러리 + 라이트박스

**Files:**
- Create: `components/Gallery.tsx`, `components/Lightbox.tsx`
- Modify: `app/page.tsx`(전문 교체), `app/globals.css`(갤러리/헤더/히어로/푸터 스타일 추가), `next.config.ts`(Blob 이미지 도메인)
- Font: `fonts/`에 Pretendard 파일 추가, `app/layout.tsx`에서 `next/font/local` 연결

**Interfaces:**
- Consumes: `readManifest` (Task 2), `PortfolioItem` (Task 2).
- Produces:
  - `<Gallery items={PortfolioItem[]} admin={boolean} />` — 메이슨리. `admin`이면 카드에 삭제 버튼 렌더(핸들러는 Task 8에서 연결).
  - `<Lightbox />` — 전역 클라이언트 컴포넌트; 카드 클릭 시 원본 표시(`window` 커스텀 이벤트 `gy:lightbox`로 open).

- [ ] **Step 1: Blob 이미지 도메인 허용**

`next.config.ts`:
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};
export default nextConfig;
```

- [ ] **Step 2: 폰트 연결**

`fonts/`에 `Pretendard-Regular.woff2`, `Pretendard-Bold.woff2` 배치(리포에 커밋). `app/layout.tsx` 수정:
```tsx
import localFont from "next/font/local";
const pretendard = localFont({
  src: [
    { path: "../fonts/Pretendard-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Pretendard-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
});
```
`<html lang="ko" className={pretendard.variable}>` 로 적용.

- [ ] **Step 3: 갤러리/라이트박스 스타일 추가**

`app/globals.css`에 append:
```css
header.site{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(18px);border-bottom:1px solid var(--line)}
header.site nav{max-width:var(--maxw);margin:auto;display:flex;align-items:baseline;gap:12px;padding:18px 26px}
.gy{font-weight:800;font-size:19px;letter-spacing:-.03em}
.gy b{color:var(--accent)}
.role{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.hero{max-width:var(--maxw);margin:auto;padding:66px 26px 40px}
.hero h1{font-weight:800;font-size:clamp(46px,10vw,120px);line-height:.9;letter-spacing:-.05em;text-transform:uppercase;text-wrap:balance}
.hero h1 em{font-style:normal;color:var(--accent);text-shadow:0 0 34px color-mix(in srgb,var(--accent) 42%,transparent)}
.hero .sub{margin-top:22px;font-size:15px;color:var(--muted)}
.gallery{max-width:var(--maxw);margin:auto;padding:14px 26px 90px;columns:4 270px;column-gap:var(--gap)}
.card{break-inside:avoid;margin-bottom:var(--gap);position:relative;border-radius:16px;overflow:hidden;background:var(--surface);border:1px solid var(--line);cursor:zoom-in;transition:transform .28s ease,border-color .28s ease}
.card:hover{transform:translateY(-4px);border-color:color-mix(in srgb,var(--accent) 50%,var(--line))}
.card img{display:block;width:100%;height:auto}
.card .meta{position:absolute;inset:auto 0 0 0;padding:32px 14px 12px;background:linear-gradient(to top,rgba(5,5,5,.72),transparent);opacity:0;transform:translateY(6px);transition:.24s}
.card:hover .meta{opacity:1;transform:none}
.card .meta .t{font-size:12.5px;font-weight:600;color:#fff}
.card .del{position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;cursor:pointer;background:color-mix(in srgb,var(--bg) 55%,transparent);color:#fff;border:1px solid rgba(255,255,255,.35);backdrop-filter:blur(8px);opacity:0;transition:.2s;font-size:15px}
.card:hover .del{opacity:1}
.card .del:hover{background:#e5484d;border-color:#e5484d}
footer.site{border-top:1px solid var(--line);padding:30px 26px 60px}
footer.site .foot{max-width:var(--maxw);margin:auto;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:12.5px;color:var(--muted)}
footer.site .foot a{color:var(--muted);text-decoration:none;border-bottom:1px solid transparent;transition:.15s}
footer.site .foot a:hover{color:var(--ink);border-color:var(--accent)}
.empty{max-width:var(--maxw);margin:auto;padding:40px 26px 120px;color:var(--muted)}
.lb{position:fixed;inset:0;z-index:999;background:#000;overflow:auto;display:none}
.lb.open{display:block}
.lb img{display:block;max-width:min(100%,900px);height:auto;margin:0 auto}
.lb .x{position:fixed;top:16px;right:22px;font-size:40px;line-height:1;color:var(--accent);cursor:pointer;z-index:1000}
@media(max-width:900px){.gallery{columns:3 200px}}
@media(max-width:600px){.gallery{columns:2 150px;--gap:12px}}
```

- [ ] **Step 4: Lightbox 컴포넌트**

`components/Lightbox.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";

export default function Lightbox() {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const open = (e: Event) => setSrc((e as CustomEvent<string>).detail);
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setSrc(null); };
    window.addEventListener("gy:lightbox", open as EventListener);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("gy:lightbox", open as EventListener);
      window.removeEventListener("keydown", key);
    };
  }, []);
  return (
    <div className={`lb${src ? " open" : ""}`} onClick={() => setSrc(null)}>
      <span className="x" role="button" aria-label="닫기">&times;</span>
      {src && <img src={src} alt="" />}
    </div>
  );
}
```

- [ ] **Step 5: Gallery 컴포넌트**

`components/Gallery.tsx`:
```tsx
"use client";
import Image from "next/image";
import type { PortfolioItem } from "@/lib/types";

export default function Gallery({
  items, admin = false, onDelete,
}: {
  items: PortfolioItem[];
  admin?: boolean;
  onDelete?: (id: string) => void;
}) {
  const sorted = [...items].sort((a, b) => b.order - a.order);
  if (sorted.length === 0) {
    return <p className="empty">아직 등록된 작업이 없습니다{admin ? " — 위에서 업로드해 보세요." : "."}</p>;
  }
  return (
    <main className="gallery">
      {sorted.map((it) => (
        <article
          className="card" key={it.id}
          onClick={() => window.dispatchEvent(new CustomEvent("gy:lightbox", { detail: it.url }))}
        >
          {admin && (
            <span
              className="del" role="button" title="삭제"
              onClick={(e) => { e.stopPropagation(); onDelete?.(it.id); }}
            >&times;</span>
          )}
          <Image src={it.url} width={it.width} height={it.height}
                 alt={it.title || "작업"} sizes="(max-width:600px) 50vw, (max-width:900px) 33vw, 25vw" />
          {it.title && <div className="meta"><span className="t">{it.title}</span></div>}
        </article>
      ))}
    </main>
  );
}
```

- [ ] **Step 6: 공개 페이지**

`app/page.tsx` (전문 교체):
```tsx
import Gallery from "@/components/Gallery";
import Lightbox from "@/components/Lightbox";
import { readManifest } from "@/lib/manifest";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { items } = await readManifest();
  return (
    <>
      <header className="site">
        <nav>
          <span className="gy"><b>GY</b> · LIM GAYEON</span>
          <span className="role">Design Portfolio</span>
        </nav>
      </header>
      <section className="hero">
        <h1>LIM<br /><em>GAYEON</em></h1>
        <p className="sub">상세페이지 · 커머스 비주얼 디자인</p>
      </section>
      <Gallery items={items} />
      <footer className="site">
        <div className="foot">
          <span>© 2026 LIM GAYEON</span>
          <span><a href="mailto:gy.design@email.com">gy.design@email.com</a></span>
        </div>
      </footer>
      <Lightbox />
    </>
  );
}
```
(이메일 주소는 지인 확정값으로 교체.)

- [ ] **Step 7: 수동 검증**

Run: `pnpm dev` → http://localhost:3000
Expected: 헤더/히어로/푸터 렌더, 매니페스트 비어있으면 "아직 등록된 작업이 없습니다." 표시, 콘솔 에러 없음.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: 공개 갤러리·라이트박스 및 미니멀 레이아웃"
```

---

## Task 7: 관리자 업로드

**Files:**
- Create: `components/Uploader.tsx`
- Modify: `app/admin/actions.ts`(addItem 추가), `app/admin/page.tsx`

**Interfaces:**
- Consumes: `addItem` (Task 2), `requireAuth` (Task 3), `upload` from `@vercel/blob/client`, `POST /api/blob/upload` (Task 5), `Gallery` (Task 6).
- Produces:
  - 서버 액션 `addItem(input: { url:string; pathname:string; width:number; height:number })`(인증 검증 후 매니페스트 추가, `revalidatePath("/")` + `revalidatePath("/admin")`).
  - `<Uploader />` — 드래그&드롭/파일선택 → 치수 캡처 → Blob 직접 업로드 → `addItem` → 새로고침.

- [ ] **Step 1: addItem 서버 액션 추가**

`app/admin/actions.ts`에 append:
```ts
import { addItem as addManifestItem } from "@/lib/manifest";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addItem(input: {
  url: string; pathname: string; width: number; height: number;
}): Promise<void> {
  await requireAuth();
  await addManifestItem(input);
  revalidatePath("/");
  revalidatePath("/admin");
}
```
(파일 상단 `"use server";` 유지. 기존 import와 병합.)

- [ ] **Step 2: Uploader 컴포넌트**

`components/Uploader.tsx`:
```tsx
"use client";
import { upload } from "@vercel/blob/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addItem } from "@/app/admin/actions";

function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { reject(new Error("이미지를 읽을 수 없습니다")); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

export default function Uploader() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      let done = 0;
      for (const file of Array.from(files)) {
        setMsg(`업로드 중… (${done + 1}/${files.length})`);
        const { width, height } = await readDimensions(file);
        const blob = await upload(file.name, file, {
          access: "public", handleUploadUrl: "/api/blob/upload",
        });
        await addItem({ url: blob.url, pathname: blob.pathname, width, height });
        done++;
      }
      setMsg(`${done}장 업로드 완료`);
      router.refresh();
    } catch (e) {
      setMsg(`실패: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="drop">
      <label
        className="dropinner"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <input type="file" accept="image/*" multiple hidden
               onChange={(e) => handleFiles(e.target.files)} disabled={busy} />
        {busy ? msg || "업로드 중…" : "여기로 드래그&드롭 하거나 클릭해서 이미지를 추가하세요"}
      </label>
      {!busy && msg && <p className="dropmsg">{msg}</p>}
    </section>
  );
}
```
`app/globals.css`에 append:
```css
.drop{max-width:var(--maxw);margin:0 auto;padding:8px 26px 20px}
.dropinner{display:block;border:2px dashed color-mix(in srgb,var(--accent) 45%,var(--line));border-radius:16px;padding:26px;text-align:center;color:var(--muted);font-size:14px;cursor:pointer;background:color-mix(in srgb,var(--accent) 5%,transparent)}
.dropmsg{max-width:var(--maxw);margin:6px auto 0;padding:0 26px;font-size:13px;color:var(--muted)}
```

- [ ] **Step 3: 관리자 페이지**

`app/admin/page.tsx`:
```tsx
import Gallery from "@/components/Gallery";
import Lightbox from "@/components/Lightbox";
import Uploader from "@/components/Uploader";
import { readManifest } from "@/lib/manifest";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { items } = await readManifest();
  return (
    <>
      <header className="site">
        <nav>
          <span className="gy"><b>GY</b> · 관리자</span>
          <form action={logout} style={{ marginLeft: "auto" }}>
            <button className="role" style={{ background: "none", border: "none", cursor: "pointer" }}>로그아웃</button>
          </form>
        </nav>
      </header>
      <section className="hero" style={{ paddingBottom: 8 }}>
        <h1 style={{ fontSize: "clamp(32px,6vw,64px)" }}>작업 <em>관리</em></h1>
      </section>
      <Uploader />
      <Gallery items={items} admin />
      <Lightbox />
    </>
  );
}
```
(이 단계에서 삭제 버튼은 표시되지만 동작 연결은 Task 8.)

- [ ] **Step 4: 수동 검증(실 Blob 필요)**

사전: `.env.local`에 `BLOB_READ_WRITE_TOKEN` 설정(`vercel env pull .env.local` 또는 대시보드에서 Blob 스토어 생성 후).
Run: `pnpm dev` → 로그인 → `/admin`에서 이미지 1장 드롭.
Expected: "1장 업로드 완료", 갤러리에 즉시 표시, http://localhost:3000 공개 페이지에도 표시.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: 관리자 업로드(드래그앤드롭, Blob 직접 업로드)"
```

---

## Task 8: 삭제 기능

**Files:**
- Modify: `app/admin/actions.ts`(deleteItem 추가), `app/admin/page.tsx`(삭제 핸들러 연결)
- Create: `components/AdminGallery.tsx` (삭제 확인 + 액션 호출 래퍼)

**Interfaces:**
- Consumes: `removeItem` (Task 2), `requireAuth` (Task 3), `del` from `@vercel/blob`, `Gallery` (Task 6).
- Produces:
  - 서버 액션 `deleteItem(id: string)`(인증 검증 → 매니페스트에서 제거 → Blob `del` → revalidate).
  - `<AdminGallery items />` — 클라이언트에서 확인창 후 `deleteItem` 호출하고 `router.refresh()`.

- [ ] **Step 1: deleteItem 서버 액션 추가**

`app/admin/actions.ts`에 append:
```ts
import { removeItem } from "@/lib/manifest";
import { del } from "@vercel/blob";

export async function deleteItem(id: string): Promise<void> {
  await requireAuth();
  const removed = await removeItem(id);
  if (removed) await del(removed.url);
  revalidatePath("/");
  revalidatePath("/admin");
}
```

- [ ] **Step 2: AdminGallery 래퍼**

`components/AdminGallery.tsx`:
```tsx
"use client";
import { useRouter } from "next/navigation";
import Gallery from "./Gallery";
import type { PortfolioItem } from "@/lib/types";
import { deleteItem } from "@/app/admin/actions";

export default function AdminGallery({ items }: { items: PortfolioItem[] }) {
  const router = useRouter();
  async function onDelete(id: string) {
    if (!confirm("이 작업을 삭제할까요? 되돌릴 수 없습니다.")) return;
    await deleteItem(id);
    router.refresh();
  }
  return <Gallery items={items} admin onDelete={onDelete} />;
}
```

- [ ] **Step 3: 관리자 페이지에서 AdminGallery 사용**

`app/admin/page.tsx`에서 `import Gallery ...` 대신 `import AdminGallery from "@/components/AdminGallery";` 하고 `<Gallery items={items} admin />` → `<AdminGallery items={items} />`로 교체.

- [ ] **Step 4: 수동 검증(실 Blob 필요)**

Run: `pnpm dev` → `/admin` → 카드 hover → × 클릭 → 확인.
Expected: 확인 후 카드 사라짐, 공개 페이지에서도 사라짐, Blob에서도 삭제(대시보드로 확인).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: 작업 삭제(확인 팝업, Blob+매니페스트 동시 정리)"
```

---

## Task 9: 기존 이미지 마이그레이션 스크립트

**Files:**
- Create: `scripts/seed.ts`
- Modify: `package.json`(seed 스크립트, `tsx`/`dotenv-cli` devDep)

**Interfaces:**
- Consumes: `@vercel/blob` `put`, `addItem` (Task 2). PNG 치수는 파일 헤더에서 직접 파싱(외부 의존 없이).

- [ ] **Step 1: 의존성 및 스크립트 등록**

```bash
pnpm add -D tsx dotenv-cli
```
`package.json` scripts: `"seed": "dotenv -e .env.local -- tsx scripts/seed.ts"`

- [ ] **Step 2: 시드 스크립트 작성**

`scripts/seed.ts`:
```ts
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
```

- [ ] **Step 3: 실행 및 확인**

Run: `pnpm seed`
Expected: 3장(`1.png~3.png`) 시드 로그 + "done". http://localhost:3000 에 3장 노출.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: 기존 이미지 Blob 마이그레이션 시드 스크립트"
```

---

## Task 10: Playwright E2E

**Files:**
- Create: `playwright.config.ts`, `e2e/portfolio.spec.ts`, `e2e/fixtures/sample.png`
- Modify: `package.json`(e2e 스크립트, `@playwright/test` devDep)

**Interfaces:**
- Consumes: 전체 앱. 실 Blob 대신 로컬 `.env.local`의 Blob 토큰 사용(테스트용 스토어 권장).

- [ ] **Step 1: 설치 및 설정**

```bash
pnpm add -D @playwright/test && pnpm exec playwright install chromium
```
`playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  webServer: { command: "pnpm dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
  use: { baseURL: "http://localhost:3000" },
});
```
`package.json` scripts: `"e2e": "playwright test"`

- [ ] **Step 2: 인증 가드 테스트(외부 의존 없음)**

`e2e/portfolio.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("미인증 시 /admin 은 로그인으로 리다이렉트", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("잘못된 비밀번호는 에러 표시", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[name="password"]', "wrong-password");
  await page.click('button:has-text("로그인")');
  await expect(page.getByText("비밀번호가 올바르지 않습니다.")).toBeVisible();
});
```

- [ ] **Step 3: 업로드→삭제 왕복 테스트(로컬 Blob 필요)**

`e2e/portfolio.spec.ts`에 append:
```ts
test("로그인→업로드→공개노출→삭제 왕복", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD ?? "");
  await page.click('button:has-text("로그인")');
  await expect(page).toHaveURL(/\/admin$/);

  await page.setInputFiles('input[type="file"]', "e2e/fixtures/sample.png");
  await expect(page.getByText(/업로드 완료/)).toBeVisible({ timeout: 30_000 });

  await page.goto("/");
  const cards = page.locator(".card");
  await expect(cards.first()).toBeVisible();

  await page.goto("/admin");
  page.on("dialog", (d) => d.accept());
  await page.locator(".card .del").first().click();
  await expect(page.getByText("작업 관리")).toBeVisible();
});
```
`e2e/fixtures/sample.png` 은 작은 테스트 PNG 파일을 넣는다.

- [ ] **Step 4: 실행**

Run: `pnpm e2e`
Expected: 가드 테스트 2개 항상 통과. 왕복 테스트는 `.env.local`에 Blob 토큰+비밀번호 설정 시 통과.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "test: Playwright E2E(인증 가드 + 업로드/삭제 왕복)"
```

---

## Task 11: 배포 준비 + 문서

**Files:**
- Create: `README.md`
- Modify: `legacy/` 정리(선택), `p_images/`는 시드 후 제거 가능

**Interfaces:**
- Produces: Vercel 배포 절차 문서화.

- [ ] **Step 1: Vercel Blob 스토어 연결 및 env 설정**

```bash
# 프로젝트 링크 후
vercel link
# 대시보드 Storage에서 Blob 스토어 생성·연결 → BLOB_READ_WRITE_TOKEN 자동 주입
vercel env add ADMIN_PASSWORD production
vercel env add AUTH_SECRET production   # openssl rand -hex 32 값
vercel env pull .env.local --yes
```

- [ ] **Step 2: README 작성**

`README.md`에 로컬 실행(`pnpm i`, `.env.local`, `pnpm dev`), 시드(`pnpm seed`), 배포, 환경변수 설명 기재.

- [ ] **Step 3: 프로덕션 시드 및 검증**

프로덕션 배포 후 `/admin` 로그인 → 업로드/삭제 동작 확인. (또는 로컬에서 프로덕션 Blob 토큰으로 `pnpm seed` 1회.)

- [ ] **Step 4: 정리 커밋**

```bash
git rm -r legacy p_images 2>/dev/null; git add -A
git commit -m "chore: 레거시 파일 정리 및 배포 문서"
```
(단, `p_images`는 시드 완료를 확인한 뒤 제거.)

---

## Self-Review

**Spec coverage:**
- §2 재구축 이유 → Task 1(레거시 이동), 전체 아키텍처 전환. ✓
- §3 스택 → Task 1·2·10. ✓
- §4 데이터 모델(manifest, category 예약, order) → Task 2. ✓
- §5 클라이언트 직접 업로드 → Task 5·7. ✓
- §6 인증 → Task 3·4. ✓
- §7 공개 미니멀 C → Task 6. ✓
- §8 관리자 업로드/삭제 → Task 7·8. ✓
- §9 라우트/인터페이스 → Task 4~8. ✓
- §10 환경변수 → Task 4·7·11. ✓
- §11 마이그레이션 → Task 9. ✓
- §12 비목표 → 필터/About/Contact 미구현(모델만 예약). ✓
- §13 테스트 → Task 2·3(단위), Task 10(E2E). ✓
- §14 최신 API 확인 → Task 5는 확인된 `handleUpload` 시그니처 사용. ✓

**Placeholder scan:** 이메일 주소(`gy.design@email.com`)와 폰트 파일은 실제 값/자산으로 교체 필요 — 플레이스홀더가 아니라 "지인 확정 자산"으로 명시함. 그 외 TBD 없음.

**Type consistency:** `PortfolioItem`/`Manifest`(Task2) 필드가 Gallery(Task6)·Uploader(Task7)·seed(Task9)에서 일관. `addItem`/`removeItem`/`readManifest`/`writeManifest`(lib) vs `addItem`/`deleteItem`(서버 액션) 이름 구분 명확(액션은 `@/app/admin/actions`, lib는 `@/lib/manifest`의 `addManifestItem` 별칭으로 충돌 회피). `SESSION_COOKIE`/`verifyToken`/`createToken`/`requireAuth` 일관.

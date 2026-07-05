# LIM GAYEON Portfolio

임가연 디자인 포트폴리오 웹사이트. 핀터레스트형 미니멀 갤러리(다크 + 라임 컬러)로 작업물을 보여주고, 관리자 페이지에서 이미지를 업로드·삭제할 수 있습니다.

- **스택**: Next.js 16 (App Router), TypeScript, React 19, Vercel Blob(이미지·매니페스트 저장), pnpm
- **인증 보호**: Next.js 16의 미들웨어는 `proxy.ts`(구 `middleware.ts`)로 이름이 바뀌었습니다. `/admin` 하위 라우트를 세션 쿠키로 보호합니다.

## 1. 로컬 개발

```bash
pnpm install
```

`.env.local` 파일을 프로젝트 루트에 만들고 아래 값을 채웁니다(`.env.example` 참고):

```bash
# Vercel Blob 연결 시 대시보드에서 자동 주입되는 값(로컬 개발 시 직접 발급/복사)
BLOB_READ_WRITE_TOKEN=

# 관리자 로그인 비밀번호
ADMIN_PASSWORD=

# 세션 쿠키 서명 키 (openssl rand -hex 32 로 생성)
AUTH_SECRET=
```

개발 서버 실행:

```bash
pnpm dev
```

- http://localhost:3000 — 공개 갤러리. `BLOB_READ_WRITE_TOKEN`이 없어도 빈 상태(이미지 없음)로 정상적으로 뜹니다.
- http://localhost:3000/admin — 관리자 페이지. `/admin/login`에서 `ADMIN_PASSWORD`로 로그인 후 드래그&드롭 업로드, 삭제가 가능합니다.

> 참고: `BLOB_READ_WRITE_TOKEN`이 없으면 갤러리는 빈 상태로 표시되고, 업로드 시도는 실패합니다(Blob 클라이언트 업로드 토큰 발급 API가 이 값을 필요로 함).

## 2. 테스트

```bash
# 단위 테스트 (Vitest) — lib/manifest.ts, lib/auth.ts 등
pnpm test
pnpm test:watch

# E2E 테스트 (Playwright)
pnpm exec playwright install chromium   # 최초 1회
pnpm e2e
```

- E2E 중 업로드 왕복(round-trip) 테스트는 `BLOB_READ_WRITE_TOKEN`이 설정되어 있을 때만 실행되고, 없으면 자동으로 skip됩니다.

## 3. 배포 (Vercel)

1. 프로젝트를 Vercel에 연결:
   ```bash
   vercel link
   ```
2. Vercel 대시보드 → 프로젝트 → **Storage** 탭에서 Blob 스토어를 생성하고 프로젝트에 연결합니다. 연결하면 `BLOB_READ_WRITE_TOKEN`이 프로덕션/프리뷰 환경변수로 자동 주입됩니다.
3. 나머지 환경변수를 등록합니다:
   ```bash
   vercel env add ADMIN_PASSWORD production
   vercel env add AUTH_SECRET production   # 값은 openssl rand -hex 32 로 생성
   ```
4. 로컬 `.env.local`을 Vercel 값과 동기화하려면:
   ```bash
   vercel env pull .env.local --yes
   ```
5. 배포:
   ```bash
   vercel deploy --prod
   ```
   (또는 `main`/`redesign` 브랜치를 Vercel Git 연동으로 배포)

## 4. 기존 이미지 마이그레이션(1회성 시드)

`.env.local`에 프로덕션(또는 원하는) `BLOB_READ_WRITE_TOKEN`이 설정된 상태에서:

```bash
pnpm seed
```

- `scripts/seed.ts`가 `p_images/*.png`를 Vercel Blob에 업로드하고, `portfolio/manifest.json` 매니페스트에 항목을 시드합니다.
- 시드가 정상 반영된 것을 배포된 사이트(공개 갤러리 및 `/admin`)에서 확인한 뒤, 더 이상 필요 없는 `p_images/`(원본 이미지)와 참고용으로 남겨둔 `legacy/`(구버전 정적 HTML)는 삭제해도 됩니다:
  ```bash
  git rm -r legacy p_images
  git commit -m "chore: 레거시 파일 정리"
  ```
  주의: 시드가 실제로 실행되어 Blob에 이미지가 올라간 것을 확인하기 전에는 `p_images/`를 지우지 마세요.

## 5. 환경변수

| 이름 | 용도 | 예시 / 발급 방법 |
| --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 읽기/쓰기 토큰. 매니페스트·이미지 저장에 사용 | Vercel 대시보드 Storage에서 Blob 스토어 연결 시 자동 주입 |
| `ADMIN_PASSWORD` | `/admin/login`에서 사용하는 관리자 로그인 비밀번호 | 임의의 강력한 비밀번호 |
| `AUTH_SECRET` | 관리자 세션 쿠키 서명용 비밀 키 | `openssl rand -hex 32` |

## 6. 프로젝트 구조

```
app/
  page.tsx                  # 공개 갤러리 페이지
  layout.tsx
  admin/
    page.tsx                # 관리자 페이지(업로드/삭제, 로그인 필요)
    login/page.tsx           # 관리자 로그인
    actions.ts               # 서버 액션 (addItem, deleteItem 등)
  api/blob/upload/route.ts   # Vercel Blob 클라이언트 업로드용 토큰 발급 API
components/
  Gallery.tsx                # 공개 핀터레스트형 갤러리
  Lightbox.tsx                # 이미지 확대 보기
  Uploader.tsx                # 관리자 드래그&드롭 업로드 UI
  AdminGallery.tsx            # 관리자용 갤러리(삭제 기능 포함)
lib/
  manifest.ts                # 매니페스트 읽기/쓰기 (portfolio/manifest.json)
  auth.ts                     # 세션 토큰 생성/검증
  types.ts                    # PortfolioItem, Manifest 등 타입
proxy.ts                      # Next.js 16 미들웨어(이름 변경) — /admin 인증 보호
scripts/seed.ts               # 기존 p_images/*.png → Blob 마이그레이션 스크립트
```

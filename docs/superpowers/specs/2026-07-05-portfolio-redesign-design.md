# LIM GAYEON 포트폴리오 개편 — 설계 문서

작성일: 2026-07-05

## 1. 목표

지인(임가연)의 디자인 포트폴리오를 **핀터레스트형 메이슨리 갤러리**로 개편한다. 핵심은 지인이 직접 **작업 이미지를 업로드/삭제**할 수 있고, 그 결과가 **모든 방문자에게 즉시 반영**되는 것.

## 2. 현재 상태와 재구축 이유

현행은 정적 `index.html` + `admin.html`(6.5MB) 구조다.

- `admin.html`은 업로드 이미지를 **base64로 브라우저 `localStorage`에 저장** → 업로드가 **본인 브라우저에만** 보이고 다른 기기·방문자에겐 안 보임.
- 공개 페이지 `index.html`은 `localStorage`를 읽지 않고 `p_images/1.png~100.png`(실제 파일은 3장)만 참조 → 관리자 업로드와 공개 화면이 **완전히 분리**됨.

즉 "업로드/삭제 포트폴리오"라는 핵심 요구가 현행 구조로는 성립하지 않는다. **공유 저장소 + 서버측 인증**을 갖춘 구조로 재구축한다.

## 3. 기술 스택

- **Next.js (App Router) + TypeScript**, 패키지 매니저 **pnpm**
- 이미지/메타데이터 저장: **Vercel Blob** (`@vercel/blob`)
- 이미지 최적화: `next/image` (Blob 도메인을 `remotePatterns`에 등록)
- 배포: **Vercel** (사용자가 저장소/Vercel 프로젝트 제어)
- E2E 테스트: **Playwright** (업로드/삭제 happy path)

## 4. 데이터 모델

Vercel Blob에 매니페스트 JSON 1개를 "진실의 원천"으로 둔다.

- 경로: `portfolio/manifest.json` (`addRandomSuffix:false`, `allowOverwrite:true`, `contentType:application/json`, `access:public`)

```ts
type PortfolioItem = {
  id: string          // crypto.randomUUID()
  url: string         // Vercel Blob 이미지 URL
  pathname: string    // Blob pathname (삭제 시 사용)
  title: string       // 기본값 "" — 비워둬도 됨
  category: string    // 지금은 UI 미노출, 미래 필터용 필드만 예약 (기본 "상세페이지")
  width: number       // 업로드 시 클라이언트에서 캡처 → 메이슨리 리플로우 방지
  height: number
  order: number       // 표시 순서 (신규가 위로: 큰 값이 먼저)
  createdAt: string   // ISO
}

type Manifest = { items: PortfolioItem[] }
```

- 공개 페이지와 관리자 페이지가 **같은 매니페스트**를 읽는다 (WYSIWYG).
- 단일 관리자·저빈도 쓰기이므로 매니페스트를 통째로 읽고→수정→덮어쓰기 한다. 동시 쓰기 경쟁은 실질적으로 없음(단일 사용자).

## 5. 업로드/삭제 흐름 (파일이 큼 → 클라이언트 직접 업로드)

기존 `1.png`가 6.5MB였듯 상세페이지 이미지는 크고 길다. 서버리스 요청 바디 4.5MB 한도를 피하기 위해 **Vercel Blob 클라이언트 업로드**(`@vercel/blob/client`의 `upload()`)를 쓴다. 브라우저 → Blob 직접 전송.

**업로드**
1. 관리자 인증 확인(쿠키).
2. 브라우저에서 파일 선택 → 각 파일의 `naturalWidth/Height` 캡처.
3. `upload(file, { handleUploadUrl: '/api/blob/upload' })` 호출.
   - `/api/blob/upload` 라우트의 `onBeforeGenerateToken`에서 **인증 검증** 후 토큰 발급.
4. 업로드 완료 후 브라우저가 서버 액션 `addItem({url, pathname, width, height, ...})` 호출 → 매니페스트에 항목 추가(덮어쓰기).

**삭제**
1. 카드의 삭제(×) → 확인 팝업.
2. 서버 액션 `deleteItem(id)` → 인증 검증 → Blob `del(url)` + 매니페스트에서 제거 후 덮어쓰기.

## 6. 인증 (관리자)

- 비밀번호 1개를 환경변수 `ADMIN_PASSWORD`에 둔다.
- `/admin/login`에서 비밀번호 POST → 상수시간 비교 → `AUTH_SECRET`으로 서명한 **HttpOnly 쿠키** 발급.
- `middleware`가 `/admin/**`(로그인 페이지 제외)과 업로드 토큰 라우트/변경 액션을 보호.
- 공개 페이지는 인증 불필요(읽기 전용).

## 7. 공개 사이트 (미니멀, 방향 C)

확정 시안: **다크 + 라임** (`--bg:#0A0A08`, `--accent:#C8FF00`, `--ink:#F4F4EF`), 최대한 미니멀.

- **헤더**: 워드마크 `GY · LIM GAYEON` + `Design Portfolio` 라벨만. 네비게이션 탭 없음.
- **히어로**: 이름 + 한 줄 설명(`상세페이지 · 커머스 비주얼 디자인`)만.
- **갤러리**: 핀터레스트 메이슨리 (CSS `columns`, 반응형 4/3/2열). 카드 hover 시 살짝 뜨고 제목 캡션.
- **라이트박스**: 카드 클릭 시 원본 전체 보기. 긴 상세페이지는 스크롤.
- **푸터**: `© 2026 LIM GAYEON` + 이메일 1줄.
- 카테고리 필터·About·Contact 섹션 **없음** (YAGNI, 데이터 모델에 `category`만 예약).

폰트: Pretendard를 self-host(또는 `next/font`로 로컬 임베드). CDN 링크 지양.

## 8. 관리자 사이트 (`/admin`)

- 공개 화면과 **같은 갤러리 뷰**를 재사용(WYSIWYG)하되 관리 컨트롤 추가:
  - 상단 **드래그&드롭 / ＋업로드**(여러 장 동시, 진행률 표시).
  - 카드 hover 시 **삭제(×)** 버튼(확인 팝업).
  - (v2 후보) 제목·카테고리 편집, 순서 드래그.
- 업로드 즉시 갤러리에 반영(낙관적 업데이트 + 서버 액션 확정).

## 9. 라우트 / 서버 인터페이스

- `app/page.tsx` — 공개 갤러리(서버 컴포넌트, 매니페스트 읽기, `no-store` 또는 짧은 revalidate).
- `app/admin/page.tsx` — 관리자 갤러리(인증 필요).
- `app/admin/login/page.tsx` — 로그인.
- `app/api/blob/upload/route.ts` — 클라이언트 업로드 토큰 발급(+인증).
- 서버 액션: `addItem`, `deleteItem`, `login`, `logout` (인증 검증 포함).
- `lib/manifest.ts` — 매니페스트 읽기/쓰기 유틸.
- `lib/auth.ts` — 쿠키 서명/검증.

## 10. 환경변수

- `BLOB_READ_WRITE_TOKEN` — Vercel Blob 연결 시 자동 주입.
- `ADMIN_PASSWORD` — 관리자 비밀번호.
- `AUTH_SECRET` — 세션 쿠키 서명 키.

## 11. 기존 이미지 마이그레이션

현행 `p_images/1.png~3.png`를 일회성 스크립트로 Blob에 업로드하고 매니페스트를 시드한다. (`admin.html`의 localStorage 데이터는 이관 불가 — 실제 파일만 이관.)

## 12. 비목표 (YAGNI)

- 카테고리 필터 UI, 순서 드래그, 제목 편집 — 필드/구조만 남기고 UI는 후속.
- SNS 링크, About/Contact 섹션.
- 다중 사용자·역할, 이미지 서버측 리사이즈 파이프라인(`next/image`가 처리).
- `admin.html`의 localStorage 데이터 이관.

## 13. 테스트

- Playwright E2E: (1) 로그인 → 업로드 → 공개 페이지에 노출 확인, (2) 삭제 → 사라짐 확인.
- 인증 없이 변경 액션 호출 시 거부되는지 확인.

## 14. 열린 확인 사항 (구현 착수 전 최신 문서 확인)

- `@vercel/blob` 클라이언트 업로드 / `put`·`del` API 최신 시그니처는 구현 시 `vercel:vercel-storage` 가이드로 확인(빠르게 변동).
- 매니페스트 공개 읽기 캐싱 전략(`no-store` vs `revalidateTag`) — 업로드 후 즉시 반영이 목표이므로 `no-store` 또는 태그 무효화 사용.

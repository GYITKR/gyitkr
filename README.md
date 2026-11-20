# 임가연 LIM GAYEON — 상세페이지 디자이너 포트폴리오

사이트: https://gyitkr.github.io/gyitkr/

## 작업물 올리기 (개발 지식 없이)

1. https://app.pagescms.org 에 들어가 **GitHub로 로그인**합니다.
2. 저장소 `GYITKR/gyitkr`를 엽니다.
3. 왼쪽 **작업물** → **Add an entry**(새 항목)에서 상세페이지 이미지와 정보를 넣고 **Save**를 누릅니다.
   - 필수는 상세페이지 이미지 하나뿐입니다. 나머지는 비워 두면 화면에 나오지 않습니다.
   - 순서는 `순서` 숫자로, 숨기기는 `공개` 스위치로 정합니다.
4. 저장하면 자동으로 사이트가 다시 만들어집니다. **2~3분 뒤** 사이트에서 확인하세요.
5. 경력·툴·연락처·이력서 PDF는 왼쪽 **프로필**에서 고칩니다.

> 처음 한 번은 저장소 주인이 Pages CMS GitHub App을 이 저장소에 설치해야 합니다.

## 개발

```bash
pnpm install
pnpm dev       # http://localhost:4321/gyitkr/
pnpm build     # dist/ 에 정적 사이트 생성
```

- Astro 정적 사이트. `main`에 push되면 `.github/workflows/deploy.yml`이 GitHub Pages로 배포합니다.
- 작업 1개 = `src/content/works/*.md` 파일 1개 (필드는 `src/content.config.ts`, 관리자 폼은 `.pages.yml`).
- 업로드한 파일은 `src/uploads/`에 저장되고, 빌드 때 WebP로 변환·리사이즈됩니다(원본은 배포되지 않음).
- 프로필은 `src/data/profile.json`.
- `legacy/`, `p_images/`는 예전 사이트·원본 이미지 보관용입니다.

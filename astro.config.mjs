// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gyitkr.github.io',
  base: '/gyitkr',
  trailingSlash: 'always',
  image: {
    // 아주 긴 상세페이지 원본도 처리할 수 있게 픽셀 제한을 넉넉히 둔다
    service: { entrypoint: 'astro/assets/services/sharp', config: { limitInputPixels: 400_000_000 } },
  },
});

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

test("로그인→업로드→공개노출→삭제 왕복", async ({ page }) => {
  test.skip(!process.env.BLOB_READ_WRITE_TOKEN, "Blob 토큰 필요 — 배포 후 검증");

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

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

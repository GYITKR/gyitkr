import AdminGallery from "@/components/AdminGallery";
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
      <AdminGallery items={items} />
      <Lightbox />
    </>
  );
}

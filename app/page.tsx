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

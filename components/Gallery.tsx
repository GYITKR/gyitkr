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

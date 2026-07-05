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

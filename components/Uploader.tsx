"use client";
import { upload } from "@vercel/blob/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addItem } from "@/app/admin/actions";

function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { reject(new Error("이미지를 읽을 수 없습니다")); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

export default function Uploader() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      let done = 0;
      for (const file of Array.from(files)) {
        setMsg(`업로드 중… (${done + 1}/${files.length})`);
        const { width, height } = await readDimensions(file);
        const blob = await upload(file.name, file, {
          access: "public", handleUploadUrl: "/api/blob/upload",
        });
        await addItem({ url: blob.url, pathname: blob.pathname, width, height });
        done++;
      }
      setMsg(`${done}장 업로드 완료`);
      router.refresh();
    } catch (e) {
      setMsg(`실패: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="drop">
      <label
        className="dropinner"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <input type="file" accept="image/*" multiple hidden
               onChange={(e) => handleFiles(e.target.files)} disabled={busy} />
        {busy ? msg || "업로드 중…" : "여기로 드래그&드롭 하거나 클릭해서 이미지를 추가하세요"}
      </label>
      {!busy && msg && <p className="dropmsg">{msg}</p>}
    </section>
  );
}

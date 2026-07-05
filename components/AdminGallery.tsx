"use client";
import { useRouter } from "next/navigation";
import Gallery from "./Gallery";
import type { PortfolioItem } from "@/lib/types";
import { deleteItem } from "@/app/admin/actions";

export default function AdminGallery({ items }: { items: PortfolioItem[] }) {
  const router = useRouter();
  async function onDelete(id: string) {
    if (!confirm("이 작업을 삭제할까요? 되돌릴 수 없습니다.")) return;
    await deleteItem(id);
    router.refresh();
  }
  return <Gallery items={items} admin onDelete={onDelete} />;
}

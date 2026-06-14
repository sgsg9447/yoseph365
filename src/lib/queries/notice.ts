import { createPublicClient } from "@/lib/supabase/public";
import type { NoticeListItem, NoticeDetail } from "./types";

export async function getNotices(): Promise<NoticeListItem[]> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("notice")
    .select("id, title, published_at, is_pinned")
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });
  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    publishedAt: n.published_at,
    isPinned: n.is_pinned,
  }));
}

export async function getNoticeById(id: number): Promise<NoticeDetail | null> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("notice")
    .select("id, title, body, images, tags, published_at")
    .eq("id", id)
    .eq("is_published", true)
    .eq("is_deleted", false)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    body: data.body,
    images: data.images ?? [],
    tags: data.tags ?? [],
    publishedAt: data.published_at,
  };
}

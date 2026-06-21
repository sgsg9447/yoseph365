import { createPublicClient } from "@/lib/supabase/public";

export interface PublicInquiryListItem {
  id: number;
  title: string;
  category: string;
  status: string;
  isSecret: boolean;
  authorMasked: string;
  createdAt: string;
}

export interface PublicInquiryView extends PublicInquiryListItem {
  content: string | null; // 비밀글이면 null
  answer: string | null;
}

// 공개 게시판 목록
export async function fetchPublicInquiries(): Promise<PublicInquiryListItem[]> {
  const sb = createPublicClient();
  const { data, error } = await sb.rpc("list_public_inquiries");
  if (error || !data) throw new Error("inquiry_list_failed");
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    status: r.status,
    isSecret: r.is_secret,
    authorMasked: r.author_masked,
    createdAt: r.created_at,
  }));
}

// 공개글 상세(비밀글이면 content·answer는 null)
export async function fetchPublicInquiry(id: number): Promise<PublicInquiryView | null> {
  const sb = createPublicClient();
  const { data, error } = await sb.rpc("get_public_inquiry", { p_id: id });
  if (error) throw new Error("inquiry_detail_failed");
  const r = data?.[0];
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    status: r.status,
    isSecret: r.is_secret,
    authorMasked: r.author_masked,
    createdAt: r.created_at,
    content: r.content,
    answer: r.answer,
  };
}

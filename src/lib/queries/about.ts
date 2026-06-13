import { createPublicClient } from "@/lib/supabase/public";
import type { AboutHistoryView, SiteSectionView } from "./types";
import { historyToView } from "./mappers";

export async function getAboutHistory(): Promise<{
  intro: SiteSectionView | null;
  histories: AboutHistoryView[];
}> {
  const sb = createPublicClient();
  const [{ data: histories }, { data: items }, { data: section }] = await Promise.all([
    sb.from("about_history").select("*"),
    sb.from("about_history_item").select("*"),
    sb.from("site_section").select("*").eq("key", "about_history_intro").maybeSingle(),
  ]);
  return {
    intro: section ? { title: section.title, body: section.body ?? [] } : null,
    histories: historyToView(histories ?? [], items ?? []),
  };
}

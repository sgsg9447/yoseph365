// 기존 public/photos/training-detail/1~25.JPG 를 Supabase Storage 버킷으로 이전하고
// post(category='훈련사진') 행을 생성한다. 일회성. 키는 seed-01..25.jpg.
// 실행: pnpm seed:photos  (= node --env-file=.env.local scripts/seed-training-photos.mjs)
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("환경변수 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY 가 필요합니다.");
  process.exit(1);
}

const BUCKET = "training-photos";
const COUNT = 25;
const dir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "photos",
  "training-detail",
);

const sb = createClient(url, key, { auth: { persistSession: false } });

for (let i = 1; i <= COUNT; i++) {
  const buf = await readFile(join(dir, `${i}.JPG`));
  const objectKey = `seed-${String(i).padStart(2, "0")}.jpg`;

  const up = await sb.storage
    .from(BUCKET)
    .upload(objectKey, buf, { contentType: "image/jpeg", upsert: true });
  if (up.error) {
    console.error(`업로드 실패 ${i}:`, up.error.message);
    process.exit(1);
  }

  const ins = await sb
    .from("post")
    .insert({ category: "훈련사진", title: `훈련 현장 사진 ${i}`, images: [objectKey] });
  if (ins.error) {
    console.error(`행 생성 실패 ${i}:`, ins.error.message);
    process.exit(1);
  }
  console.log(`✓ ${i}/${COUNT}`);
}
console.log("완료: 25장 이전");

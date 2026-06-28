// 기존 훈련사진(post category='훈련사진') 행 + training-photos 버킷 객체를 전부 지우고,
// 스테이징 디렉터리(leaf별 폴더, 이미 sips로 축소된 jpg)를 업로드하며 gallery_category 를 채운다.
// 1회성. 실행:
//   node --env-file=.env.local scripts/replace-training-photos.mjs <staging-dir>
// staging 구조: <dir>/집수리/*.jpg, /인테리어목공, /인테리어필름, /목공기능사, /도장기능사
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const stagingDir = process.argv[2];
if (!url || !key) {
  console.error("환경변수 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY 가 필요합니다.");
  process.exit(1);
}
if (!stagingDir) {
  console.error("사용법: node ... replace-training-photos.mjs <staging-dir>");
  process.exit(1);
}

const BUCKET = "training-photos";
const LEAVES = ["집수리", "인테리어목공", "인테리어필름", "목공기능사", "도장기능사"];

const sb = createClient(url, key, { auth: { persistSession: false } });

console.log(`대상: ${url}`);

// 1) 기존 행 삭제
const del = await sb.from("post").delete().eq("category", "훈련사진");
if (del.error) {
  console.error("기존 행 삭제 실패:", del.error.message);
  process.exit(1);
}
console.log("기존 훈련사진 행 삭제 완료");

// 2) 버킷 객체 전부 삭제
const list = await sb.storage.from(BUCKET).list("", { limit: 1000 });
if (list.error) {
  console.error("버킷 목록 실패:", list.error.message);
  process.exit(1);
}
const names = (list.data ?? []).filter((o) => o.name).map((o) => o.name);
if (names.length) {
  const rm = await sb.storage.from(BUCKET).remove(names);
  if (rm.error) {
    console.error("버킷 객체 삭제 실패:", rm.error.message);
    process.exit(1);
  }
}
console.log(`기존 객체 ${names.length}개 삭제 완료`);

// 3) leaf별 업로드 + insert
let total = 0;
for (const leaf of LEAVES) {
  const dir = join(stagingDir, leaf);
  let files;
  try {
    files = (await readdir(dir)).filter((f) => /\.jpe?g$/i.test(f)).sort();
  } catch {
    console.warn(`(건너뜀) 폴더 없음: ${dir}`);
    continue;
  }
  for (const f of files) {
    const buf = await readFile(join(dir, f));
    const objectKey = `${randomUUID()}.jpg`;
    const up = await sb.storage
      .from(BUCKET)
      .upload(objectKey, buf, { contentType: "image/jpeg", upsert: false });
    if (up.error) {
      console.error(`업로드 실패 ${leaf}/${f}:`, up.error.message);
      process.exit(1);
    }
    const ins = await sb.from("post").insert({
      category: "훈련사진",
      gallery_category: leaf,
      title: "훈련 현장 사진",
      images: [objectKey],
      is_featured: false,
    });
    if (ins.error) {
      console.error(`행 생성 실패 ${leaf}/${f}:`, ins.error.message);
      process.exit(1);
    }
    total++;
  }
  console.log(`✓ ${leaf}: ${files.length}장`);
}
console.log(`완료: 총 ${total}장 업로드`);

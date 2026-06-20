import { describe, it, expect } from "vitest";
import {
  extFromContentType,
  makeObjectKey,
  supabasePublicUrl,
  publicUrl,
  validatePhotoFile,
  TRAINING_PHOTOS_BUCKET,
} from "./keys";

describe("extFromContentType", () => {
  it("jpeg·png만 확장자를 반환", () => {
    expect(extFromContentType("image/jpeg")).toBe("jpg");
    expect(extFromContentType("image/png")).toBe("png");
  });
  it("허용 외 타입은 null", () => {
    expect(extFromContentType("image/gif")).toBeNull();
    expect(extFromContentType("application/pdf")).toBeNull();
  });
});

describe("makeObjectKey", () => {
  it("uuid.확장자 형식의 키를 만든다", () => {
    expect(makeObjectKey("image/jpeg")).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    expect(makeObjectKey("image/png")).toMatch(/^[0-9a-f-]{36}\.png$/);
  });
  it("허용 외 타입은 null", () => {
    expect(makeObjectKey("image/webp")).toBeNull();
  });
});

describe("supabasePublicUrl", () => {
  it("공개 객체 URL을 조립(끝 슬래시 정규화)", () => {
    expect(supabasePublicUrl("http://localhost:54321", "training-photos", "a.jpg")).toBe(
      "http://localhost:54321/storage/v1/object/public/training-photos/a.jpg",
    );
    expect(supabasePublicUrl("http://x/", "b", "k.png")).toBe(
      "http://x/storage/v1/object/public/b/k.png",
    );
  });
});

describe("publicUrl", () => {
  it("환경변수 베이스 + 버킷으로 URL을 만든다", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    expect(publicUrl("a.jpg")).toBe(
      `http://localhost:54321/storage/v1/object/public/${TRAINING_PHOTOS_BUCKET}/a.jpg`,
    );
  });
});

describe("validatePhotoFile", () => {
  it("jpeg·png는 통과(null)", () => {
    expect(validatePhotoFile({ type: "image/jpeg", size: 1000 })).toBeNull();
    expect(validatePhotoFile({ type: "image/png", size: 1000 })).toBeNull();
  });
  it("허용 외 타입은 메시지", () => {
    expect(validatePhotoFile({ type: "image/gif", size: 1000 })).toMatch(/JPG·PNG/);
  });
  it("10MB 초과는 메시지", () => {
    expect(validatePhotoFile({ type: "image/jpeg", size: 11 * 1024 * 1024 })).toMatch(/10MB/);
  });
});

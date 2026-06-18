import Image from "next/image";
import { getTrainingPhotos } from "@/lib/queries/admin";
import { ImageIcon, X } from "@/components/icons";

export default async function PhotosPage() {
  const photos = await getTrainingPhotos();

  return (
    <div>
      {/* Upload dropzone — presentational only */}
      <div className="border-2 border-dashed border-primary-border bg-primary-softer rounded-lg py-12 flex flex-col items-center justify-center gap-2">
        <ImageIcon size={28} className="text-primary" />
        <p className="text-body-strong text-[15px] font-bold">
          사진을 끌어다 놓거나 클릭해서 업로드
        </p>
        <p className="text-muted text-[13px]">JPG·PNG 최대 10MB</p>
      </div>

      {photos.length === 0 ? (
        <p className="text-muted text-[14px] mt-6 text-center">
          아직 업로드된 사진이 없습니다.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-[4/3] rounded-[14px] overflow-hidden"
            >
              {photo.image !== null ? (
                <Image
                  src={photo.image}
                  alt={photo.label}
                  fill
                  className="object-cover"
                  sizes="(max-width:760px) 50vw, 33vw"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background:
                      "repeating-linear-gradient(45deg, #eef1f4 0, #eef1f4 10px, #f7f9fb 10px, #f7f9fb 20px)",
                  }}
                />
              )}

              {/* Filename chip */}
              <span className="absolute bottom-2 left-2 bg-black/55 text-white text-[12px] font-medium rounded-md px-2 py-1">
                {photo.label}
              </span>

              {/* Delete button — presentational only */}
              <button
                type="button"
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 inline-flex items-center justify-center hover:bg-error-soft hover:text-error"
                aria-label="삭제"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

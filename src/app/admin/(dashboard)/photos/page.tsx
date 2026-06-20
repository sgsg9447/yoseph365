import { getTrainingPhotos } from "@/lib/queries/admin";
import { PhotoUploader } from "./PhotoUploader";
import { DeletePhotoButton } from "./DeletePhotoButton";

export default async function PhotosPage() {
  const photos = await getTrainingPhotos();

  return (
    <div>
      <PhotoUploader />

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
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.image}
                  alt={photo.label}
                  className="w-full h-full object-cover"
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

              <span className="absolute bottom-2 left-2 bg-black/55 text-white text-[12px] font-medium rounded-md px-2 py-1">
                {photo.label}
              </span>

              <DeletePhotoButton id={photo.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

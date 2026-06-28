import { getTrainingPhotos } from "@/lib/queries/admin";
import { PhotoUploader } from "./PhotoUploader";
import { PhotoManager } from "./PhotoManager";

export default async function PhotosPage() {
  const { photos } = await getTrainingPhotos();

  return (
    <div>
      <PhotoUploader />

      {photos.length === 0 ? (
        <p className="text-muted text-[14px] mt-6 text-center">
          아직 업로드된 사진이 없습니다.
        </p>
      ) : (
        <PhotoManager photos={photos} />
      )}
    </div>
  );
}

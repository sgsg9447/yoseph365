import { getTrainingPhotos } from "@/lib/queries/admin";
import { FEATURED_MAX } from "@/lib/gallery/categories";
import { PhotoUploader } from "./PhotoUploader";
import { PhotoGrid } from "./PhotoGrid";

export default async function PhotosPage() {
  const { photos, featuredCount } = await getTrainingPhotos();

  return (
    <div>
      <PhotoUploader />

      <p className="text-muted text-[13px] mt-4">
        메인 노출 {featuredCount}/{FEATURED_MAX}
      </p>

      {photos.length === 0 ? (
        <p className="text-muted text-[14px] mt-6 text-center">
          아직 업로드된 사진이 없습니다.
        </p>
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </div>
  );
}

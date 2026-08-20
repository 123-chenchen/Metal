import { HttpTypes } from "@medusajs/types"
import { Container } from "@modules/common/components/ui"
import Image from "next/image"

type ImageGalleryProps = {
  image?: HttpTypes.StoreProductImage | null
}

const ImageGallery = ({ image }: ImageGalleryProps) => {
  if (!image?.url) {
    return null
  }

  return (
    <div className="flex items-start relative">
      <div className="flex flex-col flex-1 small:mx-16 gap-y-4">
        <Container
          key={image.id}
          className="relative aspect-[29/34] w-full overflow-hidden bg-ui-bg-subtle"
          id={image.id}
        >
          <Image
            src={image.url}
            priority
            className="absolute inset-0 rounded-rounded"
            alt="Product image"
            fill
            sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
            style={{
              objectFit: "cover",
            }}
          />
        </Container>
      </div>
    </div>
  )
}

export default ImageGallery

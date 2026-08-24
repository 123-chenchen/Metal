import { Container, clx } from "@modules/common/components/ui"
import Image from "next/image"
import React from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: { url?: string }[] | null
  // "auto" renders the image at its own natural aspect ratio (grid cell
  // height follows the image) instead of cropping it into a fixed box.
  size?: "small" | "medium" | "large" | "full" | "square" | "auto"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
  // Flush, chrome-less rendering (no padding/bg/shadow/rounded corners) for
  // tightly-packed grid layouts. Other callers (cart, orders) keep the
  // default card treatment.
  bare?: boolean
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  bare,
  "data-testid": dataTestid,
}) => {
  const initialImage = thumbnail || images?.[0]?.url

  const sizeClassName = clx(
    "relative w-full overflow-hidden",
    !bare &&
      "p-4 bg-ui-bg-subtle shadow-elevation-card-rest rounded-large group-hover:shadow-elevation-card-hover transition-shadow ease-in-out duration-150",
    className,
    {
      "aspect-[11/14]": isFeatured,
      "aspect-[9/16]": !isFeatured && size !== "square" && size !== "auto",
      "aspect-[1/1]": size === "square",
      "w-[180px]": size === "small",
      "w-[290px]": size === "medium",
      "w-[440px]": size === "large",
      "w-full": size === "full" || size === "auto",
    }
  )

  if (bare) {
    return (
      <div className={sizeClassName} data-testid={dataTestid}>
        <ImageOrPlaceholder image={initialImage} size={size} />
      </div>
    )
  }

  return (
    <Container className={sizeClassName} data-testid={dataTestid}>
      <ImageOrPlaceholder image={initialImage} size={size} />
    </Container>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
}: Pick<ThumbnailProps, "size"> & { image?: string }) => {
  if (!image) {
    return (
      <div className="w-full h-full absolute inset-0 flex items-center justify-center">
        <PlaceholderImage size={size === "small" ? 16 : 24} />
      </div>
    )
  }

  if (size === "auto") {
    // No fixed box to fill, and Medusa doesn't give us the image's real
    // dimensions up front, so render it natively: the browser sizes the
    // element from the loaded file and the grid cell's height follows.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={image}
        alt="Thumbnail"
        draggable={false}
        loading="lazy"
        className="block w-full h-auto"
      />
    )
  }

  return (
    <Image
      src={image}
      alt="Thumbnail"
      className="absolute inset-0 object-cover object-center"
      draggable={false}
      quality={50}
      sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
      fill
    />
  )
}

export default Thumbnail

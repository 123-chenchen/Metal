import Image from "next/image"
import { HomeGridItemContent } from "@lib/data/home-content"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const linkHref = (item: HomeGridItemContent) =>
  item.link_type === "collection"
    ? `/collections/${item.link_value}`
    : `/categories/${item.link_value}`

const GridTile = ({ item }: { item: HomeGridItemContent }) => {
  return (
    <LocalizedClientLink
      href={linkHref(item)}
      className="group relative block aspect-[4/5] w-full overflow-hidden bg-metal-panel-2 transition-all duration-200 hover:-translate-y-1"
    >
      {item.media_type === "video" ? (
        <video
          src={item.media_url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Image
          src={item.media_url}
          alt={item.title ?? ""}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover object-center"
        />
      )}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/90 via-black/35 to-transparent p-6 text-center">
        {item.title && (
          <h3 className="font-display text-3xl tracking-wide text-metal-cream small:text-4xl">
            {item.title}
          </h3>
        )}
      </div>
    </LocalizedClientLink>
  )
}

const FeaturedGrid = ({ items }: { items: HomeGridItemContent[] }) => {
  if (!items.length) {
    return null
  }

  return (
    <div className="content-container bg-metal-black py-14 small:py-20">
      <div className="mb-9">
        <h2 className="mt-2.5 font-display text-3xl tracking-wide text-metal-cream">
          Pick Your Universe
        </h2>
      </div>
      <div className="grid grid-cols-1 small:grid-cols-3 gap-6">
        {items
          .sort((a, b) => a.position - b.position)
          .map((item) => (
            <GridTile key={item.position} item={item} />
          ))}
      </div>
    </div>
  )
}

export default FeaturedGrid

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
      className="group relative block aspect-[4/5] w-full overflow-hidden rounded-lg border border-metal-gold/15 bg-metal-panel-2 transition-all duration-200 hover:-translate-y-1 hover:border-metal-gold/50"
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
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent p-6">
        <span className="font-mono-brand text-[11px] uppercase tracking-wide text-metal-gold">
          {item.link_type === "collection" ? "Collection" : "Category"}
        </span>
        {item.title && (
          <h3 className="font-display text-2xl tracking-wide text-metal-cream">
            {item.title}
          </h3>
        )}
        <div className="mt-2.5 flex items-center gap-2 font-mono-brand text-xs text-metal-cream/85">
          Shop the drop
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-metal-gold"
          >
            <path d="M4 10h11M11 5l5 5-5 5" />
          </svg>
        </div>
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
        <span className="font-mono-brand text-xs font-bold uppercase tracking-wide text-metal-gold">
          Shop by world
        </span>
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

import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { MEGA_MENU_SECTIONS } from "./config"
import MegaMenu, { MegaMenuSection } from "./mega-menu"

const categoryHref = (handle: string) => `/categories/${handle}`
const collectionHref = (handle: string) => `/collections/${handle}`

export default async function MegaMenuServer() {
  const [categories, { collections }] = await Promise.all([
    listCategories(),
    listCollections(),
  ])

  const categoriesByHandle = new Map(
    (categories ?? []).map((category) => [category.handle, category])
  )
  const collectionsByHandle = new Map(
    (collections ?? []).map((collection) => [collection.handle, collection])
  )

  const sections: MegaMenuSection[] = MEGA_MENU_SECTIONS.map((section) => ({
    title: section.title,
    links: section.entries
      .map((entry) => {
        if (entry.type === "category") {
          const category = categoriesByHandle.get(entry.handle)
          if (!category?.handle) {
            return null
          }
          return { label: category.name, href: categoryHref(category.handle) }
        }

        const collection = collectionsByHandle.get(entry.handle)
        if (!collection?.handle) {
          return null
        }
        return {
          label: collection.title,
          href: collectionHref(collection.handle),
        }
      })
      .filter((link): link is { label: string; href: string } => !!link),
  })).filter((section) => section.links.length > 0)

  return <MegaMenu sections={sections} />
}

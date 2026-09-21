import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import MegaMenu, { MegaMenuSection } from "./mega-menu"

const categoryHref = (handle: string) => `/categories/${handle}`
const collectionHref = (handle: string) => `/collections/${handle}`

export async function getExploreMegaMenuSections(): Promise<MegaMenuSection[]> {
  const [categories, { collections }] = await Promise.all([
    listCategories(),
    listCollections(),
  ])

  return [
    {
      title: "Categories",
      links: categories.filter((category) => category.handle).map((category) => ({
        label: category.name,
        href: categoryHref(category.handle),
      })),
    },
    {
      title: "Collections",
      links: collections.filter((collection) => collection.handle).map((collection) => ({
        label: collection.title,
        href: collectionHref(collection.handle!),
      })),
    },
  ]

}

export default async function MegaMenuServer() {
  const sections = await getExploreMegaMenuSections()

  return <MegaMenu sections={sections} />
}

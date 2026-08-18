import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listCollections } from "@lib/data/collections"
import { addCustomItemsToCart } from "@lib/data/custom-poster"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import CustomWallTemplate from "@modules/custom/templates/wall"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Build Wall",
  description: "Preview a hexagon wall layout and add it to your cart.",
}

type CustomWallPageProps = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function CustomWallPage(props: CustomWallPageProps) {
  const params = await props.params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const [{ response }, collectionsResponse] = await Promise.all([
    listProducts({
      countryCode: params.countryCode,
      queryParams: {
        limit: 100,
        fields:
          "*variants.calculated_price,*variants.images,*variants.options,+metadata,+tags,*images",
      },
    }),
    listCollections({ limit: "100" }).catch(() => ({
      collections: [],
      count: 0,
    })),
  ])

  return (
    <CustomWallTemplate
      products={response.products}
      collections={collectionsResponse.collections}
      countryCode={params.countryCode}
      currencyCode={region.currency_code}
      addItemsToCartAction={addCustomItemsToCart}
    />
  )
}

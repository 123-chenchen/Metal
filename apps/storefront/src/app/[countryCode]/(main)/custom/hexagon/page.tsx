import { Metadata } from "next"
import { notFound } from "next/navigation"

import { addCustomItemsToCart } from "@lib/data/custom-poster"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import HexagonCustomTemplate from "@modules/custom/templates/hexagon"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Custom Hexagon Poster",
  description: "Upload your own image and crop a preview for a custom hexagon poster.",
}

type CustomHexagonPageProps = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function CustomHexagonPage(props: CustomHexagonPageProps) {
  const params = await props.params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: {
      handle: "hexagon-metal-posters",
      fields:
        "*variants.calculated_price,*variants.images,*variants.options,+metadata,+tags,*images",
    },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  return (
    <HexagonCustomTemplate
      product={product}
      countryCode={params.countryCode}
      addItemsToCartAction={addCustomItemsToCart}
    />
  )
}

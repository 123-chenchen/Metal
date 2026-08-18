import { Metadata } from "next"
import { notFound } from "next/navigation"

import { addCustomItemsToCart } from "@lib/data/custom-poster"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import StandardCustomTemplate from "@modules/custom/templates/standard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Custom Standard Poster",
  description: "Upload your own image and crop a preview for a custom standard poster.",
}

type CustomStandardPageProps = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function CustomStandardPage(
  props: CustomStandardPageProps
) {
  const params = await props.params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: {
      handle: "standard-metal-posters",
      fields:
        "*variants.calculated_price,*variants.images,*variants.options,+metadata,+tags,*images",
    },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  return (
    <StandardCustomTemplate
      product={product}
      countryCode={params.countryCode}
      addItemsToCartAction={addCustomItemsToCart}
    />
  )
}

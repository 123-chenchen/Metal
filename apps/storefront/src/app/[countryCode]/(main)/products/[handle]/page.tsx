import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import { SelectedImage } from "@lib/util/flatten-product-images"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string; img?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images!.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}

// Reorders `images` so the design picked on the listing page (via the
// `img` search param, 1-based index into the full `product.images`) is
// first/prominent. Falls back to the first image when there's no valid
// `img` param (e.g. a direct PDP visit) or the selected image isn't part
// of the current variant-filtered set.
function resolveSelectedImage(
  product: HttpTypes.StoreProduct,
  images: HttpTypes.StoreProductImage[] | null | undefined,
  imgParam: string | undefined
): { images: HttpTypes.StoreProductImage[]; selectedImage: SelectedImage | null } {
  const list = images ?? []

  if (!list.length) {
    return { images: list, selectedImage: null }
  }

  const allImages = product.images ?? []
  const requestedIndex = imgParam ? parseInt(imgParam, 10) : NaN
  const requestedImage =
    Number.isInteger(requestedIndex) && requestedIndex >= 1
      ? allImages[requestedIndex - 1]
      : undefined

  const selectedIndexInList = requestedImage
    ? list.findIndex((image) => image.id === requestedImage.id)
    : -1

  const reordered =
    selectedIndexInList > 0
      ? [
          list[selectedIndexInList],
          ...list.slice(0, selectedIndexInList),
          ...list.slice(selectedIndexInList + 1),
        ]
      : list

  const selected = reordered[0]
  const selectedIndex =
    allImages.findIndex((image) => image.id === selected.id) + 1 || 1

  return {
    images: reordered,
    selectedImage: {
      url: selected.url ?? "",
      index: selectedIndex,
      designName: `${product.title} ${selectedIndex}`,
    },
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  return {
    title: `${product.title} | Medusa Store`,
    description: `${product.title}`,
    openGraph: {
      title: `${product.title} | Medusa Store`,
      description: `${product.title}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    notFound()
  }

  const variantImages = getImagesForVariant(pricedProduct, selectedVariantId)
  const { images, selectedImage } = resolveSelectedImage(
    pricedProduct,
    variantImages,
    searchParams.img
  )

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      images={images}
      selectedImage={selectedImage}
    />
  )
}

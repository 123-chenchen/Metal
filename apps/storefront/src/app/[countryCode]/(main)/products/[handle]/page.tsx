import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { SelectedImage } from "@lib/util/flatten-product-images"
import ProductTemplate from "@modules/products/templates"
import { GalleryImage } from "@modules/products/components/image-gallery"
import { HttpTypes, StoreCartShippingOption } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string; img?: string }>
}

// retrieveCart() reads the cart cookie (via next/headers), which conflicts
// with Next's static optimization for a route that also has
// generateStaticParams: any path not in that pre-generated list would 500
// with a DYNAMIC_SERVER_USAGE error instead of falling back to on-demand
// rendering. Force per-request rendering so every product page - built at
// deploy time or added after - works the same way.
export const dynamic = "force-dynamic"

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

// Builds the gallery's image list (in natural order, filtered to the
// selected variant when it has its own images) plus which one is active —
// picked via the `img` search param, a 1-based index into the full
// `product.images` list (so the index stays stable across variant
// filtering and matches the links used on listing-page design cards).
function resolveSelectedImage(
  product: HttpTypes.StoreProduct,
  images: HttpTypes.StoreProductImage[] | null | undefined,
  imgParam: string | undefined
): { images: GalleryImage[]; selectedImage: SelectedImage | null } {
  const allImages = product.images ?? []

  const galleryImages: GalleryImage[] = (images ?? []).map((image) => ({
    id: image.id,
    url: image.url ?? "",
    index: allImages.findIndex((a) => a.id === image.id) + 1 || 1,
  }))

  if (!galleryImages.length) {
    return { images: galleryImages, selectedImage: null }
  }

  const requestedIndex = imgParam ? parseInt(imgParam, 10) : NaN
  const requested = Number.isInteger(requestedIndex)
    ? galleryImages.find((image) => image.index === requestedIndex)
    : undefined

  const selected = requested ?? galleryImages[0]

  return {
    images: galleryImages,
    selectedImage: {
      url: selected.url,
      index: selected.index,
      designName: `${product.title} ${selected.index}`,
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

  const cart = await retrieveCart()
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions()
    shippingOptions = shipping_options
  }

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      images={images}
      selectedImage={selectedImage}
      cart={cart}
      shippingOptions={shippingOptions}
    />
  )
}

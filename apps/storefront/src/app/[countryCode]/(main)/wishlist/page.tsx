import { Metadata } from "next"

import WishlistTemplate from "@modules/wishlist/templates"

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Your favorited products.",
}

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function WishlistPage(props: Params) {
  const params = await props.params

  return <WishlistTemplate countryCode={params.countryCode} />
}

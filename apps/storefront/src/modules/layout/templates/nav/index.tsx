import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShoppingBag from "@modules/common/icons/shopping-bag"
import UserCircle from "@modules/common/icons/user-circle"
import CartButton from "@modules/layout/components/cart-button"
import MegaMenuServer, {
  getExploreMegaMenuSections,
} from "@modules/layout/components/mega-menu"
import MegaMenu from "@modules/layout/components/mega-menu/mega-menu"
import MobileNav from "@modules/layout/components/mobile-nav"
import NavSelectors from "@modules/layout/components/nav-selectors"
import PromoBar from "@modules/layout/components/promo-bar"
import SearchBar from "@modules/layout/components/search-bar"
import WishlistButton from "@modules/layout/components/wishlist-button"

const CUSTOM_MENU_SECTIONS = [
  {
    title: "Custom Posters",
    links: [
      { label: "Custom Standard Poster", href: "/custom/standard" },
      { label: "Custom Hexagon Poster", href: "/custom/hexagon" },
      { label: "Build Wall", href: "/custom/wall" },
    ],
  },
]

export default async function Nav() {
  const [regions, locales, currentLocale, exploreSections] =
    await Promise.all([
      listRegions().then((regions: StoreRegion[]) => regions),
      listLocales(),
      getLocale(),
      getExploreMegaMenuSections(),
    ])

  return (
    <>
      <PromoBar />
      <div className="sticky top-0 inset-x-0 z-50 group">
        <header className="relative h-16 mx-auto border-b duration-200 bg-metal-black border-metal-gold/15">
          <nav className="content-container txt-xsmall-plus text-metal-cream/80 flex items-center justify-between w-full h-full text-small-regular">
            <div className="flex items-center gap-x-7 h-full">
              <MobileNav
                exploreSections={exploreSections}
                customSections={CUSTOM_MENU_SECTIONS}
              />
              <LocalizedClientLink
                href="/"
                className="hidden small:flex flex-col leading-[0.85] gap-1"
                data-testid="nav-store-link"
              >
                <span
                  className="font-display text-xl text-metal-cream tracking-wide"
                  style={{
                    textShadow:
                      "0 0 14px rgba(244,196,48,0.55), 0 0 2px rgba(244,196,48,0.8)",
                  }}
                >
                  HexMetal
                </span>
                <span className="font-brand text-metal-gold text-xs tracking-[0.5em] pl-px">
                  POSTER
                </span>
              </LocalizedClientLink>

              <div className="hidden small:flex h-full">
                <LocalizedClientLink
                  className="h-full flex items-center hover:text-metal-gold transition-colors"
                  href="/"
                  data-testid="nav-home-link"
                >
                  Home
                </LocalizedClientLink>
              </div>
              <div className="hidden small:flex h-full">
                <LocalizedClientLink
                  className="h-full flex items-center hover:text-metal-gold transition-colors"
                  href="/store"
                  data-testid="nav-store-link-top"
                >
                  Store
                </LocalizedClientLink>
              </div>
              <div className="hidden small:flex h-full">
                <Suspense
                  fallback={<span className="h-full flex items-center">Explore</span>}
                >
                  <MegaMenuServer />
                </Suspense>
              </div>
              <div className="hidden small:flex h-full">
                <MegaMenu sections={CUSTOM_MENU_SECTIONS} triggerLabel="Custom" />
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center h-full px-2">
              <SearchBar />
            </div>

            <div className="flex items-center gap-x-3 xsmall:gap-x-6 h-full">
              <div className="hidden small:flex">
                <NavSelectors
                  regions={regions}
                  locales={locales}
                  currentLocale={currentLocale}
                />
              </div>
              <div className="flex items-center h-full">
                <WishlistButton />
              </div>
              <div className="flex items-center h-full">
                <LocalizedClientLink
                  className="hover:text-metal-gold transition-colors"
                  href="/account"
                  data-testid="nav-account-link"
                >
                  <UserCircle size="20" />
                </LocalizedClientLink>
              </div>
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="hover:text-metal-gold transition-colors flex items-center"
                    href="/cart"
                    data-testid="nav-cart-link"
                  >
                    <ShoppingBag size="20" />
                    <span className="sr-only">Cart (0)</span>
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>
          </nav>
        </header>
      </div>
    </>
  )
}

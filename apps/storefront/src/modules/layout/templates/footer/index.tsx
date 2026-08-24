import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { clx } from "@modules/common/components/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MedusaCTA from "@modules/layout/components/medusa-cta"

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()

  return (
    <footer className="border-t border-metal-gold/15 bg-metal-panel w-full">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-10 xsmall:flex-row items-start justify-between py-16">
          <div className="flex flex-col gap-y-3 max-w-[260px]">
            <LocalizedClientLink
              href="/"
              className="flex flex-col leading-[0.85] gap-1"
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
            <p className="text-metal-gray txt-small leading-relaxed">
              Premium metal-printed art for anime and gaming fans — waterproof,
              scratch-proof, and mounted in seconds.
            </p>
          </div>
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus font-mono-brand text-metal-gold uppercase tracking-wide">
                  Categories
                </span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return
                    }

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null

                    return (
                      <li
                        className="flex flex-col gap-2 text-metal-gray txt-small"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "hover:text-metal-gold transition-colors",
                            children && "txt-small-plus"
                          )}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children &&
                              children.map((child) => (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    className="hover:text-metal-gold transition-colors"
                                    href={`/categories/${child.handle}`}
                                    data-testid="category-link"
                                  >
                                    {child.name}
                                  </LocalizedClientLink>
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus font-mono-brand text-metal-gold uppercase tracking-wide">
                  Collections
                </span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-metal-gray txt-small",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-metal-gold transition-colors"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus font-mono-brand text-metal-gold uppercase tracking-wide">
                Medusa
              </span>
              <ul className="grid grid-cols-1 gap-y-2 text-metal-gray txt-small">
                <li>
                  <a
                    href="https://github.com/medusajs"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-metal-gold transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.medusajs.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-metal-gold transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/medusajs/dtc-starter"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-metal-gold transition-colors"
                  >
                    Source code
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex w-full pb-10 pt-6 border-t border-metal-gold/15 justify-between items-center text-metal-gray font-mono-brand">
          <span className="txt-compact-small">
            © {new Date().getFullYear()} AniMetal Poster. All rights reserved.
          </span>
          <MedusaCTA />
        </div>
      </div>
    </footer>
  )
}

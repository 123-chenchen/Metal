"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Search from "@modules/common/icons/search"
import Spinner from "@modules/common/icons/spinner"

const RESULT_LIMIT = 5
const DEBOUNCE_MS = 300

const SearchBar = () => {
  const [value, setValue] = useState("")
  const [results, setResults] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { countryCode } = useParams()

  useEffect(() => {
    const query = value.trim()

    if (!query) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timeout = setTimeout(() => {
      listProducts({
        countryCode: countryCode as string,
        queryParams: { q: query, limit: RESULT_LIMIT },
      })
        .then(({ response }) => setResults(response.products))
        .finally(() => setIsLoading(false))
    }, DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [value, countryCode])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const goToResults = (q: string) => {
    setIsOpen(false)
    router.push(`/${countryCode}/search?q=${encodeURIComponent(q)}`)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const q = value.trim()
    if (q) {
      goToResults(q)
    }
  }

  const query = value.trim()
  const showDropdown = isOpen && query.length > 0

  return (
    <div
      ref={containerRef}
      className="relative flex h-full items-center"
      data-testid="nav-search-container"
    >
      <form
        onSubmit={handleSubmit}
        className="group relative flex items-center"
        data-testid="nav-search-form"
      >
        <Search
          size="16"
          className="pointer-events-none absolute left-0 text-metal-cream/50"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products..."
          className="h-9 w-40 xsmall:w-64 small:w-96 border-0 border-b border-transparent bg-transparent pl-6 pr-1 text-small-regular text-metal-cream placeholder:text-metal-cream/40 transition-colors focus:outline-none group-hover:border-metal-gold/50 focus:border-metal-gold"
          data-testid="nav-search-input"
        />
      </form>

      {showDropdown && (
        <div
          className="absolute inset-x-0 top-full z-[65] min-w-[280px] overflow-hidden bg-metal-panel shadow-lg"
          data-testid="nav-search-results"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-metal-cream/60">
              <Spinner size="16" />
              <span className="txt-compact-small">Searching...</span>
            </div>
          ) : results.length ? (
            <>
              <ul className="flex flex-col gap-1 p-1">
                {results.map((product) => {
                  const { cheapestPrice } = getProductPrice({ product })

                  return (
                    <li key={product.id}>
                      <LocalizedClientLink
                        href={`/products/${product.handle}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-base p-3 hover:bg-metal-gold/10 transition-colors"
                      >
                        <span className="h-12 w-12 shrink-0 overflow-hidden rounded-base bg-ui-bg-subtle">
                          {product.thumbnail && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.thumbnail}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate txt-compact-small-plus text-metal-cream">
                            {product.title}
                          </span>
                          {cheapestPrice && (
                            <span className="txt-compact-small text-metal-gold">
                              {cheapestPrice.calculated_price}
                            </span>
                          )}
                        </span>
                      </LocalizedClientLink>
                    </li>
                  )
                })}
              </ul>
              <button
                type="button"
                onClick={() => goToResults(query)}
                className="w-full p-3 text-center txt-compact-small-plus text-metal-gold hover:bg-metal-gold/10 transition-colors"
              >
                View all results for &quot;{query}&quot;
              </button>
            </>
          ) : (
            <div className="p-6 text-center txt-compact-small text-metal-cream/60">
              No products found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar

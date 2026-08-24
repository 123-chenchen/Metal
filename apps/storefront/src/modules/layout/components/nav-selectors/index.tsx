"use client"

import useToggleState from "@lib/hooks/use-toggle-state"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"

type NavSelectorsProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const NavSelectors = ({ regions, locales, currentLocale }: NavSelectorsProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  return (
    <div className="hidden small:flex items-center gap-x-6 h-full">
      {!!locales?.length && (
        <div
          className="h-full"
          onMouseEnter={languageToggleState.open}
          onMouseLeave={languageToggleState.close}
        >
          <LanguageSelect
            toggleState={languageToggleState}
            locales={locales}
            currentLocale={currentLocale}
          />
        </div>
      )}
      {regions && (
        <div
          className="h-full"
          onMouseEnter={countryToggleState.open}
          onMouseLeave={countryToggleState.close}
        >
          <CountrySelect toggleState={countryToggleState} regions={regions} />
        </div>
      )}
    </div>
  )
}

export default NavSelectors

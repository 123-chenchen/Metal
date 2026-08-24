"use client"

import { useEffect, useState } from "react"
import clsx from "clsx"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import X from "@modules/common/icons/x"
import { MegaMenuSection } from "@modules/layout/components/mega-menu/mega-menu"

type MobileNavProps = {
  exploreSections: MegaMenuSection[]
  customSections: MegaMenuSection[]
}

const MobileNav = ({ exploreSections, customSections }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const close = () => setIsOpen(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  const sections = [...exploreSections, ...customSections]

  return (
    <>
      <button
        type="button"
        className="small:hidden flex flex-col leading-[0.85] gap-1"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        aria-expanded={isOpen}
        data-testid="mobile-menu-trigger"
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
      </button>

      <div
        className={clsx(
          "fixed inset-0 z-[80] bg-black/60 transition-opacity duration-300 ease-in-out small:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-[81] w-[80vw] max-w-[320px] transition-transform duration-300 ease-in-out small:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto border-r border-metal-gold/15 bg-metal-black shadow-xl">
          <div className="flex items-center justify-between border-b border-metal-gold/15 p-6">
            <span className="font-display text-lg text-metal-cream tracking-wide">
              Menu
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="text-metal-cream/70 hover:text-metal-gold transition-colors"
            >
              <X size="20" />
            </button>
          </div>

          <nav className="flex flex-col gap-8 p-6">
            <div className="flex flex-col gap-4">
              <LocalizedClientLink
                href="/"
                onClick={close}
                className="txt-compact-medium-plus text-metal-cream hover:text-metal-gold transition-colors"
              >
                Home
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/store"
                onClick={close}
                className="txt-compact-medium-plus text-metal-cream hover:text-metal-gold transition-colors"
              >
                Store
              </LocalizedClientLink>
            </div>

            {sections.map((section) => (
              <div key={section.title} className="flex flex-col gap-3">
                <span className="txt-compact-small-plus text-metal-gold font-mono-brand uppercase tracking-wide">
                  {section.title}
                </span>
                <ul className="flex flex-col gap-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <LocalizedClientLink
                        href={link.href}
                        onClick={close}
                        className="txt-compact-small text-metal-cream/70 hover:text-metal-gold transition-colors"
                      >
                        {link.label}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}

export default MobileNav

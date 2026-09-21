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
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const close = () => {
    setIsOpen(false)
    setExpandedSection(null)
  }

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
        className="small:hidden flex h-11 w-11 shrink-0 items-center justify-center text-metal-cream hover:text-metal-gold"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        data-testid="mobile-menu-trigger"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
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
        id="mobile-navigation"
        aria-label="Mobile navigation"
        inert={!isOpen}
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

            {sections.map((section, index) => (
              <div key={section.title} className="flex flex-col gap-3">
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center justify-between gap-3 text-left txt-compact-small-plus text-metal-gold font-mono-brand uppercase tracking-wide"
                  aria-expanded={expandedSection === section.title}
                  aria-controls={`mobile-nav-section-${index}`}
                  onClick={() =>
                    setExpandedSection((current) =>
                      current === section.title ? null : section.title
                    )
                  }
                >
                  {section.title}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className={clsx(
                      "shrink-0 transition-transform",
                      expandedSection === section.title && "rotate-180"
                    )}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <ul
                  id={`mobile-nav-section-${index}`}
                  className={clsx(
                    "flex-col gap-3 pl-3",
                    expandedSection === section.title ? "flex" : "hidden"
                  )}
                >
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

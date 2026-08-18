"use client"

import { useRef, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export type MegaMenuLink = {
  label: string
  href: string
}

export type MegaMenuSection = {
  title: string
  links: MegaMenuLink[]
}

type MegaMenuProps = {
  sections: MegaMenuSection[]
  triggerLabel?: string
}

const CLOSE_DELAY_MS = 150

const MegaMenu = ({ sections, triggerLabel = "Explore" }: MegaMenuProps) => {
  const [open, setOpen] = useState(false)
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!sections.length) {
    return null
  }

  const cancelClose = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current)
      closeTimeout.current = null
    }
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimeout.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  return (
    <div
      className="relative h-full flex items-center"
      onMouseEnter={() => {
        cancelClose()
        setOpen(true)
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="h-full flex items-center hover:text-ui-fg-base"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        data-testid="explore-menu-button"
      >
        {triggerLabel}
      </button>

      {open && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 z-[60] w-screen max-w-3xl bg-white border border-ui-border-base shadow-lg rounded-rounded"
          data-testid="explore-menu-panel"
        >
          <div className="grid grid-cols-2 small:grid-cols-4 gap-x-8 gap-y-6 p-8">
            {sections.map((section) => (
              <div key={section.title}>
                <span className="txt-compact-small-plus text-ui-fg-muted uppercase tracking-wide">
                  {section.title}
                </span>
                <ul className="flex flex-col gap-y-2 mt-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <LocalizedClientLink
                        href={link.href}
                        className="txt-compact-small text-ui-fg-subtle hover:text-ui-fg-base"
                        onClick={() => setOpen(false)}
                      >
                        {link.label}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MegaMenu

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Mail from "@modules/common/icons/mail"
import MapPin from "@modules/common/icons/map-pin"
import Phone from "@modules/common/icons/phone"
import MedusaCTA from "@modules/layout/components/medusa-cta"

import PaymentBadges from "./payment-badges"
import SocialLinks from "./social-links"

const SUPPORT_LINKS = [
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
  { label: "How to Install Your Metal Art", href: "/how-to-install-metal-art" },
]

const BLOG_LINKS = [
  {
    label: "Size Guide: Find Your Perfect Fit",
    href: "/blog/size-guide-find-your-perfect-fit",
  },
  {
    label: "Animetal: The Future of Anime Art",
    href: "/blog/animetal-the-future-of-anime-art",
  },
]

const SERVICE_LINKS = [
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Copyright Notice", href: "/copyright-notice" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Payment Policy", href: "/payment-policy" },
]

const FooterLinkGroup = ({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) => (
  <div className="flex flex-col gap-y-4">
    <span className="txt-small-plus font-mono-brand text-metal-cream uppercase tracking-wide">
      {title}
    </span>
    <ul className="flex flex-col gap-y-3">
      {links.map((link) => (
        <li key={link.href}>
          <LocalizedClientLink
            href={link.href}
            className="text-metal-gray txt-small hover:text-metal-gold transition-colors"
          >
            {link.label}
          </LocalizedClientLink>
        </li>
      ))}
    </ul>
  </div>
)

export default function Footer() {
  return (
    <footer className="border-t border-metal-gold/15 bg-metal-panel w-full">
      <div className="content-container flex flex-col w-full">
        <div className="grid grid-cols-2 xsmall:grid-cols-3 medium:grid-cols-5 gap-x-8 gap-y-10 py-16">
          <FooterLinkGroup title="Help & Support" links={SUPPORT_LINKS} />
          <FooterLinkGroup title="Blog" links={BLOG_LINKS} />
          <FooterLinkGroup title="Service" links={SERVICE_LINKS} />
          <div className="flex flex-col gap-y-8 col-span-2 xsmall:col-span-1">
            <div className="flex flex-col gap-y-4">
              <span className="txt-small-plus font-mono-brand text-metal-cream uppercase tracking-wide">
                Get in touch
              </span>
              <ul className="flex flex-col gap-y-3 text-metal-gray txt-small">
                <li className="flex items-start gap-2">
                  <Phone size={16} className="mt-0.5 shrink-0 text-metal-gold" />
                  <span>
                    WhatsApp:{" "}
                    <a
                      href="https://wa.me/13043951355"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-metal-gold transition-colors"
                    >
                      +1 (304) 395-1355
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail size={16} className="mt-0.5 shrink-0 text-metal-gold" />
                  <span>
                    Email us:{" "}
                    <a
                      href="mailto:support@animetalposter.com"
                      className="hover:text-metal-gold transition-colors"
                    >
                      support@animetalposter.com
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin
                    size={16}
                    className="mt-0.5 shrink-0 text-metal-gold"
                  />
                  <span>971 US Highway 202N, Suite N1, Branchburg, NJ 08876</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-y-4">
              <span className="txt-small-plus font-mono-brand text-metal-cream uppercase tracking-wide">
                Follow us
              </span>
              <SocialLinks />
            </div>
          </div>
          <div className="flex flex-col gap-y-4">
            <span className="txt-small-plus font-mono-brand text-metal-cream uppercase tracking-wide">
              We accept
            </span>
            <PaymentBadges />
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

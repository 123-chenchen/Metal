import Facebook from "@modules/common/icons/facebook"
import Instagram from "@modules/common/icons/instagram"
import TikTok from "@modules/common/icons/tiktok"
import YouTube from "@modules/common/icons/youtube"

const SOCIAL_LINKS = [
  { name: "Facebook", href: "#", Icon: Facebook },
  { name: "Instagram", href: "#", Icon: Instagram },
  { name: "TikTok", href: "#", Icon: TikTok },
  { name: "YouTube", href: "#", Icon: YouTube },
]

const SocialLinks = () => {
  return (
    <ul className="flex items-center gap-3">
      {SOCIAL_LINKS.map(({ name, href, Icon }) => (
        <li key={name}>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={name}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-metal-gray/40 text-metal-cream transition-colors hover:border-metal-gold hover:text-metal-gold"
          >
            <Icon size={16} />
          </a>
        </li>
      ))}
    </ul>
  )
}

export default SocialLinks

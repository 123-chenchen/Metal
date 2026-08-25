import { getHomeContent } from "@lib/data/home-content"

const FALLBACK_TEXT = "Redefine Your Space — Buy 3+, Get 40% Off"

const PromoBar = async () => {
  const homeContent = await getHomeContent()
  const text = homeContent?.promo_bar?.text || FALLBACK_TEXT

  return (
    <div className="bg-gradient-to-r from-metal-gold-deep via-metal-gold to-metal-gold-deep text-metal-black text-center font-mono-brand font-semibold text-xs tracking-wide py-2.5 px-3">
      <span className="uppercase">{text}</span>
    </div>
  )
}

export default PromoBar

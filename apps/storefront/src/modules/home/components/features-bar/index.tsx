type Feature = {
  title: string
  description: string
  icon: React.ReactNode
}

const FEATURES: Feature[] = [
  {
    title: "Premium Metal Quality",
    description: "Waterproof, scratch-proof & built to last",
    icon: (
      <path d="M10 2.5l6.2 2.3v4.6c0 4.1-2.6 7.4-6.2 8.6-3.6-1.2-6.2-4.5-6.2-8.6V4.8z" />
    ),
  },
  {
    title: "Ultra-HD 2400 DPI",
    description: "Powered by PrecisionCore™",
    icon: (
      <>
        <circle cx="10" cy="10" r="6.8" />
        <circle cx="10" cy="10" r="2.6" />
        <path d="M10 3.2v2M10 14.8v2M3.2 10h2M14.8 10h2" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Damage-Free Mounting",
    description: "No nails, no holes. Setup in 60s",
    icon: (
      <>
        <rect x="3.5" y="3.5" width="9" height="9" rx="1.6" />
        <rect x="7.5" y="7.5" width="9" height="9" rx="1.6" />
      </>
    ),
  },
  {
    title: "Secure Tracked Shipping",
    description: "Protective packaging ensures safe arrival",
    icon: (
      <>
        <rect x="2" y="6" width="10" height="8" />
        <path d="M12 8.5h3.2L17.5 11V14H12z" />
        <circle cx="6" cy="15.6" r="1.5" />
        <circle cx="14.5" cy="15.6" r="1.5" />
      </>
    ),
  },
]

const FeaturesBar = () => {
  return (
    <div className="grid grid-cols-1 xsmall:grid-cols-2 small:grid-cols-4 border-t border-metal-gold/15 bg-metal-panel">
      {FEATURES.map((feature, index) => (
        <div
          key={feature.title}
          className={`flex items-start gap-3.5 border-b border-metal-gold/15 px-8 py-7 small:border-b-0 ${
            index < FEATURES.length - 1 ? "small:border-r small:border-metal-gold/15" : ""
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-metal-gold/15 bg-metal-gold/10 text-metal-gold">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              className="h-[19px] w-[19px]"
            >
              {feature.icon}
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight text-metal-cream">
              {feature.title}
            </h4>
            <p className="mt-1 text-xs leading-snug text-metal-gray">
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FeaturesBar

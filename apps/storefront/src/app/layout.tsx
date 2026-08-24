import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Anton, Bebas_Neue, JetBrains_Mono, Sora } from "next/font/google"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
})
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
})
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-jetbrains-mono",
})

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="dark"
      className={`dark ${anton.variable} ${bebasNeue.variable} ${sora.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-ui-bg-base text-ui-fg-base">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}

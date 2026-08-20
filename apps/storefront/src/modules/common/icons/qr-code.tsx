import React from "react"

import { IconProps } from "types/icon"

const QrCode: React.FC<IconProps> = ({
  size: _size = "20",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      {...attributes}
    >
      <title>QR code icon</title>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z" fill={color} stroke="none" />
    </svg>
  )
}

export default QrCode

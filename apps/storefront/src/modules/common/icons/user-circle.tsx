import React from "react"

import { IconProps } from "types/icon"

const UserCircle: React.FC<IconProps> = ({
  size = "16",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <circle cx="10" cy="6.6" r="3.3" stroke={color} strokeWidth="1.6" />
      <path
        d="M3.6 16.8c1-3.2 3.7-5 6.4-5s5.4 1.8 6.4 5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default UserCircle

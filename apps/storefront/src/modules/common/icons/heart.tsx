import React from "react"

import { IconProps } from "types/icon"

const Heart: React.FC<IconProps> = ({
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
      <path
        d="M10 17S3 12.6 3 7.9C3 5.7 4.8 4 7 4c1.4 0 2.6.7 3 1.8C10.4 4.7 11.6 4 13 4c2.2 0 4 1.7 4 3.9 0 4.7-7 8.9-7 8.9z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Heart

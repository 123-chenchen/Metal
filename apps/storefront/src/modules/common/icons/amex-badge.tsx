const AmexBadge = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 38 24"
      width="38"
      height="24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="38" height="24" rx="3" fill="#1F72CD" />
      <text
        x="19"
        y="15.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="8"
        letterSpacing="0.5"
        fill="#fff"
      >
        AMEX
      </text>
    </svg>
  )
}

export default AmexBadge

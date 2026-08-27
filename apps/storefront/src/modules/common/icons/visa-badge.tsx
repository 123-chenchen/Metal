const VisaBadge = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 38 24"
      width="38"
      height="24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="38" height="24" rx="3" fill="#fff" />
      <text
        x="19"
        y="16"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontStyle="italic"
        fontWeight="700"
        fontSize="10"
        fill="#1A1F71"
      >
        VISA
      </text>
    </svg>
  )
}

export default VisaBadge

import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const SkeletonRelatedProducts = () => {
  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <div className="w-96 h-10 animate-pulse bg-ui-bg-component"></div>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-4 medium:grid-cols-6 gap-x-3 gap-y-6 flex-1">
        {repeat(6).map((index) => (
          <li key={index}>
            <SkeletonProductPreview />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SkeletonRelatedProducts

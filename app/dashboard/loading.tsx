export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-52 bg-[#EBEBEB] rounded mb-2" />
        <div className="h-4 w-36 bg-[#EBEBEB] rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-[#EBEBEB] rounded-[10px]" />
        ))}
      </div>
      <div className="h-64 bg-[#EBEBEB] rounded-[10px]" />
    </div>
  )
}

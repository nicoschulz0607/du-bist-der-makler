export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-44 bg-[#EBEBEB] rounded mb-2" />
        <div className="h-4 w-72 bg-[#EBEBEB] rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 bg-[#EBEBEB] rounded-[10px]" />
          ))}
        </div>
        <div className="h-[480px] bg-[#EBEBEB] rounded-[10px]" />
      </div>
    </div>
  )
}

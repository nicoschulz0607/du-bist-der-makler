export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-40 bg-[#EBEBEB] rounded mb-2" />
        <div className="h-4 w-64 bg-[#EBEBEB] rounded" />
      </div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-[#EBEBEB] rounded-[10px] h-48" />
      ))}
      <div className="h-12 w-40 bg-[#EBEBEB] rounded-[8px]" />
    </div>
  )
}

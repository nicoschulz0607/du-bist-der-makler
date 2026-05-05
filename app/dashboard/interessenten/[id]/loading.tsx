export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-[#EBEBEB] rounded" />
        <div className="h-7 w-48 bg-[#EBEBEB] rounded" />
      </div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-[#EBEBEB] rounded-[10px] h-52" />
      ))}
      <div className="h-36 bg-[#EBEBEB] rounded-[10px]" />
    </div>
  )
}

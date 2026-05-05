export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-52 bg-[#EBEBEB] rounded mb-2" />
        <div className="h-4 w-32 bg-[#EBEBEB] rounded" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 flex-1 bg-[#EBEBEB] rounded-[8px]" />
        <div className="h-9 w-36 bg-[#EBEBEB] rounded-[8px]" />
        <div className="h-9 w-36 bg-[#EBEBEB] rounded-[8px]" />
        <div className="h-9 w-32 bg-[#EBEBEB] rounded-[8px] ml-auto" />
      </div>
      <div className="rounded-[10px] overflow-hidden border border-[#EBEBEB]">
        <div className="h-11 bg-[#F5F5F5]" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 border-t border-[#EBEBEB] flex items-center px-4 gap-4">
            <div className="h-4 w-32 bg-[#EBEBEB] rounded" />
            <div className="h-5 w-20 bg-[#EBEBEB] rounded-full" />
            <div className="h-4 w-16 bg-[#EBEBEB] rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

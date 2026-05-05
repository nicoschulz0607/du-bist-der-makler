export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-56 bg-[#EBEBEB] rounded mb-2" />
        <div className="h-4 w-32 bg-[#EBEBEB] rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-32 bg-[#EBEBEB] rounded-[8px]" />
        <div className="h-9 w-32 bg-[#EBEBEB] rounded-[8px]" />
        <div className="h-9 w-36 bg-[#EBEBEB] rounded-[8px] ml-auto" />
      </div>
      <div className="h-[520px] bg-[#EBEBEB] rounded-[10px]" />
    </div>
  )
}

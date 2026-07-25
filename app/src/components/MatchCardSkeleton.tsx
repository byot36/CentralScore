export default function MatchCardSkeleton() {
  return (
    <div className="rounded-lg px-4 py-3 border border-white/10 bg-[#111827] animate-pulse">
      <div className="h-3 w-16 bg-white/10 rounded mb-3" />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 rounded-full bg-white/10 shrink-0" />
          <div className="h-3 w-24 bg-white/10 rounded" />
        </div>
        <div className="h-4 w-4 bg-white/10 rounded" />
      </div>
      <div className="flex items-center justify-between gap-2 mt-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 rounded-full bg-white/10 shrink-0" />
          <div className="h-3 w-20 bg-white/10 rounded" />
        </div>
        <div className="h-4 w-4 bg-white/10 rounded" />
      </div>
    </div>
  );
}

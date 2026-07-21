"use client";

export function RoomSkeleton() {
  return (
    <div className="min-h-screen px-4 py-6 animate-pulse">
      <div className="max-w-7xl mx-auto">
        
        {/* Navbar Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="w-32 h-10 bg-slate-200/50 rounded-xl" />
          <div className="w-10 h-10 bg-slate-200/50 rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">
          
          {/* Left - Opponents Skeleton */}
          <div className="space-y-3 order-2 lg:order-1">
            <div className="w-24 h-4 bg-slate-200/50 rounded-full mb-4" />
            <div className="glass-card p-4 h-24 bg-slate-100/50 border-slate-200/50" />
            <div className="glass-card p-4 h-24 bg-slate-100/50 border-slate-200/50" />
          </div>

          {/* Center - Board Skeleton */}
          <div className="order-1 lg:order-2 flex flex-col items-center">
            {/* Bingo Progress Skeleton */}
            <div className="w-64 h-12 bg-slate-200/50 rounded-2xl mb-6" />
            
            {/* Turn Indicator Skeleton */}
            <div className="w-32 h-8 bg-slate-200/50 rounded-full mb-4" />

            {/* Board Grid Skeleton */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-20 h-10 bg-slate-200/50 rounded-full" />
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="glass-card w-20 h-20 bg-slate-100/50 border-slate-200/50" />
                ))}
              </div>
            </div>
            
            <div className="w-32 h-10 bg-slate-200/50 rounded-xl mt-4" />
          </div>

          {/* Right - Feed Skeleton */}
          <div className="space-y-4 order-3">
            <div className="glass-card p-4 h-32 bg-slate-100/50 border-slate-200/50" />
            <div className="glass-card p-4 h-64 bg-slate-100/50 border-slate-200/50" />
            <div className="glass-card p-4 h-48 bg-slate-100/50 border-slate-200/50" />
          </div>
          
        </div>
      </div>
    </div>
  );
}

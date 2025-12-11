'use client';

/**
 * PageSkeleton - Loading skeleton for internal dashboard pages
 * Provides immediate visual feedback while data loads
 */
export function PageSkeleton() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />

            <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
                {/* Header Skeleton */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-800 rounded-xl" />
                        <div>
                            <div className="h-8 bg-gray-800 rounded w-40 mb-2" />
                            <div className="h-4 bg-gray-800/50 rounded w-60" />
                        </div>
                    </div>
                    <div className="h-10 bg-gray-800 rounded-lg w-40" />
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[1, 2, 3].map((i) => (
                        <div 
                            key={i}
                            className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl animate-pulse"
                        >
                            <div className="h-8 bg-gray-800 rounded w-20 mb-2" />
                            <div className="h-4 bg-gray-800/50 rounded w-32" />
                        </div>
                    ))}
                </div>

                {/* Tabs Skeleton */}
                <div className="flex gap-4 mb-6 border-b border-gray-700">
                    <div className="h-8 bg-gray-800 rounded w-32 animate-pulse" />
                    <div className="h-8 bg-gray-800 rounded w-32 animate-pulse" />
                </div>

                {/* Content Skeleton */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 min-h-[400px] animate-pulse">
                    <div className="h-6 bg-gray-800 rounded w-1/3 mb-4" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 bg-gray-800/50 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

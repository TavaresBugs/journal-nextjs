'use client';

/**
 * AccountSelectionSkeleton - Loading skeleton for the account selection page
 * Mirrors the structure of the home page with animated placeholders
 */
export function AccountSelectionSkeleton() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />
            
            <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
                {/* Header Box Skeleton */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-xl animate-pulse">
                    {/* Left: Title & Subtitle */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-800 rounded-xl" />
                        <div>
                            <div className="h-8 bg-gray-800 rounded w-48 mb-2" />
                            <div className="h-4 bg-gray-800/50 rounded w-40" />
                        </div>
                    </div>
                    
                    {/* Right: Controls */}
                    <div className="flex items-center gap-3">
                        <div className="h-10 bg-gray-800/50 rounded-lg w-48 hidden md:block" />
                        <div className="w-12 h-12 bg-gray-800 rounded-lg" />
                        <div className="w-12 h-12 bg-gray-800 rounded-lg" />
                    </div>
                </div>

                {/* Summary Section Skeleton - 3 cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map((i) => (
                        <div 
                            key={i}
                            className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl backdrop-blur-sm animate-pulse"
                        >
                            <div className="h-4 bg-gray-800/50 rounded w-24 mb-3" />
                            <div className="h-9 bg-gray-800 rounded w-32" />
                        </div>
                    ))}
                </div>

                {/* Section Title Skeleton */}
                <div className="flex justify-between items-center mb-8 animate-pulse">
                    <div className="h-7 bg-gray-800 rounded w-40" />
                </div>

                {/* Account Cards Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div 
                            key={i}
                            className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm animate-pulse"
                        >
                            {/* Card Header */}
                            <div className="h-6 bg-gray-800 rounded w-32 mb-6" />
                            
                            {/* Balance Section */}
                            <div className="mb-4">
                                <div className="h-4 bg-gray-800/50 rounded w-20 mb-2" />
                                <div className="h-8 bg-gray-800 rounded w-36" />
                            </div>
                            
                            {/* P&L Section */}
                            <div className="mb-4">
                                <div className="h-4 bg-gray-800/50 rounded w-16 mb-2" />
                                <div className="h-6 bg-gray-800 rounded w-28" />
                            </div>
                            
                            {/* Details Section */}
                            <div className="pt-4 border-t border-gray-700 grid grid-cols-2 gap-2">
                                <div>
                                    <div className="h-3 bg-gray-800/30 rounded w-16 mb-1" />
                                    <div className="h-5 bg-gray-800/50 rounded w-12" />
                                </div>
                                <div>
                                    <div className="h-3 bg-gray-800/30 rounded w-14 mb-1" />
                                    <div className="h-5 bg-gray-800/50 rounded w-10" />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* New Wallet Card Skeleton */}
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/20 animate-pulse">
                        <div className="w-16 h-16 rounded-full bg-gray-800 mb-4" />
                        <div className="h-5 bg-gray-800 rounded w-28" />
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

/**
 * DashboardSkeleton - Loading skeleton for the main dashboard page
 * Mirrors the structure of the dashboard with animated placeholders
 */
export function DashboardSkeleton() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="relative z-10">
                {/* Header */}
                <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="container mx-auto px-6 py-6" style={{ maxWidth: '1200px' }}>
                        {/* Top Row */}
                        <div className="flex items-center justify-between mb-6 animate-pulse">
                            <div className="flex items-center gap-4">
                                {/* Back Button Skeleton */}
                                <div className="h-10 bg-gray-800 rounded-lg w-24" />
                                <div className="h-6 w-px bg-gray-700" />
                                {/* Account Name Skeleton */}
                                <div>
                                    <div className="h-7 bg-gray-800 rounded w-48 mb-2" />
                                    <div className="h-4 bg-gray-800/50 rounded w-32" />
                                </div>
                            </div>
                            
                            {/* Action Buttons Skeleton */}
                            <div className="flex items-center gap-2">
                                <div className="w-12 h-12 bg-gray-800 rounded-xl" />
                                <div className="w-12 h-12 bg-gray-800 rounded-xl" />
                                <div className="w-12 h-12 bg-gray-800 rounded-xl" />
                            </div>
                        </div>

                        {/* Summary Metrics Skeleton - 5 cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div 
                                    key={i}
                                    className="bg-linear-to-br from-gray-800/80 to-gray-800/40 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm flex flex-col items-center justify-center text-center animate-pulse"
                                >
                                    <div className="w-6 h-6 bg-gray-700 rounded mb-2" />
                                    <div className="h-3 bg-gray-700/50 rounded w-16 mb-2" />
                                    <div className="h-6 bg-gray-700 rounded w-20" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tabs Skeleton */}
                <div className="container mx-auto px-4 mt-6" style={{ maxWidth: '1200px' }}>
                    <div className="flex gap-2 overflow-x-auto pb-2 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div 
                                key={i}
                                className={`h-10 bg-gray-800 rounded-lg shrink-0 ${
                                    i === 1 ? 'w-28 bg-gray-700' : 'w-24'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content Area Skeleton */}
                <div className="container mx-auto px-4 py-4" style={{ maxWidth: '1200px' }}>
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl backdrop-blur-sm overflow-hidden animate-pulse">
                        {/* Card Header */}
                        <div className="p-6 border-b border-gray-800">
                            <div className="h-6 bg-gray-800 rounded w-40" />
                        </div>
                        
                        {/* Card Content */}
                        <div className="p-6 space-y-6">
                            {/* Form-like content skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="h-4 bg-gray-800/50 rounded w-20" />
                                        <div className="h-10 bg-gray-800 rounded-lg" />
                                    </div>
                                ))}
                            </div>
                            
                            {/* Additional form fields skeleton */}
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-800/50 rounded w-24" />
                                <div className="h-24 bg-gray-800 rounded-lg" />
                            </div>
                            
                            {/* Submit button skeleton */}
                            <div className="flex justify-end">
                                <div className="h-12 bg-gray-700 rounded-lg w-40" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

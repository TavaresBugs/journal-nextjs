import React from 'react';

/**
 * Skeleton loader for the Share Page
 * Mimics the exact layout of the content: Header, Market Conditions (3x3), Images (2x).
 */
export function SharePageSkeleton() {
    return (
        <div className="min-h-screen py-12 px-4 relative">
             {/* Fixed Background (Simulated) */}
             <div 
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.55)), url(/images/share-bg.jpg)' }}
            />

            <div className="max-w-4xl mx-auto relative z-10 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex flex-col items-center mb-12">
                     {/* Badge */}
                    <div className="h-8 w-48 bg-gray-800/50 rounded-full mb-4 border border-gray-700/50" />
                    {/* Title */}
                    <div className="h-10 w-3/4 max-w-md bg-gray-700/50 rounded-lg mb-4" />
                    {/* Date/Asset */}
                    <div className="h-5 w-40 bg-gray-800/50 rounded-full" />
                </div>

                {/* Market Conditions Skeleton (Matches MarketConditionsCard) */}
                <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50 mb-8">
                    {/* Card Header */}
                    <div className="h-7 w-56 bg-gray-700/50 rounded mb-6" />

                    {/* Grid: 1 col mobile, 3 cols desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Repeat 9 times for the 3x3 grid items */}
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                {/* Label */}
                                <div className="h-3 w-24 bg-gray-800 mx-auto rounded" />
                                {/* Value Box */}
                                <div className="h-[42px] bg-gray-900/50 rounded-lg border border-gray-800" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Images Skeleton */}
                <div className="mb-8">
                    <div className="h-7 w-32 bg-gray-700/50 rounded mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {/* 2 Image Placeholders */}
                        <div className="aspect-video bg-gray-800/50 rounded-lg border border-gray-700/50" />
                        <div className="aspect-video bg-gray-800/50 rounded-lg border border-gray-700/50" />
                    </div>
                </div>

                {/* Text Content Skeleton */}
                <div className="space-y-6">
                    {/* Emotion */}
                    <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50 h-32" />
                    {/* Analysis */}
                    <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50 h-48" />
                </div>
            </div>
        </div>
    );
}

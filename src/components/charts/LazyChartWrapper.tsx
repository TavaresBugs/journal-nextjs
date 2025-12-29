"use client";

import React, { useState, useEffect, useRef, ComponentType } from "react";

interface LazyChartWrapperProps<T> {
  /**
   * Function to dynamically import the chart component
   * Example: () => import('./MyChart').then(m => m.MyChart)
   */
  loader: () => Promise<ComponentType<T>>;
  /**
   * Props to pass to the chart component
   */
  props: T;
  /**
   * Height of the placeholder skeleton
   */
  height?: number | string;
}

/**
 * LazyChartWrapper
 *
 * Wraps heavy chart components to lazy load them only when they enter the viewport.
 * Uses IntersectionObserver for performant visibility detection.
 */
export function LazyChartWrapper<T extends object>({
  loader,
  props,
  height = 300,
}: LazyChartWrapperProps<T>) {
  const [Component, setComponent] = useState<ComponentType<T> | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before appearing
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && !Component) {
      loader().then((Comp) => {
        setComponent(() => Comp);
      });
    }
  }, [isVisible, loader, Component]);

  return (
    <div ref={containerRef} style={{ minHeight: height }} className="w-full">
      {Component ? (
        <Component {...props} />
      ) : (
        <div
          className="flex w-full items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50"
          style={{ height }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <p className="text-sm text-gray-500">Carregando gráfico...</p>
          </div>
        </div>
      )}
    </div>
  );
}

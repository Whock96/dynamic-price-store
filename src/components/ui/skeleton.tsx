
import React from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse rounded-md bg-gray-200 ${className ?? ""}`}
      style={style}
    ></div>
  );
}

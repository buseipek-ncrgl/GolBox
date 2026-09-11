import React from 'react';

export const AdminSkeletonCard: React.FC = () => (
  <div className="animate-pulse rounded-2xl border border-border bg-card p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="h-4 w-24 rounded bg-muted"></div>
      <div className="h-10 w-10 rounded-xl bg-muted"></div>
    </div>
    <div className="mt-4 h-8 w-32 rounded bg-muted"></div>
    <div className="mt-2 h-3 w-40 rounded bg-muted"></div>
  </div>
);

export const AdminSkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full animate-pulse overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div className="border-b border-border bg-muted/30 p-4">
      <div className="flex gap-4">
        <div className="h-4 w-1/4 rounded bg-muted"></div>
        <div className="h-4 w-1/4 rounded bg-muted"></div>
        <div className="h-4 w-1/4 rounded bg-muted"></div>
        <div className="h-4 w-1/4 rounded bg-muted"></div>
      </div>
    </div>
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4">
          <div className="h-4 w-1/3 rounded bg-muted"></div>
          <div className="h-4 w-1/4 rounded bg-muted"></div>
          <div className="h-4 w-1/6 rounded bg-muted"></div>
        </div>
      ))}
    </div>
  </div>
);

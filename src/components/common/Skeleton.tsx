import { cn } from '@/utils/cn';

export interface SkeletonProps {
  variant?: 'table' | 'card' | 'text' | 'kpi';
  count?: number;
  className?: string;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn('bg-gray-200 rounded animate-pulse', className)}
      aria-hidden="true"
    />
  );
}

function TableSkeleton({ count = 5 }: { count: number }) {
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-4 w-20" />
        <SkeletonBlock className="h-4 flex-1" />
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-4 w-20" />
      </div>
      {/* Data rows */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  );
}

function CardSkeleton({ count = 1 }: { count: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
        >
          <SkeletonBlock className="h-4 mb-3 w-3/4" />
          <SkeletonBlock className="h-3 mb-2 w-1/2" />
          <SkeletonBlock className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function TextSkeleton({ count = 3 }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={cn(
            'h-4',
            i === count - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

function KpiSkeleton({ count = 4 }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SkeletonBlock className="h-3 w-20 mb-2" />
              <SkeletonBlock className="h-7 w-16" />
            </div>
            <SkeletonBlock className="h-10 w-10 rounded-lg" />
          </div>
          <SkeletonBlock className="h-3 w-24 mt-3" />
        </div>
      ))}
    </div>
  );
}

export function Skeleton({
  variant = 'text',
  count,
  className,
}: SkeletonProps) {
  const defaultCounts: Record<NonNullable<SkeletonProps['variant']>, number> = {
    table: 5,
    card: 1,
    text: 3,
    kpi: 4,
  };

  const resolvedCount = count ?? defaultCounts[variant];

  return (
    <div className={cn('w-full', className)} role="status" aria-label="Loading...">
      {variant === 'table' && <TableSkeleton count={resolvedCount} />}
      {variant === 'card' && <CardSkeleton count={resolvedCount} />}
      {variant === 'text' && <TextSkeleton count={resolvedCount} />}
      {variant === 'kpi' && <KpiSkeleton count={resolvedCount} />}
    </div>
  );
}

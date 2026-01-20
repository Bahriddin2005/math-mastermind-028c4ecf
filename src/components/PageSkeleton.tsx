import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PageSkeletonProps {
  type?: 'home' | 'courses' | 'practice' | 'default';
  className?: string;
}

export const PageSkeleton = ({ type = 'default', className }: PageSkeletonProps) => {
  return (
    <div className={cn('animate-fade-in', className)}>
      {type === 'home' && <HomeSkeleton />}
      {type === 'courses' && <CoursesSkeleton />}
      {type === 'practice' && <PracticeSkeleton />}
      {type === 'default' && <DefaultSkeleton />}
    </div>
  );
};

// Home page skeleton
const HomeSkeleton = () => (
  <div className="container px-3 xs:px-4 py-4 space-y-6">
    {/* Hero carousel skeleton */}
    <Skeleton className="w-full h-48 xs:h-56 sm:h-64 rounded-2xl" />
    
    {/* Main action button skeleton */}
    <Skeleton className="w-full h-16 xs:h-18 sm:h-20 rounded-xl" />
    
    {/* Section carousel skeleton */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="flex-shrink-0 w-36 h-44 rounded-xl" />
        ))}
      </div>
    </div>

    {/* Another section */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="flex-shrink-0 w-36 h-44 rounded-xl" />
        ))}
      </div>
    </div>

    {/* Subscription cards skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-64 rounded-2xl" />
      ))}
    </div>
  </div>
);

// Courses page skeleton
const CoursesSkeleton = () => (
  <div className="container px-3 xs:px-4 py-4 space-y-6">
    {/* Header */}
    <div className="text-center space-y-2">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-64 mx-auto" />
    </div>
    
    {/* Course cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="w-full h-40 rounded-xl" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Practice page skeleton
const PracticeSkeleton = () => (
  <div className="container px-3 xs:px-4 py-4 space-y-6">
    {/* Stats bar */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-10 w-24 rounded-full" />
      <Skeleton className="h-10 w-32 rounded-full" />
      <Skeleton className="h-10 w-24 rounded-full" />
    </div>

    {/* Main practice area */}
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
      <Skeleton className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl" />
      <Skeleton className="h-14 w-full max-w-md rounded-xl" />
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-12 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

// Default skeleton
const DefaultSkeleton = () => (
  <div className="container px-3 xs:px-4 py-4 space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-full max-w-md" />
    <div className="space-y-3 pt-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  </div>
);

// Card skeleton component for reuse
export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('space-y-3', className)}>
    <Skeleton className="w-full h-32 rounded-xl" />
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

// List item skeleton
export const ListItemSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center gap-3 p-3', className)}>
    <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

// Stats skeleton
export const StatsSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-3', className)}>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="p-4 rounded-xl bg-secondary/50">
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </div>
);

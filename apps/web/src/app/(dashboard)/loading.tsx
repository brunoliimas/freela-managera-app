import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCard } from '@/components/ui/skeleton-card';

export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        </div>
    );
}

import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function PagamentosLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-40" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-40" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                    <SkeletonTable columns={7} rows={5} />
                </CardContent>
            </Card>
        </div>
    );
}

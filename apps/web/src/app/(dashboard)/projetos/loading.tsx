import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ProjetosLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-40" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                    <SkeletonTable columns={6} rows={5} />
                </CardContent>
            </Card>
        </div>
    );
}

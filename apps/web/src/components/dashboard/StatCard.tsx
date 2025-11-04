import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    iconColor?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor = 'text-blue-500',
    trend
}: StatCardProps) {
    return (
        <Card className='py-0'>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600">{title}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
                        {subtitle && (
                            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                        )}
                        {trend && (
                            <p className={`text-xs mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {trend.isPositive ? '↑' : '↓'} {trend.value}% vs mês anterior
                            </p>
                        )}
                    </div>
                    <div className={`p-3 rounded-full bg-slate-100 ${iconColor}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import Link from 'next/link';

interface PricingCardProps {
    name: string;
    price: string;
    period?: string;
    description: string;
    features: string[];
    href: string;
    cta: string;
    highlighted?: boolean;
}

export function PricingCard({
    name,
    price,
    period = '/mês',
    description,
    features,
    href,
    cta,
    highlighted = false,
}: PricingCardProps) {
    return (
        <Card
            className={`relative flex flex-col ${
                highlighted
                    ? 'border-blue-600 shadow-lg shadow-blue-600/10 scale-105'
                    : 'border-slate-200 dark:border-slate-800'
            }`}
        >
            {highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-medium text-white">
                    Mais popular
                </div>
            )}
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg font-medium text-muted-foreground">{name}</CardTitle>
                <div className="mt-2">
                    <span className="text-4xl font-bold">{price}</span>
                    {period && price !== 'Grátis' && (
                        <span className="text-muted-foreground">{period}</span>
                    )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
                <Link href={href} className="mt-6 block">
                    <Button
                        className="w-full"
                        variant={highlighted ? 'default' : 'outline'}
                        size="lg"
                    >
                        {cta}
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}

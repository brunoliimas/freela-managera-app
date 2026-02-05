import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
            <FileQuestion className="h-16 w-16 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Página não encontrada</h1>
            <p className="text-center text-muted-foreground">
                A página que você está procurando não existe ou foi movida.
            </p>
            <Link href="/">
                <Button>Voltar ao início</Button>
            </Link>
        </div>
    );
}

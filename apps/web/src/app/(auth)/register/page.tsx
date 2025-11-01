'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { registerSchema, RegisterInput } from '@/lib/validations/auth';
import { toast } from 'sonner';

export default function RegisterPage() {
    const router = useRouter();
    const { register: registerUser, isLoading } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterInput) => {
        try {
            await registerUser(data);
            toast.success('Conta criada!', {
                description: 'Bem-vindo ao Freelance Manager.',
            });
            router.push('/dashboard');
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Erro ao criar conta';

            toast.error('Erro ao criar conta', {
                description: message,
            });
        }
    };


    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
                <CardDescription>
                    Preencha os dados abaixo para criar sua conta
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Seu nome"
                            {...register('name')}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone (opcional)</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="(00) 00000-0000"
                            {...register('phone')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company">Empresa/MEI (opcional)</Label>
                        <Input
                            id="company"
                            type="text"
                            placeholder="Nome da sua empresa"
                            {...register('company')}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Criando conta...' : 'Criar conta'}
                    </Button>
                    <p className="text-sm text-center text-slate-600">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Fazer login
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
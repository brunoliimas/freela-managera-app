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
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { toast } from 'sonner';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginInput) => {
        try {
            await login(data);

            // Check if 2FA verification is needed
            const state = useAuth.getState();
            if (state.pending2FA) {
                router.push('/2fa-verify');
                return;
            }

            toast.success('Login realizado!', {
                description: 'Bem-vindo de volta.',
            });
            router.push('/dashboard');
        } catch (error: unknown) {
            let message = 'Erro ao fazer login';

            if (error instanceof Error) {
                message = error.message;
            }

            toast.error('Erro ao fazer login', {
                description: message,
            });
        }
    };

    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
                <CardDescription>
                    Entre com seu email e senha para acessar sua conta
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4 mb-4">
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
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Senha</Label>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Esqueci minha senha
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                    <p className="text-sm text-center text-slate-600">
                        Não tem uma conta?{' '}
                        <Link href="/register" className="text-blue-600 hover:underline">
                            Criar conta
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
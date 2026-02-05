'use client';

import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSection } from './components/ProfileSection';
import { CompanySection } from './components/CompanySection';
import { PreferencesSection } from './components/PreferencesSection';
import { SecuritySection } from './components/SecuritySection';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    bio: string | null;
    cpf: string | null;
    cnpj: string | null;
    plan: string;
    avatar: string | null;
    createdAt: string;
}

export default function ConfiguracoesPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { setUser } = useAuth();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            setProfile(response.data);
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileUpdate = (updatedProfile: UserProfile) => {
        setProfile(updatedProfile);
        setUser({
            id: updatedProfile.id,
            name: updatedProfile.name,
            email: updatedProfile.email,
            phone: updatedProfile.phone || undefined,
            company: updatedProfile.company || undefined,
            plan: updatedProfile.plan,
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8" />
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-1" />
                    </div>
                </div>
                <Skeleton className="h-10 w-96" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Erro ao carregar perfil. Tente novamente.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <Settings className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
                    <p className="text-slate-600 mt-1">
                        Gerencie seu perfil, empresa e preferências
                    </p>
                </div>
            </div>

            <Tabs defaultValue="perfil" className="w-full">
                <TabsList>
                    <TabsTrigger value="perfil">Perfil</TabsTrigger>
                    <TabsTrigger value="empresa">Empresa</TabsTrigger>
                    <TabsTrigger value="preferencias">Preferências</TabsTrigger>
                    <TabsTrigger value="seguranca">Segurança</TabsTrigger>
                </TabsList>

                <TabsContent value="perfil" className="mt-6">
                    <ProfileSection profile={profile} onUpdate={handleProfileUpdate} />
                </TabsContent>

                <TabsContent value="empresa" className="mt-6">
                    <CompanySection profile={profile} onUpdate={handleProfileUpdate} />
                </TabsContent>

                <TabsContent value="preferencias" className="mt-6">
                    <PreferencesSection />
                </TabsContent>

                <TabsContent value="seguranca" className="mt-6">
                    <SecuritySection />
                </TabsContent>
            </Tabs>
        </div>
    );
}

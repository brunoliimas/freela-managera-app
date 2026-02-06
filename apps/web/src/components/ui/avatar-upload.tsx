'use client';

import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface AvatarUploadProps {
    currentAvatar: string | null;
    name: string;
    onUpload: (file: File) => Promise<void>;
    size?: 'sm' | 'md' | 'lg';
    color?: 'blue' | 'emerald';
}

const sizeClasses = {
    sm: 'h-12 w-12 text-sm',
    md: 'h-16 w-16 text-xl',
    lg: 'h-20 w-20 text-2xl',
};

const overlayClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
};

const colorClasses = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
};

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getAvatarUrl(avatar: string | null) {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    return `${process.env.NEXT_PUBLIC_API_URL}${avatar}`;
}

export function AvatarUpload({
    currentAvatar,
    name,
    onUpload,
    size = 'md',
    color = 'blue',
}: AvatarUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Selecione uma imagem válida');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Imagem deve ter no máximo 5MB');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            await onUpload(file);
            toast.success('Avatar atualizado!');
        } catch {
            toast.error('Erro ao atualizar avatar');
            setPreview(null);
        } finally {
            setUploading(false);
            // Reset input
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const displaySrc = preview || getAvatarUrl(currentAvatar);

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="relative rounded-full group cursor-pointer"
                disabled={uploading}
            >
                <Avatar className={sizeClasses[size]}>
                    <AvatarImage src={displaySrc} alt={name} />
                    <AvatarFallback className={`${colorClasses[color]} text-white font-semibold`}>
                        {getInitials(name)}
                    </AvatarFallback>
                </Avatar>
                <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${overlayClasses[size]}`}>
                    <Camera className="h-4 w-4 text-white" />
                </div>
                {uploading && (
                    <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center ${overlayClasses[size]}`}>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    </div>
                )}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}

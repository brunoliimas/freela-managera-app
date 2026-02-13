'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Reply, Pencil, Trash2, Send, X } from 'lucide-react';

interface CommentUser {
    id: string;
    name: string;
    avatar: string | null;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    user: CommentUser;
    replies: Comment[];
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `há ${days}d`;
    const months = Math.floor(days / 30);
    return `há ${months} mês${months > 1 ? 'es' : ''}`;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

interface ComentariosSectionProps {
    projetoId: string;
    currentUserId?: string;
}

export function ComentariosSection({ projetoId, currentUserId }: ComentariosSectionProps) {
    const [comentarios, setComentarios] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Reply state
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const fetchComentarios = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/projetos/${projetoId}/comentarios`);
            setComentarios(res.data);
        } catch {
            toast.error('Erro ao carregar comentários');
        } finally {
            setLoading(false);
        }
    }, [projetoId]);

    useEffect(() => {
        fetchComentarios();
    }, [fetchComentarios]);

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;
        try {
            setSubmitting(true);
            await api.post(`/projetos/${projetoId}/comentarios`, { content: newComment.trim() });
            setNewComment('');
            fetchComentarios();
        } catch {
            toast.error('Erro ao comentar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!replyContent.trim()) return;
        try {
            await api.post(`/projetos/${projetoId}/comentarios`, {
                content: replyContent.trim(),
                parentId,
            });
            setReplyingTo(null);
            setReplyContent('');
            fetchComentarios();
        } catch {
            toast.error('Erro ao responder');
        }
    };

    const handleUpdate = async (commentId: string) => {
        if (!editContent.trim()) return;
        try {
            await api.put(`/projetos/${projetoId}/comentarios/${commentId}`, {
                content: editContent.trim(),
            });
            setEditingId(null);
            setEditContent('');
            fetchComentarios();
        } catch {
            toast.error('Erro ao editar comentário');
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Excluir este comentário?')) return;
        try {
            await api.delete(`/projetos/${projetoId}/comentarios/${commentId}`);
            fetchComentarios();
        } catch {
            toast.error('Erro ao excluir comentário');
        }
    };

    const startEdit = (comment: Comment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
        setReplyingTo(null);
    };

    const startReply = (commentId: string) => {
        setReplyingTo(commentId);
        setReplyContent('');
        setEditingId(null);
    };

    const renderComment = (comment: Comment, isReply = false) => {
        const isAuthor = currentUserId === comment.user.id;
        const isEditing = editingId === comment.id;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        return (
            <div key={comment.id} className={`${isReply ? 'ml-10 pl-4 border-l-2 border-slate-200' : ''}`}>
                <div className="flex gap-3 py-3">
                    <Avatar className="h-8 w-8 shrink-0">
                        {comment.user.avatar && (
                            <AvatarImage
                                src={comment.user.avatar.startsWith('http') ? comment.user.avatar : `${apiUrl}${comment.user.avatar}`}
                                alt={comment.user.name}
                            />
                        )}
                        <AvatarFallback className="text-xs bg-slate-200">
                            {getInitials(comment.user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.user.name}</span>
                            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                            {comment.createdAt !== comment.updatedAt && (
                                <span className="text-xs text-muted-foreground">(editado)</span>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="mt-2 space-y-2">
                                <Textarea
                                    value={editContent}
                                    onChange={e => setEditContent(e.target.value)}
                                    className="min-h-[60px]"
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleUpdate(comment.id)} disabled={!editContent.trim()}>
                                        Salvar
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{comment.content}</p>
                        )}

                        {!isEditing && (
                            <div className="flex items-center gap-3 mt-2">
                                {!isReply && (
                                    <button
                                        onClick={() => startReply(comment.id)}
                                        className="text-xs text-muted-foreground hover:text-slate-700 flex items-center gap-1"
                                    >
                                        <Reply className="h-3 w-3" /> Responder
                                    </button>
                                )}
                                {isAuthor && (
                                    <>
                                        <button
                                            onClick={() => startEdit(comment)}
                                            className="text-xs text-muted-foreground hover:text-slate-700 flex items-center gap-1"
                                        >
                                            <Pencil className="h-3 w-3" /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="text-xs text-muted-foreground hover:text-red-600 flex items-center gap-1"
                                        >
                                            <Trash2 className="h-3 w-3" /> Excluir
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Reply input */}
                {replyingTo === comment.id && (
                    <div className="ml-10 pl-4 border-l-2 border-blue-200 py-2">
                        <Textarea
                            value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                            placeholder="Escreva sua resposta..."
                            className="min-h-[60px]"
                            autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => handleSubmitReply(comment.id)} disabled={!replyContent.trim()}>
                                <Send className="h-3 w-3 mr-1" /> Responder
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Replies */}
                {comment.replies?.map(reply => renderComment(reply, true))}
            </div>
        );
    };

    return (
        <div>
            {/* New comment input */}
            <div className="flex gap-3 mb-4">
                <Textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Adicione um comentário..."
                    className="min-h-[80px]"
                />
            </div>
            <div className="flex justify-end mb-4">
                <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submitting}
                    size="sm"
                >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? 'Enviando...' : 'Comentar'}
                </Button>
            </div>

            {/* Comments list */}
            {loading ? (
                <p className="text-center text-muted-foreground py-4">Carregando...</p>
            ) : comentarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                    <p>Nenhum comentário ainda.</p>
                    <p className="text-sm mt-1">Seja o primeiro a comentar neste projeto.</p>
                </div>
            ) : (
                <div className="divide-y">
                    {comentarios.map(c => renderComment(c))}
                </div>
            )}
        </div>
    );
}

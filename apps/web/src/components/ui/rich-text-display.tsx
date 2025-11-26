'use client';

interface RichTextDisplayProps {
    content: string;
    className?: string;
}

export function RichTextDisplay({ content, className = '' }: RichTextDisplayProps) {
    return (
        <div
            className={`prose prose-sm max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
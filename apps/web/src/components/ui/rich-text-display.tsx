'use client';

import DOMPurify from 'isomorphic-dompurify';

interface RichTextDisplayProps {
    content: string;
    className?: string;
}

export function RichTextDisplay({ content, className = '' }: RichTextDisplayProps) {
    const sanitizedContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a',
            'code', 'pre', 'span', 'div', 'hr',
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    });

    return (
        <div
            className={`prose prose-sm max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
    );
}

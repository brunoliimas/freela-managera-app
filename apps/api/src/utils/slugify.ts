import prisma from '../config/database';

export function generateSlug(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove acentos
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // substitui caracteres especiais por hífens
        .replace(/^-|-$/g, ''); // remove hífens do início/fim
}

export async function generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 2;

    while (await prisma.user.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}

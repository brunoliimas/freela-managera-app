export function maskPhone(value: string): string {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 10) {
        return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
}

export function maskCpf(value: string): string {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function maskCnpj(value: string): string {
    const numbers = value.replace(/\D/g, '').slice(0, 14);
    return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function maskCep(value: string): string {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    return numbers.replace(/(\d{5})(\d)/, '$1-$2');
}

export function maskCurrency(value: string): string {
    let numbers = value.replace(/\D/g, '');
    if (!numbers) return '';

    // Remove leading zeros but keep at least one
    numbers = numbers.replace(/^0+(\d)/, '$1');

    const cents = parseInt(numbers, 10);
    const reais = (cents / 100).toFixed(2);

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(parseFloat(reais));
}

export function unmaskCurrency(masked: string): string {
    const numbers = masked.replace(/\D/g, '');
    if (!numbers) return '';
    const cents = parseInt(numbers, 10);
    return (cents / 100).toFixed(2);
}

export function unmask(value: string): string {
    return value.replace(/\D/g, '');
}

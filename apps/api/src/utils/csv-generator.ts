import { Response } from 'express';
import { stringify } from 'csv-stringify';

interface CSVColumn {
    key: string;
    header: string;
}

export function streamCSV(
    res: Response,
    filename: string,
    columns: CSVColumn[],
    data: Record<string, unknown>[]
) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // BOM para Excel reconhecer UTF-8
    res.write('\uFEFF');

    const stringifier = stringify({
        delimiter: ';',
        header: true,
        columns: columns.map((col) => ({
            key: col.key,
            header: col.header,
        })),
    });

    stringifier.pipe(res);

    for (const row of data) {
        stringifier.write(row);
    }

    stringifier.end();
}

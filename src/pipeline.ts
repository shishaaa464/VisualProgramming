export type Transform<T> = (data: T[]) => T[];

export type Group<T, K extends keyof T> = {
    key: T[K];
    items: T[];
};

export type GroupTransform<T, K extends keyof T> = (groups: Group<T, K>[]) => Group<T, K>[];

export type Where<T> = <K extends keyof T>(key: K, value: T[K]) => Transform<T>;

export type Sort<T> = <K extends keyof T>(key: K) => Transform<T>;

export type GroupBy<T> = <K extends keyof T>(key: K) => (data: T[]) => Group<T, K>[];

export type Having<T> = <K extends keyof T>(predicate: (group: Group<T, K>) => boolean) => GroupTransform<T, K>;

export function query<T>(...steps: Function[]): any {
    return (data: any[]) => {
        return steps.reduce((currentData, step) => step(currentData), data);
    };
}

export const where: Where<any> = (key, value) => (data) =>
    data.filter((item) => item[key] === value);

export const sort: Sort<any> = (key) => (data) =>
    [...data].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av < bv) return -1;
        if (av > bv) return 1;
        return 0;
    });

export const groupBy: GroupBy<any> = (key) => (data) => {
    return Object.values(
        data.reduce((acc, item) => {
            const k = item[key] as unknown as string;
            (acc[k] ??= { key: item[key], items: [] }).items.push(item);
            return acc;
        }, {} as Record<string, Group<any, any>>)
    );
};

export const having: Having<any> = (predicate) => (groups) =>
    groups.filter(predicate);
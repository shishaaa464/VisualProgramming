import { Group } from './pipeline';

type StepTag = 'where' | 'groupBy' | 'having' | 'sort';

interface TaggedFunction<Tag extends StepTag> {
    (data: any): any;
    __tag: Tag;
}

type NextTag<Current extends StepTag> =
    Current extends 'where' ? 'where' | 'groupBy' | 'having' | 'sort' :
    Current extends 'groupBy' ? 'having' | 'sort' :
    Current extends 'having' ? 'having' | 'sort' :
    Current extends 'sort' ? 'sort' :
    never;

type ValidateSteps<Steps extends any[], CurrentTag extends StepTag = 'where'> =
    Steps extends [infer First, ...infer Rest]
    ? First extends { __tag: infer FirstTag }
    ? FirstTag extends StepTag
    ? FirstTag extends NextTag<CurrentTag> | CurrentTag
    ? [First, ...ValidateSteps<Rest, FirstTag>]
    : [never, ...ValidateSteps<Rest, any>]
    : Steps
    : Steps
    : Steps;

export const where = <T>(key: keyof T, value: T[keyof T]) => {
    const fn = (data: T[]) => data.filter(item => item[key] === value);
    (fn as any).__tag = 'where';
    return fn as unknown as TaggedFunction<'where'>;
};

export const groupBy = <T>(key: keyof T) => {
    const fn = (data: T[]) => {
        const groups: Record<string, Group<T, keyof T>> = {};
        data.forEach(item => {
            const k = String(item[key]);
            if (!groups[k]) groups[k] = { key: item[key], items: [] };
            groups[k].items.push(item);
        });
        return Object.values(groups);
    };
    (fn as any).__tag = 'groupBy';
    return fn as unknown as TaggedFunction<'groupBy'>;
};

export const having = <T, K extends keyof T>(predicate: (g: Group<T, K>) => boolean) => {
    const fn = (groups: Group<T, K>[]) => groups.filter(predicate);
    (fn as any).__tag = 'having';
    return fn as unknown as TaggedFunction<'having'>;
};

export const sort = <T>(key: keyof T) => {
    const fn = (data: any[]) => [...data].sort((a, b) => (a[key] > b[key] ? 1 : -1));
    (fn as any).__tag = 'sort';
    return fn as unknown as TaggedFunction<'sort'>;
};

export function query<T, Steps extends any[] = any[]>(
    ...steps: ValidateSteps<Steps>
): (data: T[]) => any {
    return (data: T[]) => (steps as any[]).reduce((acc, step) => (step as any)(acc), data);
}
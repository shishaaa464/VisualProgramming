export type DeepReadonly<T> = {
    readonly [k in keyof T]: T[k] extends object ? DeepReadonly<T[k]> : T[k];
};

export type PickedByType<T, U> = {
    [k in keyof T as T[k] extends U ? k : never]: T[k];
};

export type EventHandlers<T> = {
    [k in keyof T as `on${Capitalize<k & string>}`]: () => void;
};
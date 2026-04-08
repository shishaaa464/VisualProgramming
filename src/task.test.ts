import { expectTypeOf, describe, it } from 'vitest';
import { DeepReadonly, PickedByType, EventHandlers } from './task';

describe('Тесты', () => {
    it('Проверка DeepReadonly', () => {
        type Obj = { a: number; b: { c: string } };
        expectTypeOf<DeepReadonly<Obj>>().toEqualTypeOf<{
            readonly a: number;
            readonly b: { readonly c: string };
        }>();
    });

    it('Проверка PickedByType', () => {
        type Mix = { a: number; b: string; c: number };
        expectTypeOf<PickedByType<Mix, number>>().toEqualTypeOf<{
            a: number;
            c: number;
        }>();
    });

    it('Проверка EventHandlers', () => {
        type Events = { click: void; input: void };
        expectTypeOf<EventHandlers<Events>>().toEqualTypeOf<{
            onClick: () => void;
            onInput: () => void;
        }>();
    });
});
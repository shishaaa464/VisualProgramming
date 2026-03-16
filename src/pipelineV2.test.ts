import { describe, test, expectTypeOf, expect } from 'vitest';
import { query, where, groupBy, having, sort } from './pipelineV2';

type User = { id: number; name: string; age: number; city: string };

const users: User[] = [
    { id: 1, name: "John", age: 30, city: "NY" },
    { id: 2, name: "Mike", age: 25, city: "LA" },
    { id: 3, name: "John", age: 20, city: "LA" }
];

describe('Lab 5', () => {

    test('Should work with correct order and return data', () => {
        const q = query<User>(
            where<User>('name', 'John'),
            sort<User>('age')
        );
        const result = q(users);
        expect(result).toHaveLength(2);
        expect(result[0].age).toBe(20);
    });

    test('Should allow full chain: where -> groupBy -> having -> sort', () => {
        const q = query<User>(
            where<User>('name', 'John'),
            groupBy<User>('city'),
            having(g => g.items.length > 0),
            sort<any>('key')
        );
        expectTypeOf(q).toBeFunction();
    });

    test('Should ERROR if where is after sort', () => {
        query<User>(
            sort<User>('age'),
            where<User>('name', 'John')
        );
    });

    test('Should ERROR if where is after groupBy', () => {
        query<User>(
            groupBy<User>('city'),
            where<User>('name', 'John')
        );
    });
});
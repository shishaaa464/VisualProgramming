import { describe, test, expect } from 'vitest';
import { query, where, sort, groupBy, having } from './pipeline';

type User = {
    id: number;
    name: string;
    surname: string;
    age: number;
    city: string;
};

const users: User[] = [
    { id: 1, name: "John", surname: "Doe", age: 34, city: "NY" },
    { id: 2, name: "John", surname: "Doe", age: 33, city: "NY" },
    { id: 3, name: "John", surname: "Doe", age: 35, city: "LA" },
    { id: 4, name: "Mike", surname: "Doe", age: 35, city: "LA" },
];

describe('Lab 4', () => {
    test('Фильтрация и сортировка', () => {
        const search = query<User>(
            where("name", "John"),
            where("surname", "Doe"),
            sort("age")
        );
        const result = search(users);
        expect(result).toHaveLength(3);
        expect(result[0].age).toBe(33);
        expect(result[1].age).toBe(34);
        expect(result[2].age).toBe(35);
    });

    test('Группировка и фильтр по группам', () => {
        const groupAndFilter = query<User>(
            groupBy("city"),
            having((group) => group.items.length > 1)
        );
        const result = groupAndFilter(users);
        expect(result).toHaveLength(2);
    });

    test('Комбинированный конвейер', () => {
        const pipeline = query<User>(
            where("surname", "Doe"),
            groupBy("city"),
            having((group) => group.items.some((u: any) => u.age > 34))
        );
        const result = pipeline(users);
        expect(result).toHaveLength(1);
        expect(result[0].key).toBe("LA");
    });
});
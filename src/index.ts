interface User {
    id: number;
    name: string;
    email?: string;
    isActive: boolean;
}

function createUser(
    id: number,
    name: string,
    email?: string,
    isActive: boolean = true
): User {
    const user: User = { id, name, isActive };
    if (email !== undefined) {
        user.email = email;
    }
    return user;
}

const user1 = createUser(1, "Egor");
const user2 = createUser(2, "Daniyar", "Daniyar@gmail.com", false);

console.log(user1);
console.log(user2);


interface Book {
    title: string;
    author: string;
    year?: number;
    genre: 'fiction' | 'non-fiction';
}

function createBook(book: Book): Book {
    return book;
}

const book1 = createBook({
    title: "KHABIBTIME",
    author: "Khabib Nurmagomedov",
    year: 2021,
    genre: "fiction"
});

const book2 = createBook({
    title: "Cristiano Ronaldo",
    author: "Kayoli Luka",
    genre: "non-fiction"
});

console.log(book1);
console.log(book2);


function calculateArea(shape: 'circle', radius: number): number;
function calculateArea(shape: 'square', side: number): number;

function calculateArea(shape: 'circle' | 'square', value: number): number {
    if (shape === 'circle') {
        return Math.PI * value * value;
    }
    return value * value;
}

console.log(calculateArea('circle', 5));
console.log(calculateArea('square', 4));


type Status = 'active' | 'inactive' | 'new';

function getStatusColor(status: Status): string {
    switch (status) {
        case 'active': return 'green';
        case 'inactive': return 'gray';
        case 'new': return 'blue';
    }
}

console.log(getStatusColor('active'));


type StringFormatter = (str: string, uppercase?: boolean) => string;

const capitalize: StringFormatter = (str, uppercase = false) => {
    const result = str.charAt(0).toUpperCase() + str.slice(1);
    return uppercase ? result.toUpperCase() : result;
};

const trimAndFormat: StringFormatter = (str, uppercase = false) => {
    const result = str.trim();
    return uppercase ? result.toUpperCase() : result;
};

console.log(capitalize("hello world"));
console.log(trimAndFormat("   hello world   ", true));


function getFirstElement<T>(arr: T[]): T | undefined {
    return arr.length ? arr[0] : undefined;
}

console.log(getFirstElement([1, 2, 3]));
console.log(getFirstElement(["a", "b", "c"]));


interface HasId {
    id: number;
}

function findById<T extends HasId>(items: T[], id: number): T | undefined {
    return items.find(item => item.id === id);
}

const usersArray = [
    { id: 1, name: "Egor" },
    { id: 2, name: "Daniyar" }
];

console.log(findById(usersArray, 2));

export {
    createUser,
    createBook,
    calculateArea,
    getStatusColor,
    capitalize,
    trimAndFormat,
    getFirstElement,
    findById
};
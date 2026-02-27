"use strict";
function createUser(id, name, email, isActive = true) {
    const user = { id, name, isActive };
    if (email !== undefined) {
        user.email = email;
    }
    return user;
}
const user1 = createUser(1, "Egor");
const user2 = createUser(2, "Daniyar", "Daniyar@gmail.com", false);
console.log(user1);
console.log(user2);
function createBook(book) {
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
function calculateArea(shape, value) {
    if (shape === 'circle') {
        return Math.PI * value * value;
    }
    return value * value;
}
console.log(calculateArea('circle', 5));
console.log(calculateArea('square', 4));
function getStatusColor(status) {
    switch (status) {
        case 'active': return 'green';
        case 'inactive': return 'gray';
        case 'new': return 'blue';
    }
}
console.log(getStatusColor('active'));
const capitalize = (str, uppercase = false) => {
    const result = str.charAt(0).toUpperCase() + str.slice(1);
    return uppercase ? result.toUpperCase() : result;
};
const trimAndFormat = (str, uppercase = false) => {
    const result = str.trim();
    return uppercase ? result.toUpperCase() : result;
};
console.log(capitalize("hello world"));
console.log(trimAndFormat("   hello world   ", true));
function getFirstElement(arr) {
    return arr.length ? arr[0] : undefined;
}
console.log(getFirstElement([1, 2, 3]));
console.log(getFirstElement(["a", "b", "c"]));
function findById(items, id) {
    return items.find(item => item.id === id);
}
const usersArray = [
    { id: 1, name: "Egor" },
    { id: 2, name: "Daniyar" }
];
console.log(findById(usersArray, 2));

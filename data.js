// 代码片段库
const codeSnippets = [
    `function hello(name) {
    return "Hello, " + name + "!";
}`,
    `const sum = (a, b) => a + b;`,
    `for (let i = 0; i < 10; i++) {
    console.log(i);
}`,
    `if (user.isAdmin) {
    console.log("Admin access");
} else {
    console.log("User access");
}`,
    `const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
];`,
    `try {
    const data = JSON.parse(input);
} catch (e) {
    console.error(e);
}`,
    `async function fetchData(url) {
    const res = await fetch(url);
    return await res.json();
}`,
    `class Animal {
    constructor(name) {
        this.name = name;
    }
}`,
    `const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);`,
    `const greeting = \`Hello, \${name}!\`;`
];

// 符号练习
const symbolPractice = [
    `(){}[]<>;:,."'/\\|`,
    `!@#$%^&*()_+-=`,
    `const obj = {key: "value"};`,
    `if (x > 0 && y < 10) {}`,
    `const arr = [1, 2, 3];`,
    `let x = (a + b) * (c - d);`,
    `const regex = /^[a-z]+$/;`,
    `arr.filter(x => x > 5);`,
    `<div class="container"></div>`,
    `SELECT * FROM users WHERE id = 1;`
];

// 混合模式
const mixedContent = [
    `// Calculate sum
function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}`,
    `/* API Request */
fetch("/api/data")
    .then(res => res.json())
    .then(data => console.log(data));`,
    `// Loop through array
for (const item of items) {
    console.log(item);
}`,
    `/* User validation */
if (email && password) {
    login(email, password);
}`,
    `// Export module
export default function App() {
    return <div>Hello</div>;
}`
];

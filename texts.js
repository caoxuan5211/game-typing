// 代码片段练习库
const codeSnippets = [
    // JavaScript
    `function calculateSum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}`,
    `const fetchData = async (url) => {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error("Error:", error);
    }
};`,
    `class User {
    constructor(name, email) {
        this.name = name;
        this.email = email;
    }

    greet() {
        return \`Hello, \${this.name}!\`;
    }
}`,
    `const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const filtered = doubled.filter(n => n > 5);`,
    `if (user && user.isAuthenticated()) {
    console.log("Access granted");
} else {
    throw new Error("Unauthorized");
}`,
    `const config = {
    api: "https://api.example.com",
    timeout: 5000,
    headers: {
        "Content-Type": "application/json"
    }
};`,
    // Python
    `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)`,
    `class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height`,
    `try:
    with open("file.txt", "r") as f:
        data = f.read()
except FileNotFoundError:
    print("File not found")`,
    `numbers = [x**2 for x in range(10) if x % 2 == 0]
result = sum(numbers) / len(numbers)`,
    // TypeScript
    `interface UserData {
    id: number;
    name: string;
    email?: string;
    roles: string[];
}`,
    `type AsyncResult<T> = Promise<{
    data: T | null;
    error: Error | null;
}>;`,
    `const createUser = (data: UserData): User => {
    return new User(data.name, data.email);
};`,
    // CSS
    `.container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
}`,
    `@media (max-width: 768px) {
    .sidebar {
        display: none;
    }
}`,
    // HTML
    `<div class="card">
    <h2>Title</h2>
    <p>Content goes here...</p>
    <button onclick="handleClick()">Click</button>
</div>`,
    // SQL
    `SELECT users.name, COUNT(orders.id) AS order_count
FROM users
LEFT JOIN orders ON users.id = orders.user_id
GROUP BY users.id
HAVING order_count > 5;`,
    // JSON
    `{
    "name": "John Doe",
    "age": 30,
    "skills": ["JavaScript", "Python", "Go"],
    "active": true
}`,
    // More complex snippets
    `const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};`,
    `export default function middleware(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    next();
}`,
    `const routes = [
    { path: "/", component: Home },
    { path: "/about", component: About },
    { path: "/users/:id", component: UserProfile }
];`,
    `async function* generateNumbers(max) {
    for (let i = 0; i < max; i++) {
        await sleep(100);
        yield i;
    }
}`,
    // Go
    `func main() {
    http.HandleFunc("/", handler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}`,
    // Rust
    `fn multiply(x: i32, y: i32) -> i32 {
    x * y
}`,
    // More JavaScript patterns
    `const [state, setState] = useState({
    count: 0,
    items: []
});`,
    `useEffect(() => {
    const subscription = observable.subscribe();
    return () => subscription.unsubscribe();
}, []);`,
    // Error handling
    `try {
    const result = JSON.parse(data);
    console.log(result);
} catch (e) {
    console.error("Parse error:", e.message);
}`,
    // Regex patterns
    `const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$/;
const isValid = emailRegex.test(email);`
];

// 符号专项练习
const symbolPractice = [
    `(){}[]<>;:,."'/\\|`,
    `!@#$%^&*()_+-={}[]|\\:";'<>?,./`,
    `const arr = [1, 2, 3]; const obj = {key: "value"};`,
    `if (x > 0 && y < 10) { return x / y; }`,
    `const str = "Hello, World!"; const num = 3.14;`,
    `let x = (a + b) * (c - d) / e;`,
    `function test() { return {a: 1, b: 2}; }`,
    `const regex = /^[a-z]+$/i; const match = str.match(regex);`,
    `arr.map((x) => x * 2).filter((x) => x > 5);`,
    `<div className="container">Content</div>`,
    `const obj = {...prev, key: value};`,
    `type Props = { name: string; age?: number; };`,
    `import { useState, useEffect } from 'react';`,
    `export default function Component() { return <></> }`,
    `const [a, b, ...rest] = array;`,
    `template<typename T> class Container {};`,
    `SELECT * FROM users WHERE age >= 18 AND status != 'inactive';`,
    `git commit -m "feat: add new feature"`,
    `npm install --save-dev @types/node`,
    `echo "Hello" | grep -i "hello" > output.txt`
];

// 混合模式 - 包含代码和文本
const mixedContent = [
    `// Calculate the factorial of a number
function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}`,
    `/* This function validates email addresses using regex */
const validateEmail = (email) => {
    const pattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return pattern.test(email);
};`,
    `# Install dependencies and start the server
pip install -r requirements.txt
python manage.py runserver`,
    `/**
 * @param {string} text - The input text
 * @returns {number} Word count
 */
function countWords(text) {
    return text.split(/\\s+/).length;
}`,
    `# Quick sort algorithm implementation
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`,
    `// Event listener for button clicks
document.getElementById("btn").addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Button clicked!");
});`,
    `<!-- HTML form with validation -->
<form action="/submit" method="POST">
    <input type="email" name="email" required />
    <button type="submit">Submit</button>
</form>`,
    `# Docker commands for container management
docker build -t myapp:latest .
docker run -d -p 8080:8080 --name myapp myapp:latest
docker logs -f myapp`,
    `const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
const TOKEN_KEY = "auth_token";`,
    `#!/bin/bash
for file in *.txt; do
    echo "Processing $file"
    cat "$file" | grep -v "^#" > "${file}.tmp"
done`
];

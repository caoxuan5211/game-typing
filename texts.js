// 代码片段练习库 - 大幅扩充
const codeSnippets = [
    // JavaScript 基础
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
    `const [state, setState] = useState({
    count: 0,
    items: []
});`,
    `useEffect(() => {
    const subscription = observable.subscribe();
    return () => subscription.unsubscribe();
}, []);`,

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
    `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`,
    `import numpy as np
import pandas as pd

df = pd.read_csv('data.csv')
result = df.groupby('category')['value'].mean()`,
    `@app.route('/api/users/<int:user_id>')
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())`,

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
    `function identity<T>(arg: T): T {
    return arg;
}

let output = identity<string>("myString");`,

    // React/Vue
    `function TodoList({ items }) {
    return (
        <ul>
            {items.map(item => (
                <li key={item.id}>{item.text}</li>
            ))}
        </ul>
    );
}`,
    `const Counter = () => {
    const [count, setCount] = useState(0);

    return (
        <button onClick={() => setCount(count + 1)}>
            Count: {count}
        </button>
    );
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
    `@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}`,

    // SQL
    `SELECT users.name, COUNT(orders.id) AS order_count
FROM users
LEFT JOIN orders ON users.id = orders.user_id
GROUP BY users.id
HAVING order_count > 5;`,
    `CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
    `UPDATE users
SET status = 'active'
WHERE last_login > NOW() - INTERVAL '30 days';`,

    // Go
    `func main() {
    http.HandleFunc("/", handler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}`,
    `type User struct {
    ID    int    \`json:"id"\`
    Name  string \`json:"name"\`
    Email string \`json:"email"\`
}`,

    // Rust
    `fn multiply(x: i32, y: i32) -> i32 {
    x * y
}`,
    `let mut v = vec![1, 2, 3];
v.push(4);
println!("{:?}", v);`,

    // JSON
    `{
    "name": "John Doe",
    "age": 30,
    "skills": ["JavaScript", "Python", "Go"],
    "active": true
}`,

    // HTML
    `<div class="card">
    <h2>Title</h2>
    <p>Content goes here...</p>
    <button onclick="handleClick()">Click</button>
</div>`,
    `<form action="/submit" method="POST">
    <input type="email" name="email" required />
    <button type="submit">Submit</button>
</form>`,

    // Shell/Bash
    `#!/bin/bash
for file in *.txt; do
    echo "Processing $file"
    cat "$file" | grep -v "^#" > "${file}.tmp"
done`,

    // Git commands
    `git commit -m "feat: add new feature"`,
    `git checkout -b feature/new-branch`,
    `git rebase -i HEAD~3`,

    // npm/yarn
    `npm install --save-dev @types/node`,
    `yarn add react react-dom`,

    // Docker
    `docker build -t myapp:latest .
docker run -d -p 8080:8080 --name myapp myapp:latest`,

    // Regex
    `const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$/;
const isValid = emailRegex.test(email);`,

    // 错误处理
    `try {
    const result = JSON.parse(data);
    console.log(result);
} catch (e) {
    console.error("Parse error:", e.message);
}`,

    // 异步模式
    `async function* generateNumbers(max) {
    for (let i = 0; i < max; i++) {
        await sleep(100);
        yield i;
    }
}`,
    `Promise.all([
    fetch('/api/users'),
    fetch('/api/posts'),
    fetch('/api/comments')
]).then(responses => console.log(responses));`,

    // 更多实用片段
    `const sortBy = (arr, key) => {
    return arr.sort((a, b) => a[key] - b[key]);
};`,
    `const groupBy = (arr, key) => {
    return arr.reduce((acc, item) => {
        (acc[item[key]] = acc[item[key]] || []).push(item);
        return acc;
    }, {});
};`,
    `const throttle = (fn, wait) => {
    let lastTime = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastTime >= wait) {
            lastTime = now;
            fn(...args);
        }
    };
};`,
    `const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};`,
    `const arrayUnique = (arr) => {
    return [...new Set(arr)];
};`,
    `const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};`,
    `const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};`,
    `const isValidURL = (str) => {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
};`,
    `localStorage.setItem('user', JSON.stringify(userData));
const user = JSON.parse(localStorage.getItem('user'));`,
    `document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded');
});`,
    `const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';`,
];

// 符号专项练习 - 扩充
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
    `echo "Hello" | grep -i "hello" > output.txt`,
    `arr?.find?.(x => x > 5)`,
    `const result = a ?? b ?? c;`,
    `const obj = { [key]: value };`,
    `\`\${name} is \${age} years old\``,
    `for (let i = 0; i < 10; i++) { sum += i; }`,
    `while (x++ < 100 && y-- > 0) {}`,
    `switch (type) { case 'A': break; default: break; }`,
    `const fn = (a, b = 0, ...rest) => a + b;`,
    `obj?.prop?.method?.();`,
    `arr.reduce((acc, val) => acc + val, 0);`,
    `JSON.stringify({a: 1, b: [2, 3]});`,
    `Math.floor(Math.random() * 100);`,
];

// 混合模式 - 扩充
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
    `// Binary search implementation
function binarySearch(arr, target) {
    let left = 0, right = arr.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
    `/* Bubble sort algorithm */
function bubbleSort(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    return arr;
}`,
    `// API request with error handling
fetch('/api/data')
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error('Error:', err));`,
    `// Create a simple web server
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\\n');
});
server.listen(3000);`,
];

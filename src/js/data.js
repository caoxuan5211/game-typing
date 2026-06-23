/**
 * 练习文本数据模块
 * @version 1.0.0
 */

export const codeSnippets = [
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

	speak() {
		console.log(\`\${this.name} makes a sound.\`);
	}
}`,
    `const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const filtered = doubled.filter(n => n > 5);`,
    `const greeting = \`Hello, \${name}!\`;
console.log(greeting);`,
    `import React from 'react';

function App() {
	return <div>Hello World</div>;
}

export default App;`,
    `const promise = new Promise((resolve, reject) => {
	setTimeout(() => resolve('Done!'), 1000);
});`,
    `const obj = { a: 1, b: 2 };
const { a, b } = obj;
const arr = [...obj.values()];`,
    `function* generator() {
	yield 1;
	yield 2;
	yield 3;
}`,
    `const debounce = (fn, delay) => {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
};`,
    `class EventEmitter {
	constructor() {
		this.events = {};
	}

	on(event, listener) {
		if (!this.events[event]) {
			this.events[event] = [];
		}
		this.events[event].push(listener);
	}
}`,
    `const memoize = (fn) => {
	const cache = new Map();
	return (...args) => {
		const key = JSON.stringify(args);
		if (cache.has(key)) return cache.get(key);
		const result = fn(...args);
		cache.set(key, result);
		return result;
	};
};`,
    `async function parallel(tasks) {
	return Promise.all(tasks.map(task => task()));
}`,
    `const curry = (fn) => {
	return function curried(...args) {
		if (args.length >= fn.length) {
			return fn.apply(this, args);
		}
		return (...args2) => curried(...args, ...args2);
	};
};`,
    `const compose = (...fns) =>
	fns.reduce((f, g) => (...args) => f(g(...args)));`
];

export const symbolPractice = [
    `(){}[]<>;:,."'/\\|`,
    `!@#$%^&*()_+-=`,
    `const obj = {key: "value"};`,
    `if (x > 0 && y < 10) {}`,
    `const arr = [1, 2, 3];`,
    `let x = (a + b) * (c - d);`,
    `const regex = /^[a-z]+$/;`,
    `arr.filter(x => x > 5);`,
    `<div class="container"></div>`,
    `SELECT * FROM users WHERE id = 1;`,
    `const str = \`Template \${var}\`;`,
    `obj?.prop ?? 'default'`,
    `arr[0]?.method?.() || fallback`,
    `const {x, y, ...rest} = obj;`,
    `[...arr1, ...arr2, ...arr3]`,
    `x === y ? 'yes' : 'no'`,
    `value ||= defaultValue;`,
    `obj.#privateField = 123;`,
    `import { a, b as c } from './module';`,
    `export default function* gen() {}`
];

export const mixedContent = [
    `// Calculate sum
function sum(arr) {
	return arr.reduce((a, b) => a + b, 0);
}`,
    `/* API Request */
fetch("/api/data")
	.then(res => res.json())
	.then(data => console.log(data))
	.catch(err => console.error(err));`,
    `// Loop through array
for (const item of items) {
	console.log(\`Item: \${item}\`);
}`,
    `/* User validation */
if (email && password) {
	await login(email, password);
} else {
	throw new Error('Invalid credentials');
}`,
    `// Export module
export default function App() {
	const [count, setCount] = useState(0);
	return <div onClick={() => setCount(count + 1)}>{count}</div>;
}`,
    `/**
 * Binary search implementation
 * @param {number[]} arr - Sorted array
 * @param {number} target - Target value
 * @return {number} Index or -1
 */
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
    `/* Database Query */
const users = await db.collection('users')
	.where('age', '>=', 18)
	.orderBy('createdAt', 'desc')
	.limit(10)
	.get();`,
    `// React Hook
function useDebounce(value, delay) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => clearTimeout(handler);
	}, [value, delay]);

	return debouncedValue;
}`,
    `/* Express Route */
app.get('/api/users/:id', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json({ error: 'Not found' });
		res.json(user);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});`,
    `// TypeScript Interface
interface User {
	id: number;
	name: string;
	email?: string;
	roles: ('admin' | 'user')[];
}

const getUser = async (id: number): Promise<User> => {
	const response = await fetch(\`/api/users/\${id}\`);
	return response.json();
};`
];

export const advancedSnippets = [
    `class LinkedList {
	constructor() {
		this.head = null;
		this.size = 0;
	}

	append(value) {
		const node = { value, next: null };
		if (!this.head) {
			this.head = node;
		} else {
			let current = this.head;
			while (current.next) {
				current = current.next;
			}
			current.next = node;
		}
		this.size++;
	}
}`,
    `function quickSort(arr) {
	if (arr.length <= 1) return arr;
	const pivot = arr[arr.length - 1];
	const left = arr.filter((x, i) => x <= pivot && i < arr.length - 1);
	const right = arr.filter(x => x > pivot);
	return [...quickSort(left), pivot, ...quickSort(right)];
}`,
    `const observer = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			entry.target.classList.add('visible');
			observer.unobserve(entry.target);
		}
	});
}, { threshold: 0.1 });`,
    `async function retry(fn, retries = 3, delay = 1000) {
	try {
		return await fn();
	} catch (error) {
		if (retries === 0) throw error;
		await new Promise(resolve => setTimeout(resolve, delay));
		return retry(fn, retries - 1, delay * 2);
	}
}`,
    `const deepClone = (obj, hash = new WeakMap()) => {
	if (obj === null || typeof obj !== 'object') return obj;
	if (hash.has(obj)) return hash.get(obj);

	const clone = Array.isArray(obj) ? [] : {};
	hash.set(obj, clone);

	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			clone[key] = deepClone(obj[key], hash);
		}
	}

	return clone;
};`
];

export function getRandomText(mode, difficulty = 'medium') {
    let pool;
    switch (mode) {
        case 'code':
            pool = codeSnippets;
            break;
        case 'symbols':
            pool = symbolPractice;
            break;
        case 'mixed':
            pool = mixedContent;
            break;
        case 'advanced':
            pool = advancedSnippets;
            break;
        default:
            pool = codeSnippets;
    }

    return pool[Math.floor(Math.random() * pool.length)];
}

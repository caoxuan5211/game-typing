const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'typing-lab.db');
let db = null;

function init() {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // 创建用户表
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_active INTEGER DEFAULT 1
        )
    `);

    // 创建验证码表
    db.exec(`
        CREATE TABLE IF NOT EXISTS verification_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            used INTEGER DEFAULT 0
        )
    `);

    // 创建训练记录表
    db.exec(`
        CREATE TABLE IF NOT EXISTS training_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            wpm INTEGER NOT NULL,
            accuracy INTEGER NOT NULL,
            time INTEGER NOT NULL,
            mode TEXT NOT NULL,
            chars INTEGER NOT NULL,
            grade TEXT NOT NULL,
            xp INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // 创建用户统计表
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_stats (
            user_id INTEGER PRIMARY KEY,
            total_xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            total_runs INTEGER DEFAULT 0,
            best_wpm INTEGER DEFAULT 0,
            best_accuracy INTEGER DEFAULT 0,
            best_combo INTEGER DEFAULT 0,
            day_streak INTEGER DEFAULT 0,
            earned_badges TEXT DEFAULT '[]',
            modes_played TEXT DEFAULT '[]',
            last_played_day TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    console.log('✅ Database initialized');
}

function getDb() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

function close() {
    if (db) {
        db.close();
        console.log('Database closed');
    }
}

module.exports = {
    init,
    getDb,
    close
};

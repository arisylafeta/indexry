const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/indexry.db');

const initDB = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
    });

    db.serialize(() => {
      // Indices table
      db.run(`
        CREATE TABLE IF NOT EXISTS indices (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          rules TEXT,
          total_value REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Holdings table
      db.run(`
        CREATE TABLE IF NOT EXISTS holdings (
          id TEXT PRIMARY KEY,
          index_id TEXT NOT NULL,
          symbol TEXT NOT NULL,
          quantity REAL DEFAULT 0,
          target_weight REAL DEFAULT 0,
          current_weight REAL DEFAULT 0,
          last_price REAL DEFAULT 0,
          market_value REAL DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (index_id) REFERENCES indices(id)
        )
      `);

      // Rebalancing history
      db.run(`
        CREATE TABLE IF NOT EXISTS rebalancing (
          id TEXT PRIMARY KEY,
          index_id TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          orders TEXT,
          total_value_before REAL,
          total_value_after REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          executed_at DATETIME,
          FOREIGN KEY (index_id) REFERENCES indices(id)
        )
      `);

      // Trades table
      db.run(`
        CREATE TABLE IF NOT EXISTS trades (
          id TEXT PRIMARY KEY,
          index_id TEXT NOT NULL,
          rebalance_id TEXT,
          symbol TEXT NOT NULL,
          side TEXT NOT NULL,
          quantity REAL NOT NULL,
          price REAL,
          status TEXT DEFAULT 'pending',
          ibkr_order_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          executed_at DATETIME,
          FOREIGN KEY (index_id) REFERENCES indices(id),
          FOREIGN KEY (rebalance_id) REFERENCES rebalancing(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('Database initialized successfully');
          resolve(db);
        }
      });
    });
  });
};

initDB()
  .then(() => {
    console.log('Database setup complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

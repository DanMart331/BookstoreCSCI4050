const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const dbPath = path.resolve(__dirname, 'bookstore.db');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, err => {
  if (err) {
    console.error('Failed To Connect To SQLite Database:', err.message);
  } else {
    console.log('Connected To SQLite Database At', dbPath);
  }
});

module.exports = db;
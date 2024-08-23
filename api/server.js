require('dotenv/config');
const cors = require('cors');
const mysql = require('mysql2');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const port = 5502;

// Use express
const app = express();
app.use(cors());
app.use(express.json({limit: '30mb'}));
app.use(express.urlencoded({limit: '30mb', extended: true}));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

db.connect((err) => {
    if (err) {
        return console.log("Error connecting to database:", err);
    }
    console.log("Connected to database successfully:", db.threadId);

    db.query(`CREATE DATABASE IF NOT EXISTS Expense_tracker;`, (err) => {
        if (err) {
            return console.log("Error creating database:", err);
        }
        console.log("Database created successfully");

        // Select the database
        db.changeUser({database: 'Expense_tracker'}, (err) => {
            if (err) {
                return console.log("Error changing database:", err);
            }
            console.log("Changed to Expense_tracker database");

            // Create users table
            const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL UNIQUE,
                username VARCHAR(50) NOT NULL,
                password VARCHAR(255) NOT NULL
            );
            `;
            db.query(createUsersTable, (err) => {
                if (err) {
                    return console.log("Error creating users table:", err);
                }
                console.log("Users table created or already exists");

            });
            // Expenses table
            const createExpensesTable = `
            CREATE TABLE IF NOT EXISTS expense (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                amount DECIMAL(10, 2) NOT NULL, -- Added precision and scale
                _date DATE NOT NULL, -- Fixed column name
                category VARCHAR(50) NOT NULL, -- Fixed column name
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
            `;
            db.query(createExpensesTable, (err) => {
                if (err) {
                    return console.log("Error creating expenses table:", err);
                }
                console.log("Expenses table created or already exists");
            });

        });

    });

});

// Middleware for authentication
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Correct splitting
    
    if (!token) {
        return res.status(401).json({message: 'Unauthorized'});
    }
    try {
        // Verify the token and extract the user id
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        req.userId = decoded.id; // Note: Fixed case of userId
        next();
    } catch (err) {
        return res.status(401).json({message: 'Invalid token'});
    }
};

// User registration route
app.post('/api/register', async (req, res) => {
    try {
        const {email, username, password} = req.body;
        // Check if any input is empty
        if (!email || !username || !password) return res.status(400).json({message: 'All fields are required'})
        // Check if user already exists
        const UsersQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(UsersQuery, [email], async (err, data) => {
            if (err) {
                return res.status(500).json({message: 'Error checking user existence'});
            }
            if (data.length) {
                return res.status(409).json({message: 'User already exists'});
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert the new user
            const newUserQuery = `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`;
            db.query(newUserQuery, [email, username, hashedPassword], (err) => {
                if (err) {
                    return res.status(500).json({message: 'Error inserting new user'});
                }
                return res.status(200).json({message: 'User created successfully'});
            });

        });
    } catch (err) {
        res.status(500).json({message: 'Internal server error', error: err.message});
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    try {
        const {username, password} = req.body;
        // Fetch user by username
        const query = `SELECT * FROM users WHERE username = ?`;
        db.query(query, [username], async (err, result) => {
            if (err) {
                return res.status(500).json({message: 'Database query error'});
            }
            // Check if user exists
            if (result.length === 0) {
                return res.status(401).json({message: 'Invalid credentials'});
            }
            const user = result[0];
            // Compare the provided password with hashed password
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(401).json({message: 'Invalid details'});
            }
            return res.status(200).json({message: 'Access granted', token: jwt.sign(JSON.stringify({username: user.username, id: user.id}), process.env.JWT_SECRET)});
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({message: 'Internal server error'});
    }
});

// Route to add expense 
app.post('/api/expenses', authenticate, async (req, res) => {
    try {
        console.log('here');
        const { amount, date, category } = req.body;
        const userId = req.userId;

        if (!amount || !date || !category) {
            return res.status(400).json({message: 'All fields are required'});
        }
        const insertExpenseQuery = 'INSERT INTO expense(user_id, amount, _date, category) VALUES (?, ?, ?, ?)';
        db.query(insertExpenseQuery, [userId, amount, date, category], (err) => {
            if (err) {
                return res.status(500).json({message: 'Error inserting expense', error: err});
            }
            return res.status(201).json({message: 'Expense added successfully'});
        });
    } catch ({message}) {
        return res.status(400).json({message}); // return error
    }
});

// Route to fetch expenses for specific user
app.get('/api/expenses', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const selectExpenseQuery = 'SELECT * FROM expense WHERE user_id = ?';
        db.query(selectExpenseQuery, [userId], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Error fetching expenses', error: err});
            }
            return res.status(200).json(results);
        });
    } catch ({message}) {
        return res.status(400).json({message}); // return error
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
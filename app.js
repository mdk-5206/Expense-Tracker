// app.js - Clean, Error-Free Version
require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');

// Import local modules
const connectDB = require('./config/db');
const authRouter = require('./routes/auth');
const expensesRouter = require('./routes/expenses');
const attachUser = require('./middleware/auth');

const app = express();

// 1. Connect to Database 
connectDB();

// 2. Middleware Configuration 
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 3. View Engine Setup 
app.use(expressLayouts);
app.set('layout', 'partials/layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// 4. Custom Middleware 
app.use(attachUser);

// 5. Routes 
app.use('/auth', authRouter);
app.use('/expenses', expensesRouter);

// Home Route
app.get('/', (req, res) => {
    res.render('dashboard', {
        title: 'Dashboard',
        user: req.user || null,
        message: 'Welcome to Expense Tracker'
    });
});

// 6. 404 Handler 
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Page Not Found',
        user: req.user || null
    });
});

// 7. Global Error Handler 
app.use((err, req, res, next) => {
    console.error('--- SERVER ERROR ---');
    console.error(err.stack || err.message);
    
    const status = err.status || 500;
    const isDev = process.env.NODE_ENV === 'development'; // 

    res.status(status).render('error', {
        title: 'Server Error',
        status: status,
        message: isDev ? err.message : 'Something went wrong. Please try again later.',
        stack: isDev ? err.stack : null,
        user: req.user || null
    });
});

// 8. Server Initialization [cite: 1, 2]
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('-------------------------------------------');
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log('-------------------------------------------');
});
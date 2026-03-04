const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// GET /expenses - Dashboard & Graph logic
router.get('/', async (req, res) => {
    if (!req.user) return res.redirect('/auth/login');

    try {
        const selectedMonth = req.query.month || new Date().getMonth().toString();
        const year = 2026; // Current year context
        
        const startDate = new Date(year, parseInt(selectedMonth), 1);
        const endDate = new Date(year, parseInt(selectedMonth) + 1, 0, 23, 59, 59);

        // Fetch data for the specific month to show fluctuations
        const expenses = await Expense.find({ 
            user: req.user.id,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        let totalIncome = 0;
        let totalExpenses = 0;
        const dailyData = {};

        expenses.forEach(exp => {
            const day = new Date(exp.date).getDate();
            if (!dailyData[day]) dailyData[day] = { income: 0, expenses: 0 };

            if (exp.type === 'income') {
                dailyData[day].income += exp.amount;
                totalIncome += exp.amount;
            } else {
                dailyData[day].expenses += exp.amount;
                totalExpenses += exp.amount;
            }
        });

        const dayLabels = [];
        const dayIncome = [];
        const dayExpenses = [];
        const dayBalance = [];
        let runningBalance = 0;

        Object.keys(dailyData).sort((a, b) => a - b).forEach(day => {
            dayLabels.push(`Day ${day}`);
            dayIncome.push(dailyData[day].income);
            dayExpenses.push(dailyData[day].expenses);
            runningBalance += (dailyData[day].income - dailyData[day].expenses);
            dayBalance.push(runningBalance);
        });

        res.render('expenses', {
            title: 'Monthly Analysis',
            user: req.user,
            expenses: [...expenses].reverse(),
            selectedMonth: selectedMonth,
            totals: {
                income: totalIncome,
                expenses: totalExpenses,
                balance: totalIncome - totalExpenses
            },
            graphData: { labels: dayLabels, income: dayIncome, expenses: dayExpenses, balance: dayBalance }
        });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// GET /expenses/add - Show the form
router.get('/add', (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    res.render('add-expense', { title: 'New Entry', user: req.user, error: null });
});

/** * IMPORTANT: THIS POST ROUTE FIXES THE 404 ERROR
 */
router.post('/add', async (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    try {
        const { type, category, amount, date } = req.body;
        const newExpense = new Expense({
            user: req.user.id,
            type: type,
            category: category,
            amount: Number(amount),
            date: date || Date.now()
        });
        await newExpense.save();
        res.redirect('/expenses'); // Redirect back to dashboard to see the graph update
    } catch (err) {
        console.error(err);
        res.redirect('/expenses/add');
    }
});

// POST /expenses/delete/:id - Delete logic
router.post('/delete/:id', async (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    try {
        await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        res.redirect('/expenses');
    } catch (err) {
        res.redirect('/expenses');
    }
});

module.exports = router;

// =====================================
// WANDERLY - BUDGET TRACKER
// FIREBASE VERSION
// =====================================


// =====================================
// GLOBAL VARIABLES
// =====================================

let totalBudget = 0;
let expenses = [];


// =====================================
// EXPENSE CATEGORIES
// =====================================

const categories = [
    "Food",
    "Transport",
    "Accommodation",
    "Activities",
    "Shopping",
    "Others"
];


// =====================================
// FIREBASE REFERENCE
// =====================================

function getBudgetDocument() {
    return window.db
        .collection("budgets")
        .doc("shared");
}


// =====================================
// LOAD LOCAL BACKUP
// =====================================

function loadLocalData() {

    const savedBudget = localStorage.getItem("wanderlyBudget");

    totalBudget = savedBudget !== null
        ? Number(savedBudget)
        : 0;

    try {

        expenses = JSON.parse(
            localStorage.getItem("wanderlyExpenses") || "[]"
        );

        if (!Array.isArray(expenses)) {
            expenses = [];
        }

    } catch (error) {

        expenses = [];

    }

}


// =====================================
// SAVE DATA TO FIREBASE
// =====================================

async function saveData() {

    // Save local backup first

    localStorage.setItem("wanderlyBudget", totalBudget);

    localStorage.setItem(
        "wanderlyExpenses",
        JSON.stringify(expenses)
    );

    try {

        if (!window.db) {
            throw new Error("Firebase is not connected.");
        }

        await getBudgetDocument().set({

            totalBudget: Number(totalBudget),

            expenses: expenses,

            updatedAt: new Date().toISOString()

        });

        console.log("Budget data saved to Firebase!");

        return true;

    } catch (error) {

        console.error("Firebase budget save error:", error);

        alert(
            "Unable to save budget to Firebase. Please check your connection and Firestore Rules."
        );

        return false;

    }

}


// =====================================
// LOAD DATA FROM FIREBASE
// =====================================

async function loadBudgetFromFirebase() {

    try {

        if (!window.db) {
            throw new Error("Firebase is not connected.");
        }

        const documentSnapshot =
            await getBudgetDocument().get();

        if (documentSnapshot.exists) {

            const data = documentSnapshot.data();

            totalBudget = Number(data.totalBudget) || 0;

            expenses = Array.isArray(data.expenses)
                ? data.expenses
                : [];

            console.log("Budget loaded from Firebase!");

        } else {

            // Migrate existing localStorage data

            loadLocalData();

            // Create the shared Firebase document

            await getBudgetDocument().set({

                totalBudget: Number(totalBudget),

                expenses: expenses,

                updatedAt: new Date().toISOString()

            });

            console.log("Old budget data migrated to Firebase!");

        }

        // Update local backup

        localStorage.setItem("wanderlyBudget", totalBudget);

        localStorage.setItem(
            "wanderlyExpenses",
            JSON.stringify(expenses)
        );

    } catch (error) {

        console.error("Firebase budget load error:", error);

        // Keep local data available if Firebase cannot load

        loadLocalData();

        alert(
            "Unable to load budget from Firebase. Please check your Firebase connection and Firestore Rules."
        );

    }

    updateBudgetDisplay();
    displayExpenses();

}


// =====================================
// FORMAT MONEY
// =====================================

function formatMoney(amount) {

    return "RM " + Number(amount).toLocaleString("en-MY", {

        minimumFractionDigits: 2,

        maximumFractionDigits: 2

    });

}


// =====================================
// UPDATE BUDGET DISPLAY
// =====================================

function updateBudgetDisplay() {

    let totalExpenses = expenses.reduce(

        (total, expense) =>
            total + Number(expense.amount),

        0

    );

    let remainingBalance = totalBudget - totalExpenses;

    document.getElementById("totalBudget").textContent =

        totalBudget > 0
            ? formatMoney(totalBudget)
            : "Not Set";

    document.getElementById("totalExpenses").textContent =
        formatMoney(totalExpenses);

    document.getElementById("remainingBalance").textContent =

        totalBudget > 0
            ? formatMoney(remainingBalance)
            : "Not Set";

    updateBudgetAlert();

}


// =====================================
// BUDGET ALERT
// =====================================

function updateBudgetAlert() {

    const alertBox = document.getElementById("budgetAlert");

    if (!alertBox) return;

    let totalExpenses = expenses.reduce(

        (total, expense) =>
            total + Number(expense.amount),

        0

    );

    let remainingBalance = totalBudget - totalExpenses;

    if (totalBudget <= 0) {

        alertBox.className = "budget-alert warning";

        alertBox.textContent =
            "Please set your travel budget before adding expenses.";

    } else if (remainingBalance < 0) {

        alertBox.className = "budget-alert danger";

        alertBox.textContent =
            "Warning! You have exceeded your travel budget.";

    } else if (remainingBalance <= totalBudget * 0.2) {

        alertBox.className = "budget-alert warning";

        alertBox.textContent =
            "Your remaining budget is getting low. Spend wisely!";

    } else {

        alertBox.className = "budget-alert success";

        alertBox.textContent =
            "Great! Your travel budget is under control.";

    }

}


// =====================================
// SET BUDGET
// =====================================

async function setBudget() {

    const budgetInput = document.getElementById("budgetInput");

    let newBudget = Number(budgetInput.value);

    if (
        !budgetInput.value ||
        !Number.isFinite(newBudget) ||
        newBudget <= 0
    ) {

        alert("Please enter a valid budget amount.");

        return;

    }

    const previousBudget = totalBudget;

    totalBudget = newBudget;

    const saved = await saveData();

    if (!saved) {

        totalBudget = previousBudget;

        updateBudgetDisplay();

        return;

    }

    updateBudgetDisplay();

    budgetInput.value = "";

    alert("Your budget has been saved successfully!");

}


// =====================================
// ADD EXPENSE
// =====================================

async function addExpense() {

    if (totalBudget <= 0) {

        alert("Please set your budget first.");

        return;

    }

    const name = document.getElementById("expenseName").value.trim();

    const amount = Number(
        document.getElementById("expenseAmount").value
    );

    const category =
        document.getElementById("expenseCategory").value;

    const date =
        document.getElementById("expenseDate").value;

    if (
        !name ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !category ||
        !date
    ) {

        alert("Please complete all expense details.");

        return;

    }

    const newExpense = {

        id: Date.now(),

        name: name,

        amount: amount,

        category: category,

        date: date

    };

    expenses.push(newExpense);

    const saved = await saveData();

    if (!saved) {

        expenses = expenses.filter(
            expense => expense.id !== newExpense.id
        );

        return;

    }

    updateBudgetDisplay();

    displayExpenses();

    document.getElementById("expenseName").value = "";

    document.getElementById("expenseAmount").value = "";

    document.getElementById("expenseCategory").value = "";

    document.getElementById("expenseDate").value = "";

}


// =====================================
// DISPLAY EXPENSE HISTORY
// =====================================

function displayExpenses() {

    const expenseList = document.getElementById("expenseList");

    if (!expenseList) return;

    expenseList.innerHTML = "";

    if (expenses.length === 0) {

        expenseList.innerHTML = `
            <tr>
                <td colspan="5" class="empty-message">
                    No expenses recorded yet.
                </td>
            </tr>
        `;

        displayCategorySummary();

        return;

    }

    expenses.forEach(function(expense) {

        const row = document.createElement("tr");

        const nameCell = document.createElement("td");

        nameCell.textContent = expense.name;

        const categoryCell = document.createElement("td");

        categoryCell.textContent = expense.category;

        const dateCell = document.createElement("td");

        dateCell.textContent = expense.date;

        const amountCell = document.createElement("td");

        amountCell.textContent = formatMoney(expense.amount);

        const actionCell = document.createElement("td");

        const editButton = document.createElement("button");

        editButton.textContent = "Edit";

        editButton.className = "edit-expense-btn";

        editButton.onclick = function() {

            editExpense(expense.id);

        };

        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";

        deleteButton.className = "delete-expense-btn";

        deleteButton.onclick = function() {

            deleteExpense(expense.id);

        };

        actionCell.appendChild(editButton);

        actionCell.appendChild(deleteButton);

        row.appendChild(nameCell);

        row.appendChild(categoryCell);

        row.appendChild(dateCell);

        row.appendChild(amountCell);

        row.appendChild(actionCell);

        expenseList.appendChild(row);

    });

    displayCategorySummary();

}


// =====================================
// EXPENSE SUMMARY
// =====================================

function displayCategorySummary() {

    const summary = document.getElementById("categorySummary");

    if (!summary) return;

    summary.innerHTML = "";

    if (expenses.length === 0) {

        summary.innerHTML = `
            <p class="empty-message">
                No expenses to analyse yet.
            </p>
        `;

        return;

    }

    categories.forEach(function(category) {

        let categoryTotal = expenses

            .filter(expense => expense.category === category)

            .reduce(
                (total, expense) =>
                    total + Number(expense.amount),
                0
            );

        if (categoryTotal > 0) {

            let totalExpenses = expenses.reduce(

                (total, expense) =>
                    total + Number(expense.amount),

                0

            );

            let percentage =
                (categoryTotal / totalExpenses) * 100;

            const categoryItem = document.createElement("div");

            categoryItem.className = "category-item";

            const categoryInfo = document.createElement("div");

            categoryInfo.className = "category-info";

            const categoryName = document.createElement("strong");

            categoryName.textContent = category;

            const categoryAmount = document.createElement("span");

            categoryAmount.textContent = formatMoney(categoryTotal);

            categoryInfo.appendChild(categoryName);

            categoryInfo.appendChild(categoryAmount);

            const categoryBar = document.createElement("div");

            categoryBar.className = "category-bar";

            const categoryProgress = document.createElement("div");

            categoryProgress.className = "category-progress";

            categoryProgress.style.width = percentage + "%";

            categoryBar.appendChild(categoryProgress);

            categoryItem.appendChild(categoryInfo);

            categoryItem.appendChild(categoryBar);

            summary.appendChild(categoryItem);

        }

    });

}


// =====================================
// EDIT EXPENSE
// =====================================

async function editExpense(id) {

    const expense = expenses.find(
        item => item.id === id
    );

    if (!expense) return;

    let newName = prompt(
        "Edit expense name:",
        expense.name
    );

    if (newName === null) return;

    let newAmount = prompt(
        "Edit expense amount:",
        expense.amount
    );

    if (newAmount === null) return;

    let newCategory = prompt(

        "Edit category (Food, Transport, Accommodation, Activities, Shopping, Others):",

        expense.category

    );

    if (newCategory === null) return;

    let newDate = prompt(
        "Edit expense date (YYYY-MM-DD):",
        expense.date
    );

    if (newDate === null) return;

    newAmount = Number(newAmount);

    if (

        !newName.trim() ||

        !Number.isFinite(newAmount) ||

        newAmount <= 0 ||

        !categories.includes(newCategory) ||

        !newDate

    ) {

        alert("Invalid expense details. Please try again.");

        return;

    }

    const previousExpense = { ...expense };

    expense.name = newName.trim();

    expense.amount = newAmount;

    expense.category = newCategory;

    expense.date = newDate;

    const saved = await saveData();

    if (!saved) {

        Object.assign(expense, previousExpense);

        return;

    }

    updateBudgetDisplay();

    displayExpenses();

    alert("Expense updated successfully!");

}


// =====================================
// DELETE EXPENSE
// =====================================

async function deleteExpense(id) {

    const confirmation = confirm(
        "Are you sure you want to delete this expense?"
    );

    if (!confirmation) return;

    const previousExpenses = [...expenses];

    expenses = expenses.filter(
        expense => expense.id !== id
    );

    const saved = await saveData();

    if (!saved) {

        expenses = previousExpenses;

        return;

    }

    updateBudgetDisplay();

    displayExpenses();

}


// =====================================
// LOGOUT
// =====================================

function logout() {

    localStorage.removeItem("wanderlyLoggedIn");

    window.location.href = "index.html";

}


// =====================================
// PAGE INITIALIZATION
// =====================================

document.addEventListener("DOMContentLoaded", async function() {

    loadLocalData();

    updateBudgetDisplay();

    displayExpenses();

    await loadBudgetFromFirebase();

});

// WANDERLY BUDGET TRACKER

// LOAD SAVED BUDGET
let savedBudget = localStorage.getItem("wanderlyBudget");

let totalBudget = savedBudget !== null && Number(savedBudget) !== 3000
    ? Number(savedBudget)
    : 0;

if (Number(savedBudget) === 3000) {
    localStorage.removeItem("wanderlyBudget");
}

// LOAD SAVED EXPENSES
let expenses = JSON.parse(
    localStorage.getItem("wanderlyExpenses") || "[]"
);

// EXPENSE CATEGORIES
const categories = [
    "Food",
    "Transport",
    "Accommodation",
    "Activities",
    "Shopping",
    "Others"
];


// FORMAT MONEY

function formatMoney(amount) {
    return "RM " + Number(amount).toLocaleString("en-MY", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// SAVE DATA

function saveData() {
    localStorage.setItem("wanderlyBudget", totalBudget);
    localStorage.setItem(
        "wanderlyExpenses",
        JSON.stringify(expenses)
    );
}


// UPDATE BUDGET DISPLAY

function updateBudgetDisplay() {

    let totalExpenses = expenses.reduce(
        (total, expense) => total + Number(expense.amount),
        0
    );

    let remainingBalance = totalBudget - totalExpenses;

    document.getElementById("totalBudget").textContent =
        totalBudget > 0 ? formatMoney(totalBudget) : "Not Set";

    document.getElementById("totalExpenses").textContent =
        formatMoney(totalExpenses);

    document.getElementById("remainingBalance").textContent =
        totalBudget > 0 ? formatMoney(remainingBalance) : "Not Set";

    updateBudgetAlert();
}


// BUDGET ALERT

function updateBudgetAlert() {

    const alertBox = document.getElementById("budgetAlert");

    if (!alertBox) return;

    let totalExpenses = expenses.reduce(
        (total, expense) => total + Number(expense.amount),
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


// SET BUDGET

function setBudget() {

    const budgetInput = document.getElementById("budgetInput");

    let newBudget = Number(budgetInput.value);

    if (!budgetInput.value || newBudget <= 0) {
        alert("Please enter a valid budget amount.");
        return;
    }

    totalBudget = newBudget;

    saveData();
    updateBudgetDisplay();

    budgetInput.value = "";

    alert("Your budget has been saved successfully!");
}


// ADD EXPENSE


function addExpense() {

    if (totalBudget <= 0) {
        alert("Please set your budget first.");
        return;
    }

    const name = document.getElementById("expenseName").value.trim();
    const amount = Number(document.getElementById("expenseAmount").value);
    const category = document.getElementById("expenseCategory").value;
    const date = document.getElementById("expenseDate").value;

    if (!name || !amount || amount <= 0 || !category || !date) {
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

    saveData();

    updateBudgetDisplay();
    displayExpenses();

    document.getElementById("expenseName").value = "";
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseCategory").value = "";
    document.getElementById("expenseDate").value = "";
}


// DISPLAY EXPENSE HISTORY

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

        const amountCell = document.createElement("td");
        amountCell.textContent = formatMoney(expense.amount);

        const dateCell = document.createElement("td");
        dateCell.textContent = expense.date;

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
        row.appendChild(amountCell);
        row.appendChild(dateCell);
        row.appendChild(actionCell);

        expenseList.appendChild(row);

    });

    displayCategorySummary();
}


// EXPENSE SUMMARY

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
            .reduce((total, expense) => total + Number(expense.amount), 0);

        if (categoryTotal > 0) {

            let totalExpenses = expenses.reduce(
                (total, expense) => total + Number(expense.amount),
                0
            );

            let percentage = (categoryTotal / totalExpenses) * 100;

            const categoryItem = document.createElement("div");
            categoryItem.className = "category-item";

            categoryItem.innerHTML = `
                <div class="category-info">
                    <strong>${category}</strong>
                    <span>${formatMoney(categoryTotal)}</span>
                </div>

                <div class="category-bar">
                    <div class="category-progress"
                         style="width: ${percentage}%;">
                    </div>
                </div>
            `;

            summary.appendChild(categoryItem);
        }

    });
}


// EDIT EXPENSE

function editExpense(id) {

    const expense = expenses.find(item => item.id === id);

    if (!expense) return;

    let newName = prompt("Edit expense name:", expense.name);

    if (newName === null) return;

    let newAmount = prompt("Edit expense amount:", expense.amount);

    if (newAmount === null) return;

    let newCategory = prompt(
        "Edit category (Food, Transport, Accommodation, Activities, Shopping, Others):",
        expense.category
    );

    if (newCategory === null) return;

    let newDate = prompt("Edit expense date (YYYY-MM-DD):", expense.date);

    if (newDate === null) return;

    newAmount = Number(newAmount);

    if (
        !newName.trim() ||
        newAmount <= 0 ||
        !categories.includes(newCategory) ||
        !newDate
    ) {
        alert("Invalid expense details. Please try again.");
        return;
    }

    expense.name = newName.trim();
    expense.amount = newAmount;
    expense.category = newCategory;
    expense.date = newDate;

    saveData();

    updateBudgetDisplay();
    displayExpenses();
}


// DELETE EXPENSE

function deleteExpense(id) {

    const confirmation = confirm(
        "Are you sure you want to delete this expense?"
    );

    if (!confirmation) return;

    expenses = expenses.filter(
        expense => expense.id !== id
    );

    saveData();

    updateBudgetDisplay();
    displayExpenses();
}


// LOAD BUDGET TRACKER


document.addEventListener("DOMContentLoaded", function() {

    updateBudgetDisplay();
    displayExpenses();

});
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
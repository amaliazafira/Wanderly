
// =====================================
// WANDERLY - MAIN JAVASCRIPT
// =====================================


// =====================================
// HELPER: LOAD SAVED DATA
// =====================================

function getSavedData(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        return [];
    }
}


// =====================================
// REGISTER FUNCTION
// =====================================

function setupRegister() {
    const registerForm = document.getElementById("registerForm");

    if (!registerForm) return;

    registerForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const username = document.getElementById("newUsername").value.trim();
        const password = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const message = document.getElementById("registerMessage");

        if (!username || !password || !confirmPassword) {
            if (message) message.textContent = "Please fill in all fields.";
            return;
        }

        if (password !== confirmPassword) {
            if (message) message.textContent = "Passwords do not match!";
            return;
        }

        const user = {
            username: username,
            password: password
        };

        localStorage.setItem("wanderlyUser", JSON.stringify(user));

        alert("Registration successful! You can now sign in.");
        window.location.href = "index.html";
    });
}


// =====================================
// LOGIN FUNCTION
// =====================================

function setupLogin() {
    const loginForm = document.getElementById("loginForm");

    if (!loginForm) return;

    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const errorMessage = document.getElementById("errorMessage");

        let savedUser = null;

        try {
            savedUser = JSON.parse(localStorage.getItem("wanderlyUser"));
        } catch (error) {
            savedUser = null;
        }

        if (
            savedUser &&
            username === savedUser.username &&
            password === savedUser.password
        ) {
            localStorage.setItem("wanderlyLoggedIn", "true");

            alert("Login successful! Welcome to Wanderly.");
            window.location.href = "dashboard.html";

        } else {
            if (errorMessage) {
                errorMessage.textContent =
                    "Invalid username or password. Please try again.";
            }
        }
    });
}


// =====================================
// DASHBOARD SUMMARY CARDS
// =====================================

function updateDashboardSummary() {
    const trips = getSavedData("wanderlyTrips");
    const expenses = getSavedData("wanderlyExpenses");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingTrips = trips.filter(function(trip) {
        const tripDate = new Date(trip.date + "T00:00:00");

        return !isNaN(tripDate.getTime()) && tripDate >= today;
    });

    const totalExpenses = expenses.reduce(function(total, expense) {
        return total + Number(expense.amount || 0);
    }, 0);

    const totalTripsElement = document.getElementById("dashboardTotalTrips");
    const upcomingTripsElement = document.getElementById("dashboardUpcomingTrips");
    const totalExpensesElement = document.getElementById("dashboardTotalExpenses");

    if (totalTripsElement) {
        totalTripsElement.textContent = trips.length;
    }

    if (upcomingTripsElement) {
        upcomingTripsElement.textContent = upcomingTrips.length;
    }

    if (totalExpensesElement) {
        totalExpensesElement.textContent =
            "RM " + totalExpenses.toLocaleString("en-MY", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
    }
}


// =====================================
// APEXCHARTS - EXPENSE BREAKDOWN
// =====================================

function displayExpenseChart() {
    const chartElement = document.getElementById("expenseChart");

    if (!chartElement || typeof ApexCharts === "undefined") return;

    const expenses = getSavedData("wanderlyExpenses");

    const categories = [
        "Accommodation",
        "Food",
        "Transport",
        "Activities",
        "Shopping",
        "Others"
    ];

    const categoryTotals = categories.map(function(category) {
        return expenses
            .filter(function(expense) {
                return expense.category === category;
            })
            .reduce(function(total, expense) {
                return total + Number(expense.amount || 0);
            }, 0);
    });

    const totalExpenses = categoryTotals.reduce(function(total, amount) {
        return total + amount;
    }, 0);

    chartElement.innerHTML = "";

    if (totalExpenses === 0) {
        chartElement.innerHTML = `
            <p style="text-align:center; padding:40px; color:#A97878;">
                No expenses recorded yet.
            </p>
        `;
        return;
    }

    const options = {
        chart: {
            type: "donut",
            height: 350,
            fontFamily: "DM Sans, sans-serif"
        },

        series: categoryTotals,
        labels: categories,

        colors: [
            "#C98278",
            "#718C85",
            "#E5B98C",
            "#A97878",
            "#D9A7A0",
            "#B8A28D"
        ],

        legend: {
            position: "bottom",
            fontSize: "13px"
        },

        dataLabels: {
            enabled: true
        },

        plotOptions: {
            pie: {
                donut: {
                    size: "65%",
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: "Total Expenses",
                            formatter: function() {
                                return "RM " + totalExpenses.toFixed(2);
                            }
                        }
                    }
                }
            }
        },

        tooltip: {
            y: {
                formatter: function(value) {
                    return "RM " + value.toFixed(2);
                }
            }
        }
    };

    const expenseChart = new ApexCharts(chartElement, options);
    expenseChart.render();
}


// =====================================
// DASHBOARD - UPCOMING TRIPS
// =====================================

function displayDashboardTrips() {
    const tripsContainer = document.getElementById(
        "dashboardUpcomingTripsList"
    );

    if (!tripsContainer) return;

    const savedTrips = getSavedData("wanderlyTrips");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tripImages = {
        "Switzerland": "swiss.jpeg",
        "San Francisco": "san.jpeg",
        "Japan": "japan.jpg",
        "South Korea": "korea.jpg",
        "Paris": "paris.jpg",
        "London": "london.jpg",
        "Bali": "bali.jpg",
        "Italy": "italy.jpg"
    };

    const upcomingTrips = savedTrips.filter(function(trip) {
        const tripDate = new Date(trip.date + "T00:00:00");

        return !isNaN(tripDate.getTime()) && tripDate >= today;
    });

    upcomingTrips.sort(function(a, b) {
        return new Date(a.date) - new Date(b.date);
    });

    tripsContainer.innerHTML = "";

    // EMPTY MESSAGE - NO UPCOMING TRIPS
    if (upcomingTrips.length === 0) {
        tripsContainer.innerHTML = `
            <div class="no-trips-message">
                <div class="empty-trip-icon">✈</div>

                <h3>No upcoming trips yet</h3>

                <p>Start by adding your first trip in My Trips.</p>

                <p>Your saved trips will appear here automatically!</p>

                <a href="trips.html" class="add-first-trip-btn">
                    + Add Your First Trip
                </a>
            </div>
        `;

        return;
    }

    // DISPLAY SAVED TRIPS
    upcomingTrips.forEach(function(trip) {
        const tripCard = document.createElement("div");
        tripCard.classList.add("trip-card");

        const image = tripImages[trip.location];

        if (image) {
            const tripImage = document.createElement("img");
            tripImage.src = image;
            tripImage.alt = trip.location;
            tripCard.appendChild(tripImage);
        }

        const tripInfo = document.createElement("div");
        tripInfo.classList.add("trip-info");

        const status = document.createElement("span");
        status.classList.add("trip-status");
        status.textContent = "Upcoming";

        const tripName = document.createElement("h3");
        tripName.textContent = trip.name;

        const tripLocation = document.createElement("p");
        tripLocation.textContent = "📍 " + trip.location;

        const tripDate = document.createElement("p");

        const formattedDate = new Date(
            trip.date + "T00:00:00"
        ).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        tripDate.textContent = "🗓 " + formattedDate;

        tripInfo.appendChild(status);
        tripInfo.appendChild(tripName);
        tripInfo.appendChild(tripLocation);
        tripInfo.appendChild(tripDate);

        tripCard.appendChild(tripInfo);
        tripsContainer.appendChild(tripCard);
    });
}


// =====================================
// RUN WANDERLY FUNCTIONS
// =====================================

document.addEventListener("DOMContentLoaded", function() {
    setupRegister();
    setupLogin();

    updateDashboardSummary();
    displayExpenseChart();
    displayDashboardTrips();
});

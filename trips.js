
// =====================================
// WANDERLY - MY TRIPS
// FIREBASE VERSION
// =====================================

let editingTripIndex = null;
let calendarDate = new Date();
let tripChart = null;


// =====================================
// TRIP IMAGES
// =====================================

const tripImages = {
    "Switzerland": "swiss.jpeg",
    "San Francisco": "san.jpg",
    "Japan": "japan.jpg",
    "South Korea": "korea.jpg",
    "Paris": "paris.jpg",
    "London": "london.jpg",
    "Bali": "bali.jpg",
    "Italy": "italy.jpg"
};


// =====================================
// GET SAVED TRIPS
// =====================================

function getSavedTrips() {

    try {

        const savedData = localStorage.getItem("wanderlyTrips");

        const trips = savedData ? JSON.parse(savedData) : [];

        return Array.isArray(trips) ? trips : [];

    } catch (error) {

        console.error("Unable to load trips:", error);

        return [];

    }

}


// =====================================
// SAVE TRIPS TO LOCAL CACHE
// =====================================

function storeTrips(trips) {

    try {

        localStorage.setItem(
            "wanderlyTrips",
            JSON.stringify(trips)
        );

        return true;

    } catch (error) {

        console.error("Unable to save trips:", error);

        alert("Unable to save your trip.");

        return false;

    }

}


// =====================================
// LOAD TRIPS FROM FIREBASE
// =====================================

async function loadTripsFromFirebase() {

    try {

        if (!window.db) {
            throw new Error("Firebase database is not connected.");
        }

        const snapshot = await window.db
            .collection("trips")
            .get();

        // MIGRATE OLD LOCAL DATA IF FIREBASE IS EMPTY

        if (snapshot.empty) {

            const oldTrips = getSavedTrips();

            if (oldTrips.length > 0) {

                console.log("Migrating old trips to Firebase...");

                for (const trip of oldTrips) {

                    const newTrip = {
                        name: trip.name,
                        location: trip.location,
                        date: trip.date,
                        endDate: trip.endDate || trip.date,
                        createdAt: new Date().toISOString()
                    };

                    await window.db
                        .collection("trips")
                        .add(newTrip);

                }

                console.log("Old trips migrated successfully!");

                return await loadTripsFromFirebase();

            }

        }

        // GET FIREBASE DOCUMENTS

        const firebaseTrips = snapshot.docs.map(function(document) {

            return {
                firebaseId: document.id,
                ...document.data()
            };

        });

        // UPDATE LOCAL CACHE

        storeTrips(firebaseTrips);

        console.log("Trips loaded from Firebase:", firebaseTrips);

        return true;

    } catch (error) {

        console.error("Unable to load trips from Firebase:", error);

        alert(
            "Unable to load trips from Firebase. Please check your Firestore rules and connection."
        );

        return false;

    }

}


// =====================================
// GET TRIP IMAGE
// =====================================

function getTripImage(location) {

    return tripImages[location] || "trip.jpg";

}


// =====================================
// SHOW ADD TRIP FORM
// =====================================

function showTripForm() {

    const form = document.getElementById("tripForm");

    if (!form) return;

    resetTripForm();

    form.style.display = "block";

    form.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// =====================================
// RESET TRIP FORM
// =====================================

function resetTripForm() {

    const name = document.getElementById("tripName");
    const location = document.getElementById("tripLocation");
    const date = document.getElementById("tripDate");
    const endDate = document.getElementById("tripEndDate");

    if (name) name.value = "";
    if (location) location.value = "";
    if (date) date.value = "";
    if (endDate) endDate.value = "";

    editingTripIndex = null;

    const heading = document.querySelector(".trip-form h2");

    if (heading) {
        heading.textContent = "Create New Trip";
    }

    const saveButton = document.querySelector(
        ".trip-form-actions button[onclick='saveTrip()']"
    );

    if (saveButton) {
        saveButton.textContent = "Save Trip";
    }

}


// =====================================
// CANCEL TRIP FORM
// =====================================

function cancelTrip() {

    resetTripForm();

    const form = document.getElementById("tripForm");

    if (form) {
        form.style.display = "none";
    }

}


// =====================================
// TRIP STATUS
// =====================================

function getTripStatus(date, endDate = date) {

    if (!date) return "Upcoming Trip";

    const today = new Date();

    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    if (endDate < localToday) {
        return "Completed Trip";
    }

    return "Upcoming Trip";

}


// =====================================
// CALCULATE TRIP DURATION
// =====================================

function calculateTripDuration(startDate, endDate) {

    if (!startDate) return 0;

    endDate = endDate || startDate;

    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    const difference = end - start;

    return Math.floor(
        difference / (1000 * 60 * 60 * 24)
    ) + 1;

}


// =====================================
// FORMAT TRIP DATE
// =====================================

function formatTripDate(date) {

    if (!date) return "-";

    const formattedDate = new Date(date + "T00:00:00");

    return formattedDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

}


// =====================================
// DISPLAY TRIP CARDS
// =====================================

function displaySavedTrips() {

    const tripsGrid = document.getElementById("tripsGrid");

    if (!tripsGrid) {
        console.error("tripsGrid element not found!");
        return;
    }

    const savedTrips = getSavedTrips();

    tripsGrid.innerHTML = "";

    if (savedTrips.length === 0) {

        tripsGrid.innerHTML = `
            <div class="no-trips-message">
                <div class="empty-trip-icon">✈</div>
                <h3>No trips planned yet</h3>
                <p>Your travel adventures will appear here.</p>
                <p>Start planning your next getaway!</p>
            </div>
        `;

        return;

    }

    savedTrips.forEach(function(trip, index) {

        const newTrip = document.createElement("div");

        newTrip.classList.add("trip-card");

        const endDate = trip.endDate || trip.date;
        const image = getTripImage(trip.location);

        const status = getTripStatus(
            trip.date,
            endDate
        );

        const duration = calculateTripDuration(
            trip.date,
            endDate
        );

        newTrip.innerHTML = `
            <img src="${image}" alt="${trip.location}"
                 onerror="this.onerror=null; this.src='trip.jpg';">

            <div class="trip-info">

                <h3></h3>

                <p class="trip-location"></p>

                <p class="trip-dates"></p>

                <p class="trip-duration"></p>

                <span class="trip-status"></span>

                <button type="button" class="edit-trip-btn">
                    Edit Trip
                </button>

                <button type="button" class="delete-trip-btn">
                    Delete Trip
                </button>

            </div>
        `;

        newTrip.querySelector("h3").textContent =
            trip.name;

        newTrip.querySelector(".trip-location").textContent =
            "📍 " + trip.location;

        newTrip.querySelector(".trip-dates").textContent =
            "📅 " + formatTripDate(trip.date) +
            " – " + formatTripDate(endDate);

        newTrip.querySelector(".trip-duration").textContent =
            "⏳ " + duration + " days";

        newTrip.querySelector(".trip-status").textContent =
            status;

        newTrip.querySelector(".edit-trip-btn").addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                editTrip(index);

            }
        );

        newTrip.querySelector(".delete-trip-btn").addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                deleteTrip(index);

            }
        );

        newTrip.addEventListener("click", function() {

            showTripDetails(index);

        });

        tripsGrid.appendChild(newTrip);

    });

}


// =====================================
// TRIP DETAILS POPUP
// =====================================

function showTripDetails(index) {

    const savedTrips = getSavedTrips();
    const trip = savedTrips[index];

    if (!trip) return;

    const popup = document.getElementById("tripDetailsPopup");

    if (!popup) return;

    const endDate = trip.endDate || trip.date;

    const duration = calculateTripDuration(
        trip.date,
        endDate
    );

    const detailsImage = document.getElementById("detailsImage");
    const detailsName = document.getElementById("detailsName");
    const detailsLocation = document.getElementById("detailsLocation");
    const detailsDate = document.getElementById("detailsDate");
    const detailsStatus = document.getElementById("detailsStatus");
    const detailsDuration = document.getElementById("detailsDuration");

    if (detailsImage) {
        detailsImage.src = getTripImage(trip.location);
    }

    if (detailsName) {
        detailsName.textContent = trip.name;
    }

    if (detailsLocation) {
        detailsLocation.textContent = "📍 " + trip.location;
    }

    if (detailsDate) {
        detailsDate.textContent =
            "📅 " + formatTripDate(trip.date) +
            " – " + formatTripDate(endDate);
    }

    if (detailsStatus) {
        detailsStatus.textContent =
            getTripStatus(trip.date, endDate);
    }

    if (detailsDuration) {
        detailsDuration.textContent =
            "⏳ " + duration + " days";
    }

    popup.style.display = "flex";

}


// =====================================
// CLOSE TRIP DETAILS POPUP
// =====================================

function closeTripDetails() {

    const popup = document.getElementById("tripDetailsPopup");

    if (popup) {
        popup.style.display = "none";
    }

}


// =====================================
// EDIT TRIP
// =====================================

function editTrip(index) {

    const savedTrips = getSavedTrips();
    const trip = savedTrips[index];

    if (!trip) return;

    const form = document.getElementById("tripForm");

    if (!form) return;

    form.style.display = "block";

    document.getElementById("tripName").value =
        trip.name;

    document.getElementById("tripLocation").value =
        trip.location;

    document.getElementById("tripDate").value =
        trip.date;

    document.getElementById("tripEndDate").value =
        trip.endDate || trip.date;

    editingTripIndex = index;

    const heading = document.querySelector(".trip-form h2");

    if (heading) {
        heading.textContent = "Edit Trip";
    }

    const saveButton = document.querySelector(
        ".trip-form-actions button[onclick='saveTrip()']"
    );

    if (saveButton) {
        saveButton.textContent = "Update Trip";
    }

    form.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// =====================================
// UPDATE TRIP SUMMARY
// =====================================

function updateTripSummary() {

    const savedTrips = getSavedTrips();

    const upcomingTrips = savedTrips.filter(function(trip) {

        return getTripStatus(
            trip.date,
            trip.endDate || trip.date
        ) === "Upcoming Trip";

    });

    const completedTrips = savedTrips.filter(function(trip) {

        return getTripStatus(
            trip.date,
            trip.endDate || trip.date
        ) === "Completed Trip";

    });

    const totalElement =
        document.getElementById("totalTripsCount");

    const upcomingElement =
        document.getElementById("upcomingTripsCount");

    const completedElement =
        document.getElementById("completedTripsCount");

    if (totalElement) {
        totalElement.textContent = savedTrips.length;
    }

    if (upcomingElement) {
        upcomingElement.textContent = upcomingTrips.length;
    }

    if (completedElement) {
        completedElement.textContent = completedTrips.length;
    }

}


// =====================================
// TRIP STATISTICS - APEXCHARTS
// =====================================

function displayTripChart() {

    const savedTrips = getSavedTrips();

    const chartElement =
        document.querySelector("#tripStatusChart");

    if (!chartElement) {
        console.error("tripStatusChart element not found!");
        return;
    }

    if (typeof ApexCharts === "undefined") {

        chartElement.innerHTML =
            '<p class="empty-message">Chart library could not be loaded. Please check your internet connection.</p>';

        console.error("ApexCharts is not loaded!");

        return;

    }

    const upcoming = savedTrips.filter(function(trip) {

        return getTripStatus(
            trip.date,
            trip.endDate || trip.date
        ) === "Upcoming Trip";

    }).length;

    const completed = savedTrips.filter(function(trip) {

        return getTripStatus(
            trip.date,
            trip.endDate || trip.date
        ) === "Completed Trip";

    }).length;

    if (tripChart) {

        tripChart.destroy();
        tripChart = null;

    }

    chartElement.innerHTML = "";

    const options = {

        series: [{
            name: "Number of Trips",
            data: [upcoming, completed]
        }],

        chart: {
            type: "bar",
            height: 320,
            fontFamily: "DM Sans, sans-serif",
            toolbar: {
                show: false
            },
            animations: {
                enabled: true
            }
        },

        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 8,
                barHeight: "45%",
                distributed: true
            }
        },

        colors: ["#C98278", "#A97878"],

        dataLabels: {
            enabled: true,
            style: {
                fontSize: "14px",
                colors: ["#FFFFFF"]
            }
        },

        xaxis: {
            categories: [
                "Upcoming Trips",
                "Completed Trips"
            ],
            min: 0,
            tickAmount: 5,
            labels: {
                style: {
                    colors: "#92766C"
                }
            }
        },

        yaxis: {
            labels: {
                style: {
                    colors: "#665044",
                    fontSize: "13px"
                }
            }
        },

        grid: {
            borderColor: "#E8D9C8",
            strokeDashArray: 4
        },

        legend: {
            show: false
        },

        tooltip: {
            y: {
                formatter: function(value) {
                    return value + " trips";
                }
            }
        }

    };

    tripChart = new ApexCharts(
        chartElement,
        options
    );

    tripChart.render();

}


// =====================================
// SAVE OR UPDATE TRIP - FIREBASE
// =====================================

async function saveTrip() {

    const nameElement = document.getElementById("tripName");
    const locationElement = document.getElementById("tripLocation");
    const dateElement = document.getElementById("tripDate");
    const endDateElement = document.getElementById("tripEndDate");

    if (
        !nameElement ||
        !locationElement ||
        !dateElement ||
        !endDateElement
    ) {

        alert("Trip form elements could not be found!");
        return;

    }

    const name = nameElement.value.trim();
    const selectedLocation = locationElement.value;
    const date = dateElement.value;
    const endDate = endDateElement.value;

    if (!name || !selectedLocation || !date || !endDate) {

        alert("Please fill in all trip details!");
        return;

    }

    if (endDate < date) {

        alert("End date cannot be earlier than start date!");
        return;

    }

    if (!window.db) {

        alert("Firebase is not connected!");
        return;

    }

    const savedTrips = getSavedTrips();

    const isEditing = editingTripIndex !== null;

    const tripDetails = {
        name: name,
        location: selectedLocation,
        date: date,
        endDate: endDate
    };

    try {

        if (isEditing) {

            const existingTrip = savedTrips[editingTripIndex];

            if (!existingTrip) return;

            if (existingTrip.firebaseId) {

                await window.db
                    .collection("trips")
                    .doc(existingTrip.firebaseId)
                    .update(tripDetails);

                tripDetails.firebaseId = existingTrip.firebaseId;

            } else {

                const newDocument = await window.db
                    .collection("trips")
                    .add({
                        ...tripDetails,
                        createdAt: new Date().toISOString()
                    });

                tripDetails.firebaseId = newDocument.id;

            }

            savedTrips[editingTripIndex] = tripDetails;

        } else {

            const newDocument = await window.db
                .collection("trips")
                .add({
                    ...tripDetails,
                    createdAt: new Date().toISOString()
                });

            tripDetails.firebaseId = newDocument.id;

            savedTrips.push(tripDetails);

        }

        storeTrips(savedTrips);

        alert(
            isEditing
                ? "Your trip has been updated!"
                : "Your trip has been saved!"
        );

        resetTripForm();

        const form = document.getElementById("tripForm");

        if (form) {
            form.style.display = "none";
        }

        displaySavedTrips();
        updateTripSummary();
        displayTripChart();
        displayTripCalendar();

    } catch (error) {

        console.error("Error saving trip to Firebase:", error);

        alert("Unable to save trip to Firebase. Please try again.");

    }

}


// =====================================
// DELETE TRIP - FIREBASE
// =====================================

async function deleteTrip(index) {

    const confirmation = confirm(
        "Are you sure you want to delete this trip?"
    );

    if (!confirmation) return;

    const savedTrips = getSavedTrips();
    const trip = savedTrips[index];

    if (!trip) return;

    try {

        if (!window.db) {
            throw new Error("Firebase is not connected.");
        }

        if (trip.firebaseId) {

            await window.db
                .collection("trips")
                .doc(trip.firebaseId)
                .delete();

        }

        savedTrips.splice(index, 1);

        storeTrips(savedTrips);

        closeTripDetails();

        displaySavedTrips();
        updateTripSummary();
        displayTripChart();
        displayTripCalendar();

        alert("Trip deleted successfully!");

    } catch (error) {

        console.error("Error deleting trip from Firebase:", error);

        alert("Unable to delete trip from Firebase.");

    }

}


// =====================================
// TRIP CALENDAR
// =====================================

function displayTripCalendar() {

    const monthYear =
        document.getElementById("calendarMonthYear");

    const calendarDays =
        document.getElementById("calendarDays");

    if (!monthYear || !calendarDays) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(
        year,
        month,
        1
    ).getDay();

    const totalDays = new Date(
        year,
        month + 1,
        0
    ).getDate();

    monthYear.textContent =
        calendarDate.toLocaleString("en-US", {
            month: "long"
        }) + " " + year;

    calendarDays.innerHTML = "";

    // EMPTY CALENDAR CELLS

    for (let i = 0; i < firstDay; i++) {

        const emptyCell = document.createElement("div");

        emptyCell.className = "calendar-day empty";

        calendarDays.appendChild(emptyCell);

    }

    const savedTrips = getSavedTrips();

    const today = new Date();

    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    // CALENDAR DATE CELLS

    for (let day = 1; day <= totalDays; day++) {

        const currentDate = [
            year,
            String(month + 1).padStart(2, "0"),
            String(day).padStart(2, "0")
        ].join("-");

        let dayClass = "calendar-day";

        if (currentDate === todayString) {
            dayClass += " today";
        }

        const tripOnDate = savedTrips.filter(function(trip) {

            const endDate = trip.endDate || trip.date;

            return currentDate >= trip.date &&
                   currentDate <= endDate;

        });

        if (tripOnDate.length > 0) {

            const hasUpcoming = tripOnDate.some(function(trip) {

                return getTripStatus(
                    trip.date,
                    trip.endDate || trip.date
                ) === "Upcoming Trip";

            });

            dayClass += hasUpcoming
                ? " has-upcoming"
                : " has-completed";

        }

        const dayElement = document.createElement("div");

        dayElement.className = dayClass;

        dayElement.style.cursor =
            tripOnDate.length > 0 ? "pointer" : "default";

        const dayNumber = document.createElement("span");

        dayNumber.className = "day-number";
        dayNumber.textContent = day;

        dayElement.appendChild(dayNumber);

        if (tripOnDate.length > 0) {

            const tripLabel = document.createElement("div");

            tripLabel.style.fontSize = "10px";
            tripLabel.style.color = "#8F5F58";
            tripLabel.style.marginTop = "6px";
            tripLabel.style.fontWeight = "600";
            tripLabel.style.overflow = "hidden";
            tripLabel.style.textOverflow = "ellipsis";
            tripLabel.style.whiteSpace = "nowrap";

            tripLabel.textContent =
                "✈ " + tripOnDate.length + " Trip";

            dayElement.appendChild(tripLabel);

            dayElement.title = tripOnDate
                .map(function(trip) {
                    return trip.name;
                })
                .join(", ");

            dayElement.addEventListener("click", function() {

                showCalendarTripDetails(currentDate);

            });

        }

        calendarDays.appendChild(dayElement);

    }

}


// =====================================
// SHOW TRIP DETAILS FROM CALENDAR
// =====================================

function showCalendarTripDetails(selectedDate) {

    const savedTrips = getSavedTrips();

    const matchingTrips = savedTrips.filter(function(trip) {

        const endDate = trip.endDate || trip.date;

        return selectedDate >= trip.date &&
               selectedDate <= endDate;

    });

    if (matchingTrips.length === 0) return;

    const tripIndex = savedTrips.indexOf(matchingTrips[0]);

    showTripDetails(tripIndex);

}


// =====================================
// CHANGE CALENDAR MONTH
// =====================================

function changeCalendarMonth(direction) {

    calendarDate.setMonth(
        calendarDate.getMonth() + direction
    );

    displayTripCalendar();

}


// =====================================
// INITIALIZE MY TRIPS PAGE
// =====================================

window.addEventListener("DOMContentLoaded", async function() {

    // TRIP DETAILS POPUP

    const popup = document.getElementById("tripDetailsPopup");

    if (popup) {

        popup.addEventListener("click", function(event) {

            if (event.target === popup) {
                closeTripDetails();
            }

        });

    }

    // LOAD FIREBASE DATA FIRST

    const loaded = await loadTripsFromFirebase();

    if (!loaded) {
        return;
    }

    // DISPLAY PAGE CONTENT

    displaySavedTrips();

    updateTripSummary();

    displayTripChart();

    displayTripCalendar();

});


// =====================================
// LOGOUT
// =====================================

function logout() {

    localStorage.removeItem("wanderlyLoggedIn");

    window.location.href = "index.html";

}

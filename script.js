// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYcEseyPf258HJRuydrHnRG2pi19k5Me0",
  authDomain: "carbon-footprint-tracker-244fa.firebaseapp.com",
  projectId: "carbon-footprint-tracker-244fa",
  storageBucket: "carbon-footprint-tracker-244fa.appspot.com",
  messagingSenderId: "798948250054",
  appId: "1:798948250054:web:0e90f6e866a966e25ba2c7"
};

// Initialize Firebase using CDN global
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
function calculateCO2() {
  const kmDriven = document.getElementById('kmDriven').value;
  const diet = document.getElementById('diet').value;
  let co2 = 0;

  // Simple calculation logic
  if (diet === 'low') co2 = kmDriven * 0.12 + 2;
  else if (diet === 'medium') co2 = kmDriven * 0.12 + 4;
  else co2 = kmDriven * 0.12 + 7;

  document.getElementById('result').innerText = `Estimated CO2: ${co2.toFixed(2)} kg`;

  // Save entry to Firestore under user UID
  const entry = {
    date: new Date().toISOString(),
    kmDriven,
    diet,
    co2: co2.toFixed(2)
  };

  const user = auth.currentUser;
  if (user) {
    db.collection("users").doc(user.uid).set({email: user.email}, {merge: true})
      .then(() => {
        return db.collection("users").doc(user.uid).collection("history").add(entry);
      })
      .then(() => {
        showHistory();
        showStats();
        showTip(kmDriven, diet);
        showChart();
      });
  }
}

function fetchHistory(callback) {
  const user = auth.currentUser;
  if (user) {
    db.collection("users").doc(user.uid).collection("history")
      .orderBy("date", "desc")
      .get()
      .then(snapshot => {
        const history = [];
        snapshot.forEach(doc => history.push(doc.data()));
        callback(history);
      });
  }
}

function showHistory() {
  fetchHistory(history => {
    let html = '<h3>History</h3><ul>';
    history.slice(0, 5).forEach(entry => {
      const readableDate = new Date(entry.date).toLocaleString();
      html += `<li>${readableDate}: ${entry.kmDriven} km, ${entry.diet}, ${entry.co2} kg CO2</li>`;
    });
    html += '</ul>';
    document.getElementById('tip').innerHTML = html;
  });
}

function showStats() {
  fetchHistory(history => {
    const now = new Date();
    let daily = 0, weekly = 0, monthly = 0;

    history.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate.toDateString() === now.toDateString()) {
        daily += parseFloat(entry.co2);
      }
      if ((now - entryDate) / (1000 * 60 * 60 * 24) < 7) {
        weekly += parseFloat(entry.co2);
      }
      if (
        entryDate.getMonth() === now.getMonth() &&
        entryDate.getFullYear() === now.getFullYear()
      ) {
        monthly += parseFloat(entry.co2);
      }
    });

    document.getElementById('result').innerHTML =
      `Estimated CO2: ${history[0] ? history[0].co2 : '0.00'} kg<br>
      <strong>Stats:</strong>
      <br>Today: ${daily.toFixed(2)} kg
      <br>This week: ${weekly.toFixed(2)} kg
      <br>This month: ${monthly.toFixed(2)} kg`;
  });
}

function showTip(kmDriven, diet) {
  let tip = "";
  if (kmDriven > 100) {
    tip += "Consider using public transport or carpooling to reduce your travel emissions.<br>";
  } else if (kmDriven > 0) {
    tip += "Great job keeping your travel low! Walking and cycling are even better.<br>";
  }
  if (diet === "high") {
    tip += "Try reducing meat consumption for a lower carbon footprint.";
  } else if (diet === "medium") {
    tip += "Vegetarian diets are better for the planet. Consider more plant-based meals!";
  } else {
    tip += "Vegan diets have the lowest carbon impact. Keep it up!";
  }
  document.getElementById('tip').innerHTML += `<div style="margin-top:10px;"><strong>Tip:</strong> ${tip}</div>`;
}

function showChart() {
  fetchHistory(history => {
    const labels = history.map(entry => new Date(entry.date).toLocaleDateString() + " " + new Date(entry.date).toLocaleTimeString());
    const data = history.map(entry => parseFloat(entry.co2));

    const ctx = document.getElementById('co2Chart').getContext('2d');
    if (window.co2Chart && typeof window.co2Chart.destroy === 'function') {
      window.co2Chart.destroy();
    }

    window.co2Chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.reverse(),
        datasets: [{
          label: 'CO₂ Emissions (kg)',
          data: data.reverse(),
          borderColor: 'green',
          backgroundColor: 'rgba(0,128,0,0.1)',
          fill: true,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        },
        scales: {
          x: { title: { display: true, text: 'Date & Time' } },
          y: { title: { display: true, text: 'CO₂ (kg)' } }
        }
      }
    });
  });
}

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(user => {
      document.getElementById('userStatus').innerText = "Logged in as " + user.user.email;
    })
    .catch(error => {
      document.getElementById('userStatus').innerText = error.message;
    });
}

function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(user => {
      document.getElementById('userStatus').innerText = "Registered as " + user.user.email;
    })
    .catch(error => {
      document.getElementById('userStatus').innerText = error.message;
    });
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}

// Show user status on auth state change
// auth.onAuthStateChanged(user => {
//   if (user) {
//     document.getElementById('userStatus').innerText = "Logged in as " + user.email;
//   } else {
//     document.getElementById('userStatus').innerText = "Not logged in";
//   }
// });

// Show history and stats on page load
window.onload = function() {
  showHistory();
  showStats();
  showChart();
};


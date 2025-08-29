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
  const kmDriven = Number(document.getElementById('kmDriven').value);
  const diet = document.getElementById('diet').value;
  const electricity = Number(document.getElementById('electricity').value);
  const money = Number(document.getElementById('money').value);
  let co2 = 0;

  if (diet === 'low') co2 = kmDriven * 0.12 + 2;
  else if (diet === 'medium') co2 = kmDriven * 0.12 + 4;
  else co2 = kmDriven * 0.12 + 7;

  co2 += electricity * 0.85;

  document.getElementById('result').innerText = `Estimated CO2: ${co2.toFixed(2)} kg`;

  const entry = {
    date: new Date().toISOString(),
    kmDriven,
    diet,
    electricity,
    money,
    co2: co2.toFixed(2)
  };

  const user = auth.currentUser;
  if (user) {
    db.collection("users").doc(user.uid).set({email: user.email}, {merge: true})
      .then(() => {
        return db.collection("users").doc(user.uid).collection("history").add(entry);
      })
      .then(() => {
        // Calculate total CO2 for leaderboard
        db.collection("users").doc(user.uid).collection("history").get()
          .then(histSnap => {
            let totalCO2 = 0;
            histSnap.forEach(doc => {
              totalCO2 += parseFloat(doc.data().co2 || 0);
            });
            // Update leaderboard entry
            return db.collection("leaderboard").doc(user.uid).set({
              email: user.email,
              totalCO2: totalCO2
            });
          })
          .then(() => {
            showHistory();
            showStats();
            showTip(kmDriven, diet, electricity, money);
            showChart();
            showLeaderboard();
          });
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

function showTip(kmDriven, diet, electricity, money) {
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
  // Electricity usage tip
  if (electricity > 300) {
    tip += "Consider using energy-efficient appliances and reducing usage during peak hours.";
  } else if (electricity > 0) {
    tip += "Great job using electricity efficiently!";
  }
  // Money spent tip
  if (money > 100) {
    tip += "You're spending a lot on carbon-intensive goods. Consider cheaper, eco-friendly alternatives.";
  } else if (money > 0) {
    tip += "Good job being mindful of your spending!";
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
  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch((error) => {
      if (error.code === 'auth/user-not-found') {
        // Optional: automatically create user
        return firebase.auth().createUserWithEmailAndPassword(email, password)
          .then(user => {
            document.getElementById('userStatus').innerText = "Account created for " + user.user.email;
          })
          .catch(err => {
            document.getElementById('userStatus').innerText = err.message;
          });
      } else {
        document.getElementById('userStatus').innerText = error.message;
      }
    });
}

function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(user => {
      document.getElementById('userStatus').innerText = "Registration successful! Please log in.";
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
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
  showLeaderboard();
};

function showLeaderboard() {
  db.collection("leaderboard").orderBy("totalCO2", "asc").limit(10).get().then(snapshot => {
    let html = "<h3>Leaderboard (Lowest CO₂)</h3><ol>";
    snapshot.forEach(doc => {
      const data = doc.data();
      html += `<li>${data.email}: ${data.totalCO2.toFixed(2)} kg CO₂</li>`;
    });
    html += "</ol>";
    document.getElementById('leaderboard').innerHTML = html;
  });
}


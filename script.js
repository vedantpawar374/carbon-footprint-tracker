function calculateCO2() {
  const kmDriven = document.getElementById('kmDriven').value;
  const diet = document.getElementById('diet').value;
  let co2 = 0;

  // Simple calculation logic
  if (diet === 'low') co2 = kmDriven * 0.12 + 2;
  else if (diet === 'medium') co2 = kmDriven * 0.12 + 4;
  else co2 = kmDriven * 0.12 + 7;

  document.getElementById('result').innerText = `Estimated CO2: ${co2.toFixed(2)} kg`;

  // Save entry to localStorage with ISO date
  const entry = {
    date: new Date().toISOString(), // <-- ISO format
    kmDriven,
    diet,
    co2: co2.toFixed(2)
  };
  let history = JSON.parse(localStorage.getItem('history')) || [];
  history.push(entry);
  localStorage.setItem('history', JSON.stringify(history));

  showHistory();
  showStats();
  showTip(kmDriven, diet);
  showChart(); // <-- add this line
}

function showHistory() {
  let history = JSON.parse(localStorage.getItem('history')) || [];
  let html = '<h3>History</h3><ul>';
  history.slice(-5).reverse().forEach(entry => {
    // Parse ISO date and display as local string
    const readableDate = new Date(entry.date).toLocaleString();
    html += `<li>${readableDate}: ${entry.kmDriven} km, ${entry.diet}, ${entry.co2} kg CO2</li>`;
  });
  html += '</ul>';
  document.getElementById('tip').innerHTML = html;
}

function showStats() {
  const history = JSON.parse(localStorage.getItem('history')) || [];
  const now = new Date();
  let daily = 0, weekly = 0, monthly = 0;

  history.forEach(entry => {
    const entryDate = new Date(entry.date);
    // Daily
    if (entryDate.toDateString() === now.toDateString()) {
      daily += parseFloat(entry.co2);
    }
    // Weekly (last 7 days)
    if ((now - entryDate) / (1000 * 60 * 60 * 24) < 7) {
      weekly += parseFloat(entry.co2);
    }
    // Monthly (same month and year)
    if (
      entryDate.getMonth() === now.getMonth() &&
      entryDate.getFullYear() === now.getFullYear()
    ) {
      monthly += parseFloat(entry.co2);
    }
  });

  document.getElementById('result').innerHTML +=
    `<br><strong>Stats:</strong>
    <br>Today: ${daily.toFixed(2)} kg
    <br>This week: ${weekly.toFixed(2)} kg
    <br>This month: ${monthly.toFixed(2)} kg`;
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
  const history = JSON.parse(localStorage.getItem('history')) || [];
  const labels = history.map(entry => new Date(entry.date).toLocaleDateString() + " " + new Date(entry.date).toLocaleTimeString());
  const data = history.map(entry => parseFloat(entry.co2));

  const ctx = document.getElementById('co2Chart').getContext('2d');
  // Fix: Only destroy if it's a Chart instance
  if (window.co2Chart && typeof window.co2Chart.destroy === 'function') {
    window.co2Chart.destroy();
  }

  window.co2Chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'CO₂ Emissions (kg)',
        data: data,
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
}

// Show history and stats on page load
window.onload = function() {
  showHistory();
  showStats();
  showChart(); // <-- add this line
};

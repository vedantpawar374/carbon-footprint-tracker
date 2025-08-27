function calculateCO2() {
  const km = parseFloat(document.getElementById("kmDriven").value);
  const diet = document.getElementById("diet").value;

  let carEmission = km * 0.2; // 0.2 kg CO₂ per km
  let dietEmission = 0;

  if (diet === "low") dietEmission = 1;
  else if (diet === "medium") dietEmission = 3;
  else if (diet === "high") dietEmission = 5;

  const total = carEmission + dietEmission;

  document.getElementById("result").innerText = `Total CO₂: ${total.toFixed(2)} kg`;

  if (total > 10) {
    document.getElementById("tip").innerText = "🌍 Try to reduce car travel or eat more plant-based meals.";
  } else {
    document.getElementById("tip").innerText = "✅ Great job! Your carbon footprint is low.";
  }
}

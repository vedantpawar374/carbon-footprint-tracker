const firebaseConfig = {
  apiKey: "AIzaSyAYcEseyPf258HJRuydrHnRG2pi19k5Me0",
  authDomain: "carbon-footprint-tracker-244fa.firebaseapp.com",
  projectId: "carbon-footprint-tracker-244fa",
  storageBucket: "carbon-footprint-tracker-244fa.appspot.com",
  messagingSenderId: "798948250054",
  appId: "1:798948250054:web:0e90f6e866a966e25ba2c7"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(user => {
      window.location.href = "index.html";
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
      window.location.href = "index.html";
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

// Redirect to login if not authenticated
auth.onAuthStateChanged(user => {
  if (!user && window.location.pathname.endsWith("index.html")) {
    window.location.href = "login.html";
  }
});
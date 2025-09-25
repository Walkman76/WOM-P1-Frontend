const usersURL = "https://wom-p1.onrender.com/users"
//const usersURL = "http://localhost:6969/users"
const notesURL = "https://projektvisualboard.onrender.com"

const token = localStorage.getItem('token');

// === Registrera ny användare ===
async function register() {
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  try {
    const res = await fetch(`${usersURL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const contentType = res.headers.get("content-type");
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Fel vid registrering: ${res.status} - ${errText}`);
    }

    const data = contentType.includes("application/json") ? await res.json() : {};
    alert("Användare skapad!");
    console.log("Registrerad:", data);
  } catch (err) {
    console.error("Register error:", err);
    alert("Registreringsfel: " + err.message);
  }
}

// === Logga in användare ===
async function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch(`${usersURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const contentType = res.headers.get("content-type");
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Fel vid login: ${res.status} - ${errText}`);
    }

    const data = contentType.includes("application/json") ? await res.json() : {};
    if (data.token) {
      localStorage.setItem("token", data.token);
      alert("Inloggning lyckades!");
      window.location.href = "notes.html"; // byt till din "notes"-sida
    } else {
      throw new Error("Token saknas i svar");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Inloggningsfel: " + err.message);
  }
}

// === Logga ut ===
function logout() {
  localStorage.removeItem("token");
  alert("Utloggad!");
  window.location.href = "login.html"; // till login/startsida
}

function loadNotes() {
    console.log("Token being used ", token)
  fetch(`${notesURL}/notes`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(notes => {
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    notes.forEach(note => {
      const li = document.createElement('li');
      li.innerHTML = `
        <input value="${note.text}" onchange="updateNote(${note.id}, this.value)" />
        <button onclick="deleteNote(${note.id})">Ta bort</button>
      `;
      list.appendChild(li);
    });
  });
}

//Skapa notes

function createNote() {
  const token = localStorage.getItem('token');
  const text = document.getElementById('new-note').value;
  if (!text) return;

  fetch(`${notesURL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text })
  })
  .then(() => {
    document.getElementById('new-note').value = '';
    loadNotes();
  });
}

//Redigera notes

function updateNote(id, newText) {
  fetch(`${notesURL}/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text: newText })
  })
  .then(loadNotes);
}

//Ta bort notes

function deleteNote(id) {
  fetch(`${notesURL}/notes/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(loadNotes);
}
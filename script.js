// API URL:er
const usersURL = "https://wom-p1.onrender.com/users";         // Del 1
const notesURL = "https://projektvisualboard.onrender.com";    // Del 2

// AUTH

async function register() {
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  try {
    const res = await fetch(`${usersURL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const contentType = res.headers.get("content-type") || "";
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

async function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch(`${usersURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Fel vid login: ${res.status} - ${errText}`);
    }

    const data = contentType.includes("application/json") ? await res.json() : {};
    if (data.token) {
      localStorage.setItem("token", data.token);
      alert("Inloggning lyckades!");
      window.location.href = "notes.html";
    } else {
      throw new Error("Token saknas i svar");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Inloggningsfel: " + err.message);
  }
}

function logout() {
  localStorage.removeItem("token");
  alert("Utloggad!");
  window.location.href = "login.html";
}

// Hjälpfunktion för att hämta token och hantera icke-inloggad användare

function getToken() {
  const t = localStorage.getItem('token');
  if (!t) {
    alert('Du är inte inloggad.');
    window.location.href = 'login.html';
  }
  return t;
}

function escapeHtml(s='') {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Ladda boards och notes 

document.addEventListener('DOMContentLoaded', async () => {
  const onNotes = location.pathname.endsWith('/notes.html') || location.pathname.endsWith('notes.html');
  if (!onNotes) return;

  await loadBoards();
  await loadNotes();

  const sel = document.getElementById('board-select');
  if (sel) sel.addEventListener('change', loadNotes);
});

// Hämta boards som användaren får se

async function loadBoards() {
  const res = await fetch(`${notesURL}/notes/boards`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!res.ok) {
    const txt = await res.text();
    alert(`Kunde inte hämta boards: ${res.status} ${txt}`);
    return;
  }
  const boards = await res.json();
  const sel = document.getElementById('board-select');
  if (!sel) return;

  sel.innerHTML = boards.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  if (!sel.value && boards.length) sel.value = boards[0].id;
}

// Hämta notes 

async function loadNotes() {
  const token = getToken();
  const sel = document.getElementById('board-select');
  const boardId = sel ? sel.value : undefined;

  const url = boardId
    ? `${notesURL}/notes?boardId=${encodeURIComponent(boardId)}`
    : `${notesURL}/notes`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const txt = await res.text();
    alert(`Kunde inte hämta notes: ${res.status} ${txt}`);
    return;
  }
  const notes = await res.json();

  const list = document.getElementById('notes-list');
  list.innerHTML = '';
  notes.forEach(n => {
    const li = document.createElement('li');
    li.innerHTML = `
      <input value="${escapeHtml(n.content)}" onchange="updateNote('${n.id}', this.value)" />
      <button onclick="deleteNote('${n.id}')">Ta bort</button>
    `;
    list.appendChild(li);
  });
}

// Skapa note 

async function createNote() {
  const token = getToken();
  const boardId = document.getElementById('board-select')?.value;
  const content = document.getElementById('new-note').value.trim();
  if (!content) return;

  const res = await fetch(`${notesURL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ boardId, content, x: 100, y: 100, color: '#ffd972' })
  });
  if (!res.ok) {
    const txt = await res.text();
    alert(`Kunde inte skapa note: ${res.status}\n${txt}`);
    return;
  }
  document.getElementById('new-note').value = '';
  loadNotes();
}

// Uppdatera note 
async function updateNote(id, newContent) {
  const res = await fetch(`${notesURL}/notes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ content: newContent })
  });
  if (!res.ok) {
    const txt = await res.text();
    alert(`Kunde inte uppdatera note: ${res.status}\n${txt}`);
  }
}

// Ta bort note
async function deleteNote(id) {
  const res = await fetch(`${notesURL}/notes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!res.ok && res.status !== 204) {
    const txt = await res.text();
    alert(`Kunde inte radera note: ${res.status}\n${txt}`);
  }
  loadNotes();
}

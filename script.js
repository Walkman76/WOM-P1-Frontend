// API URL:er
const usersURL = "https://wom-p1.onrender.com/users";         // Del 1
const notesURL = "https://projektvisualboard.onrender.com";    // Del 2


window.onload = () => {
  fetchNotes()
}
  


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




// =Skapa en note

async function loadBoards() {
  const token = localStorage.getItem('token')
  const res = await fetch(`${apiURL}/boards`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const boards = await res.json()
  const select = document.getElementById('board-select')

  boards.forEach(board => {
    const option = document.getElementById('option')
    option.value = board._id
    option.textContent = board.title
    select.appendChild(option)
  });
}

async function fetchNotes() {
  try {
    const res = await fetch(`${notesURL}/notes`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      } 
    })

    if (!res.ok) {
      throw new Error('Kunde inte hämta notes')
    }

    const notes = await res.json()

    const notesContainer = document.getElementById('notes-container')
    notesContainer.innerHTML =''

    notes.forEach(note => {
      console.log(note.id, note.x, note.y)
      const noteDiv = document.createElement('div')
      noteDiv.className = 'note'
      noteDiv.style.backgroundColor = note.color
      noteDiv.style.position = 'absolute'
      noteDiv.style.left = note.x + 'px'
      noteDiv.style.top = note.y + 'px'
      noteDiv.textContent = note.content
      notesContainer.appendChild(noteDiv)
    })
  } catch (error) {
    console.error(error)
    alert('Fel vid hämtning av notes')
  }
}

async function createNote() {

  const boardId = document.getElementById('board-select')?.value;
  const content = document.getElementById('new-note').value.trim();
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Du är inte inloggad.');
    window.location.href = 'login.html';
    return;
  }
  if (!content) {
    alert('Skriv något först!');
    return;
  }
  
  try {

    const res = await fetch(`${notesURL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        boardId,
        content,
        x: Math.floor(Math.random() * 400) + 50,
        y: Math.floor(Math.random() * 400) + 50,
        color: '#ffd972'
      })
    })

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Kunde inte skapa note: ${res.status} - ${text}`);
    }

    alert('Note skapad!');
  } catch (err) {
    console.error('Create note error:', err);
    alert(err.message);
  }
}





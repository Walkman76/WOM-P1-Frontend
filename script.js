// API URLs
const usersURL = "https://wom-p1.onrender.com/users";         // Auth 
const notesURL = "https://projektvisualboard.onrender.com";    // Notes 


window.onload = () => {
  
  if (document.getElementById("notes-container")) {
    fetchNotes();
  }
};


async function register() {
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  try {
    const res = await fetch(`${usersURL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
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



async function loadBoards() {
  
  const select = document.getElementById("board-select");
  if (!select) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${notesURL}/boards`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      
      return;
    }

    const boards = await res.json();
   
    boards.forEach((board) => {
      const option = document.createElement("option");
      option.value = board._id || board.id || board.slug || board.title || "";
      option.textContent = board.title || board.name || option.value;
      select.appendChild(option);
    });
  } catch (e) {
    
    console.warn("Kunde inte ladda boards:", e);
  }
}
 
//Hämtar alla notes och visar dom

async function fetchNotes() {
  try {
    const res = await fetch(`${notesURL}/notes`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) {
      throw new Error("Kunde inte hämta notes");
    }

    const contentType = res.headers.get("content-type") || "";
    const notes = contentType.includes("application/json")
      ? await res.json()
      : [];

    const notesContainer = document.getElementById("notes-container");
    if (!notesContainer) return;

    notesContainer.innerHTML = "";

    notes.forEach((note) => {
      const id = note.id || note._id;

      const noteDiv = document.createElement("div");
      noteDiv.addEventListener("mousedown", startDrag);
      noteDiv.id = `note-${id}`;
      noteDiv.className = "note";
      noteDiv.style.backgroundColor = note.color || "#ffd972";
      noteDiv.style.position = "absolute";
      noteDiv.style.left = (note.x ?? 100) + "px";
      noteDiv.style.top = (note.y ?? 100) + "px";
      noteDiv.dataset.id = id;

      // Content
      const contentEl = document.createElement("div");
      contentEl.className = "note-content";
      contentEl.textContent = note.content || "";
      noteDiv.appendChild(contentEl);

      // Delete button 
      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.type = "button";
      delBtn.setAttribute("aria-label", "Radera note");
      delBtn.textContent = "×";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteNote(id);
      });
      noteDiv.appendChild(delBtn);

      notesContainer.appendChild(noteDiv);
    });
  } catch (error) {
    console.error(error);
    alert("Fel vid hämtning av notes");
  }
}

//Skapa note

async function createNote() {
  const boardId = document.getElementById("board-select")?.value;
  const content = document.getElementById("new-note").value.trim();
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Du är inte inloggad.");
    window.location.href = "login.html";
    return;
  }
  if (!content) {
    alert("Skriv något först!");
    return;
  }

  try {
    const res = await fetch(`${notesURL}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        boardId: boardId || "board-a",
        content,
        x: Math.floor(Math.random() * 400) + 50,
        y: Math.floor(Math.random() * 400) + 50,
        color: "#ffd972",
      }),
    });

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Kunde inte skapa note: ${res.status} - ${errText}`);
    }

    await fetchNotes();

    const input = document.getElementById("new-note");
    if (input) input.value = "";
    alert("Note skapad!");
  } catch (err) {
    console.error("Create note error:", err);
    alert(err.message);
  }
}

//Delet note

async function deleteNote(id) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Du är inte inloggad.");
    window.location.href = "login.html";
    return;
  }

  if (!confirm("Radera den här noten?")) return;

  try {
    const res = await fetch(`${notesURL}/notes/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok || res.status === 204) {
      // Remove from DOM
      const el = document.getElementById(`note-${id}`);
      if (el) el.remove();

    } else {
      const txt = await res.text().catch(() => "");
      throw new Error(`Kunde inte radera note: ${res.status} - ${txt}`);
    }
  } catch (err) {
    console.error("Delete note error:", err);
    alert(err.message);
  }
}

//Drag and drop

let offsetX, offsetY, draggedNote

function startDrag(e) {
  draggedNote = e.target
  offsetX = e.clientX - draggedNote.offsetLeft
  offsetY = e.clientY - draggedNote.offsetTop
  document.addEventListener("mousemove", onDrag)
  document.addEventListener("mouseup", stopDrag)
}

function onDrag(e) {
  if (!draggedNote) return
  draggedNote.style.left = `${e.clientX- offsetX}px`
  draggedNote.style.top = `${e.clientY- offsetY}px`
} 

async function stopDrag(e) {
  if(!draggedNote) return

  document.removeEventListener("mousemove", onDrag)
  document.removeEventListener("mouseup", stopDrag)

  const noteElement = draggedNote.closest('.note')
  const noteId = noteElement?.dataset.id
  const newX = parseInt(draggedNote.style.left)
  const newY = parseInt(draggedNote.style.top)

  try {
    const res = await fetch(`${notesURL}/notes/${noteId}/position`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`

      },
      body: JSON.stringify({ x: newX, y: newY })
    });
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(`Kunde inte spara position: ${res.status} - ${msg}`)
    }

    console.log(`Position sparad: ${noteId} (${newX}, ${newY})`)

    } catch (err) {
      
    }
    draggedNote = null;
  
}






















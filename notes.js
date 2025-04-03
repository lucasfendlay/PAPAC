document.addEventListener('DOMContentLoaded', function() {
    const notesContainer = document.getElementById('notes-container');
    const notesList = document.getElementById('notes-list');
    const noteInput = document.getElementById('note-input');
    const saveNoteButton = document.getElementById('save-note');
  
    let clients = JSON.parse(localStorage.getItem('clients')) || [];
    const activeUser = sessionStorage.getItem('activeUser');
  
    function getClientId() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('id');
    }
  
    function renderNotes(clientId) {
        notesList.innerHTML = '';
        const client = clients.find(c => c.id === clientId);
        if (client && client.notes) {
            console.log('Rendering notes:', client.notes); // Debugging line
            client.notes.slice().reverse().forEach((note, index) => {
                const noteDiv = document.createElement('div');
                noteDiv.className = 'note';
    
                // Ensure username is valid
                const cleanedUsername = note.username
                    ? note.username.replace('"username":', '').replace(/"/g, '').trim()
                    : 'Automated Import';
    
                noteDiv.innerHTML = `
                    <p>${note.text}</p>
                    <small>${note.timestamp} by ${cleanedUsername}</small>
                    ${note.text !== 'New screening initiated.' && note.username === activeUser ? ` <br>
                        <button class="interactive" onclick="window.editNote('${clientId}', ${client.notes.length - 1 - index})">Edit</button>
                        <button class="interactive" onclick="window.deleteNote('${clientId}', ${client.notes.length - 1 - index})">Delete</button>
                    ` : ''}
                `;
                notesList.appendChild(noteDiv);
            });
        }
    }
  
    function saveNote() {
      const clientId = getClientId();
      const noteText = noteInput.value.trim();
      if (!noteText) return;
  
      const client = clients.find(c => c.id === clientId);
      if (client) {
        if (!client.notes) {
          client.notes = [];
        }
        const timestamp = new Date().toLocaleString();
        const note = {
          text: noteText,
          timestamp: timestamp,
          username: activeUser
        };
        client.notes.push(note);
        localStorage.setItem('clients', JSON.stringify(clients));
        noteInput.value = '';
        renderNotes(clientId);
      }
    }
  
    window.editNote = function(clientId, index) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        const newNoteText = prompt('Edit your note:', client.notes[index].text);
        if (newNoteText !== null) {
          client.notes[index].text = newNoteText;
          localStorage.setItem('clients', JSON.stringify(clients));
          renderNotes(clientId);
        }
      }
    };
  
    window.deleteNote = function(clientId, index) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        const confirmDelete = confirm('Are you sure you want to delete this note? This action cannot be undone.');
        if (confirmDelete) {
          client.notes.splice(index, 1);
          localStorage.setItem('clients', JSON.stringify(clients));
          renderNotes(clientId);
        }
      }
    };
  
    saveNoteButton.addEventListener('click', saveNote);
  
    // Initial render
    const clientId = getClientId();
    renderNotes(clientId);
  });
  function updateNotes(clientId, updatedNotes) {
    const client = clients.find(c => c.id === clientId);
    if (client) {
        client.notes = updatedNotes;
        localStorage.setItem('clients', JSON.stringify(clients));
        renderNotes(clientId); // Re-render the notes container
    }
}
  
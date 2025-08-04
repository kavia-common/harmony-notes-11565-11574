import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Sidebar for folders navigation
function Sidebar({ folders, currentFolderId, onSelectFolder, onAddFolder, onDeleteFolder }) {
  // PUBLIC_INTERFACE
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="app-title">🎼 Harmony Notes</span>
        <button className="add-folder-btn" title="Add Folder" onClick={onAddFolder}>＋</button>
      </div>
      <ul className="sidebar-list">
        {folders.map(folder => (
          <li
            key={folder.id}
            className={`sidebar-item${currentFolderId === folder.id ? ' active' : ''}`}
            onClick={() => onSelectFolder(folder.id)}
          >
            <span>{folder.name}</span>
            {folder.deletable &&
              <button className="delete-folder-btn" title="Delete Folder" onClick={e => { e.stopPropagation(); onDeleteFolder(folder.id); }}>✕</button>
            }
          </li>
        ))}
      </ul>
    </aside>
  );
}

// Header bar with theme toggle and current folder title
function HeaderBar({ folderName, theme, onToggleTheme }) {
  // PUBLIC_INTERFACE
  return (
    <header className="header-bar">
      <h2>{folderName}</h2>
      <button className="theme-toggle" onClick={onToggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  );
}

// Notes list and CRUD logic
function NotesPanel({
  notes,
  onSelectNote,
  currentNoteId,
  onAddNote,
  onDeleteNote,
  onEditNote,
}) {
  // PUBLIC_INTERFACE
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleBeginEdit = (note) => {
    setEditingId(note.id);
    setEditValue(note.title);
  };
  const handleEditSave = (note) => {
    if (editValue.trim()) {
      onEditNote({ ...note, title: editValue });
      setEditingId(null);
    }
  };

  return (
    <section className="notes-panel">
      <div className="notes-header">
        <h3>Notes</h3>
        <button className="add-note-btn" title="Add note" onClick={onAddNote}>＋</button>
      </div>
      <ul className="notes-list">
        {notes.length === 0 && (
          <li className="notes-empty">No notes in this folder.</li>
        )}
        {notes.map(note => (
          <li
            key={note.id}
            className={`note-list-item${currentNoteId === note.id ? " selected" : ""}`}
            onClick={() => onSelectNote(note.id)}
          >
            {editingId === note.id ? (
              <span className="note-title-edit-container">
                <input
                  className="note-title-edit"
                  value={editValue}
                  autoFocus
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => handleEditSave(note)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleEditSave(note);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  maxLength={32}
                />
                <button className="note-title-save" onClick={e => {e.stopPropagation(); handleEditSave(note);}}>💾</button>
                <button className="note-title-cancel" onClick={e => {e.stopPropagation(); setEditingId(null);}}>✕</button>
              </span>
            ) : (
              <>
                <span className="note-title" tabIndex={0}>{note.title}</span>
                <span>
                  <button className="edit-note-btn" title="Edit" onClick={e => { e.stopPropagation(); handleBeginEdit(note); }}>✎</button>
                  <button className="delete-note-btn" title="Delete" onClick={e => { e.stopPropagation(); onDeleteNote(note.id); }}>🗑️</button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// Editor for note body/content
function NoteEditor({ note, onUpdate }) {
  // PUBLIC_INTERFACE
  const [body, setBody] = useState(note ? note.body : '');
  useEffect(() => {
    setBody(note ? note.body : '');
  }, [note]);
  if (!note) {
    return (
      <div className="note-editor-empty">
        <span>Select or create a note to begin editing.</span>
      </div>
    );
  }
  return (
    <div className="note-editor">
      <textarea
        value={body}
        className="note-editor-textarea"
        placeholder="Write your note here..."
        onChange={e => {
          setBody(e.target.value);
          onUpdate({ ...note, body: e.target.value });
        }}
      />
    </div>
  );
}

// Bottom music player
function MusicPlayer({ audios, currentTrackIndex, isPlaying, onPlayPause, onPrev, onNext, onSeek, onSetVolume, volume }) {
  // PUBLIC_INTERFACE
  const audioRef = useRef(null);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(() => {}); // ignore promise errors (autoplay policy)
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex, volume]);
  const track = audios[currentTrackIndex] || null;

  return (
    <div className="music-player">
      <audio
        ref={audioRef}
        src={track ? track.src : ''}
        onEnded={onNext}
        style={{ display: 'none' }}
      />
      <div className="music-controls">
        <button onClick={onPrev} className="music-player-btn" title="Prev" disabled={currentTrackIndex === 0}>⏮️</button>
        <button onClick={onPlayPause} className="music-player-btn" title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button onClick={onNext} className="music-player-btn" title="Next" disabled={currentTrackIndex === audios.length - 1}>⏭️</button>
        <span className="music-title">{track ? track.title : 'No music'}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          className="music-volume-slider"
          onChange={e => onSetVolume(Number(e.target.value))}
          title="Volume"
          style={{ marginLeft: 12 }}
        />
      </div>
    </div>
  );
}

// The main layout
// Main app state & logic
// PUBLIC_INTERFACE
function App() {
  // Theme state
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const handleToggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // Folder state
  const [folders, setFolders] = useState([
    { id: 'all', name: 'All Notes', deletable: false },
    { id: 'default', name: 'My Notes', deletable: false },
  ]);
  const [currentFolderId, setCurrentFolderId] = useState('default');

  // Notes state
  const [notes, setNotes] = useState([
    // Example: { id: '1', folderId: 'default', title: 'First Note', body: 'Welcome to Harmony Notes!' }
  ]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  // Music state
  const audioSamples = [
    {
      title: 'Calm Vibes',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    },
    {
      title: 'Jazz Loop',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
    },
    {
      title: 'Ambient Flow',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
    },
  ];
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Derived filtered notes by folder
  const displayNotes = currentFolderId === 'all'
    ? notes
    : notes.filter(n => n.folderId === currentFolderId);

  // note: setSelectedNoteId('...') selects a note for editing

  // ==== CRUD for folders ====
  // PUBLIC_INTERFACE
  const handleAddFolder = () => {
    let name = prompt('Folder name');
    if (!name) return;
    name = name.trim().slice(0, 28);
    if (name && !folders.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      const id = Date.now().toString();
      setFolders([...folders, { id, name, deletable: true }]);
      setCurrentFolderId(id);
    }
  };
  // PUBLIC_INTERFACE
  const handleDeleteFolder = id => {
    if (!window.confirm('Delete this folder and all its notes?')) return;
    setFolders(folders.filter(f => f.id !== id));
    setNotes(notes.filter(n => n.folderId !== id));
    if (currentFolderId === id) {
      setCurrentFolderId('default');
      setSelectedNoteId(null);
    }
  };
  // PUBLIC_INTERFACE
  const handleSelectFolder = id => {
    setCurrentFolderId(id);
    setSelectedNoteId(null);
  };

  // ==== CRUD for notes ====
  // PUBLIC_INTERFACE
  const handleAddNote = () => {
    const title = prompt('Note title') || 'Untitled';
    if (!currentFolderId || currentFolderId === 'all') return;
    const id = Date.now().toString();
    const folderId = currentFolderId || 'default';
    setNotes([{ id, folderId, title: title.slice(0, 32), body: '' }, ...notes]);
    setSelectedNoteId(id);
  };
  // PUBLIC_INTERFACE
  const handleDeleteNote = id => {
    setNotes(notes.filter(note => note.id !== id));
    if (selectedNoteId === id) setSelectedNoteId(null);
  };
  // PUBLIC_INTERFACE
  const handleEditNote = updatedNote => {
    setNotes(notes.map(note => note.id === updatedNote.id ? { ...note, ...updatedNote } : note));
  };
  // PUBLIC_INTERFACE
  const handleSelectNote = id => {
    setSelectedNoteId(id);
  };
  // PUBLIC_INTERFACE
  const handleNoteBodyUpdate = updatedNote => {
    setNotes(notes.map(note => note.id === updatedNote.id ? { ...note, body: updatedNote.body } : note));
  };

  // ==== Music Player logic ====
  // PUBLIC_INTERFACE
  const handlePlayPause = () => setIsPlaying(p => !p);
  // PUBLIC_INTERFACE
  const handlePrev = () => setCurrentTrackIndex(i => i > 0 ? i - 1 : 0);
  // PUBLIC_INTERFACE
  const handleNext = () => setCurrentTrackIndex(i => i < audioSamples.length - 1 ? i + 1 : i);
  // PUBLIC_INTERFACE
  const handleSetVolume = v => setVolume(v);

  // Find current folder display name
  const folderName = folders.find(f => f.id === currentFolderId)?.name || "";

  // Find selected note
  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <div className="notes-main-app">
      <Sidebar
        folders={folders}
        currentFolderId={currentFolderId}
        onSelectFolder={handleSelectFolder}
        onAddFolder={handleAddFolder}
        onDeleteFolder={handleDeleteFolder}
      />
      <div className="main-panel">
        <HeaderBar folderName={folderName} theme={theme} onToggleTheme={handleToggleTheme} />
        <div className="app-content">
          <NotesPanel
            notes={displayNotes}
            onSelectNote={handleSelectNote}
            currentNoteId={selectedNoteId}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onEditNote={handleEditNote}
          />
          <NoteEditor note={selectedNote} onUpdate={handleNoteBodyUpdate} />
        </div>
        <MusicPlayer
          audios={audioSamples}
          currentTrackIndex={currentTrackIndex}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onPrev={handlePrev}
          onNext={handleNext}
          onSetVolume={handleSetVolume}
          volume={volume}
        />
      </div>
    </div>
  );
}

export default App;

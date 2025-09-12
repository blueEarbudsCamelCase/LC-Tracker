import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';

function Dashboard({ onLogout }) {
  return (
    <div>
      <h2>Welcome to LC Tracker</h2>
      <nav>
        <Link to="/manage">Manage Students/Zones</Link> |{' '}
        <button onClick={onLogout}>Logout</button>
      </nav>
      <hr />
      {/* Dashboard content goes here */}
      <p>Dashboard coming soon...</p>
    </div>
  );
}

function Manage({ token }) {
  const [students, setStudents] = useState([]);
  const [zones, setZones] = useState([]);
  const [newStudent, setNewStudent] = useState('');
  const [newZone, setNewZone] = useState('');
  const [zoneCategory, setZoneCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch students and zones on mount
  React.useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch('/api/students', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/zones', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ])
      .then(([studentsData, zonesData]) => {
        setStudents(studentsData);
        setZones(zonesData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  // Add student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newStudent }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudents([...students, data]);
        setNewStudent('');
      } else {
        setError(data.error || 'Could not add student');
      }
    } catch {
      setError('Network error');
    }
  };

  // Add zone
  const handleAddZone = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newZone, category: zoneCategory }),
      });
      const data = await res.json();
      if (res.ok) {
        setZones([...zones, data]);
        setNewZone('');
        setZoneCategory('');
      } else {
        setError(data.error || 'Could not add zone');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <div>
      <nav>
        <Link to="/">Dashboard</Link>
      </nav>
      <h3>Manage Students</h3>
      {loading ? <p>Loading...</p> : (
        <ul>
          {students.map(s => <li key={s.id}>{s.name}</li>)}
        </ul>
      )}
      <form onSubmit={handleAddStudent}>
        <input
          type="text"
          placeholder="Add student name"
          value={newStudent}
          onChange={e => setNewStudent(e.target.value)}
        />
        <button type="submit">Add Student</button>
      </form>
      <h3>Manage Zones</h3>
      <ul>
        {zones.map(z => <li key={z.id}>{z.name} {z.category && `(${z.category})`}</li>)}
      </ul>
      <form onSubmit={handleAddZone}>
        <input
          type="text"
          placeholder="Zone name"
          value={newZone}
          onChange={e => setNewZone(e.target.value)}
        />
        <input
          type="text"
          placeholder="Category (optional)"
          value={zoneCategory}
          onChange={e => setZoneCategory(e.target.value)}
        />
        <button type="submit">Add Zone</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

function Auth({ onAuth, showRegister, setShowRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onAuth(data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, school_name: schoolName }),
      });
      const data = await res.json();
      if (res.ok) {
        onAuth(data.token);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <div className="App">
      <h2>LC Tracker {showRegister ? 'Registration' : 'Login'}</h2>
      <form onSubmit={showRegister ? handleRegister : handleLogin}>
        <input
          type="email"
          placeholder="School Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        /><br />
        {showRegister && (
          <>
            <input
              type="text"
              placeholder="School Name"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              required
            /><br />
          </>
        )}
        <button type="submit">{showRegister ? 'Register' : 'Login'}</button>
      </form>
      <button onClick={() => { setShowRegister(!showRegister); setError(''); }}>
        {showRegister ? 'Back to Login' : 'Register School'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [showRegister, setShowRegister] = useState(false);

  const handleAuth = (token) => {
    setToken(token);
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  if (!token) {
    return <Auth onAuth={handleAuth} showRegister={showRegister} setShowRegister={setShowRegister} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
        <Route path="/manage" element={<Manage token={token} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

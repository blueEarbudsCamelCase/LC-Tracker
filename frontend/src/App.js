import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';

// Dashboard: Entry logging form
function Dashboard({ onLogout, token }) {
  const [students, setStudents] = useState([]);
  const [zones, setZones] = useState([]);
  // Set today's date in YYYY-MM-DD format
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    day: '',
    date: today,
    period: '',
    student_id: '',
    type: '',
    zone_id: '',
    zone_detail: '',
    action: '',
    notes: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load students and zones for dropdowns
  React.useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch('/api/students', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/zones', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([studentsData, zonesData]) => {
      setStudents(studentsData);
      setZones(zonesData);
    });
  }, [token]);

  // Remove date field from the form UI and always send today's date
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value, date: today });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Entry logged!');
        setForm({
          day: '',
          date: today,
          period: '',
          student_id: '',
          type: '',
          zone_id: '',
          zone_detail: '',
          action: '',
          notes: '',
        });
      } else {
        setError(data.error || 'Could not log entry');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <div>
      <h2>LC Tracker - Log Entry</h2>
      <nav>
        <Link to="/manage">Manage Students/Zones</Link> |{' '}
        <Link to="/data">View Data</Link> |{' '}
        <button onClick={onLogout}>Logout</button>
      </nav>
      <hr />
      <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto', textAlign: 'left' }}>
        <label>
          Day:
          <select name="day" value={form.day} onChange={handleChange} required>
            <option value="">Select</option>
            <option>Monday</option>
            <option>Tuesday</option>
            <option>Wednesday</option>
            <option>Thursday</option>
            <option>Friday</option>
          </select>
        </label>
        <br />
        {/* Date field removed */}
        <label>
          Period:
          <select name="period" value={form.period} onChange={handleChange} required>
            <option value="">Select</option>
            {[4,5,6,7,8].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <br />
        <label>
          Student:
          <select name="student_id" value={form.student_id} onChange={handleChange} required>
            <option value="">Select</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <br />
        <label>
          Type:
          <select name="type" value={form.type} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Class">Class</option>
            <option value="Study">Study</option>
          </select>
        </label>
        <br />
        <label>
          Zone:
          <select name="zone_id" value={form.zone_id} onChange={handleChange} required>
            <option value="">Select</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </label>
        <br />
        <label>
          Zone Detail:
          <input type="text" name="zone_detail" value={form.zone_detail} onChange={handleChange} />
        </label>
        <br />
        <label>
          Action:
          <select name="action" value={form.action} onChange={handleChange} required>
            <option value="">Select</option>
            <option>Self-Directed</option>
            <option>Coached</option>
            <option>Redirected</option>
            <option>Conduct 1</option>
            <option>Conduct 2</option>
            <option>Conduct 3</option>
            <option>Need Attention</option>
          </select>
        </label>
        <br />
        <label>
          Notes:
          <input type="text" name="notes" value={form.notes} onChange={handleChange} />
        </label>
        <br />
        <button type="submit">Log Entry</button>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

// Data: Table view of all entries
function Data({ token }) {
  const [entries, setEntries] = useState([]);
  const [students, setStudents] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/entries', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/students', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/zones', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ])
      .then(([entriesData, studentsData, zonesData]) => {
        setEntries(entriesData);
        setStudents(studentsData);
        setZones(zonesData);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load data');
        setLoading(false);
      });
  }, [token]);

  // Helper to get student/zone names
  const getStudentName = id => students.find(s => s.id === id)?.name || id;
  const getZoneName = id => zones.find(z => z.id === id)?.name || id;

  return (
    <div>
      <h2>LC Tracker - Data Table</h2>
      <nav>
        <Link to="/">Log Entry</Link> |{' '}
        <Link to="/manage">Manage Students/Zones</Link>
      </nav>
      <hr />
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table border="1" cellPadding="4" style={{ margin: '0 auto', minWidth: 900 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Period</th>
                <th>Student</th>
                <th>Type</th>
                <th>Zone</th>
                <th>Zone Detail</th>
                <th>Action</th>
                <th>Notes</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td>{e.day}</td>
                  <td>{e.period}</td>
                  <td>{getStudentName(e.student_id)}</td>
                  <td>{e.type}</td>
                  <td>{getZoneName(e.zone_id)}</td>
                  <td>{e.zone_detail}</td>
                  <td>{e.action}</td>
                  <td>{e.notes}</td>
                  <td>{e.timestamp && new Date(e.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Manage: Students and Zones (unchanged)
function Manage({ token }) {
  const [students, setStudents] = useState([]);
  const [zones, setZones] = useState([]);
  const [newStudent, setNewStudent] = useState('');
  const [newZone, setNewZone] = useState('');
  const [zoneCategory, setZoneCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        <Link to="/">Log Entry</Link> |{' '}
        <Link to="/data">View Data</Link>
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

// Auth (unchanged)
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
        <Route path="/" element={<Dashboard onLogout={handleLogout} token={token} />} />
        <Route path="/manage" element={<Manage token={token} />} />
        <Route path="/data" element={<Data token={token} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

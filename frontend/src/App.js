import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

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
        setToken(data.token);
        localStorage.setItem('token', data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
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
        setToken(data.token);
        localStorage.setItem('token', data.token);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    setStudents([]);
  };

  // Fetch students after login
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/students', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  // Add a new student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.trim()) return;
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
    } catch (err) {
      setError('Network error');
    }
  };

  if (!token) {
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
        {error && <p style={{color: 'red'}}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="App">
      <h2>Welcome to LC Tracker</h2>
      <button onClick={handleLogout}>Logout</button>
      <hr />
      <h3>Students</h3>
      {loading ? (
        <p>Loading students...</p>
      ) : (
        <ul>
          {students.map(s => (
            <li key={s.id}>{s.name}</li>
          ))}
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
      {error && <p style={{color: 'red'}}>{error}</p>}
      {/* Next: Add zone management, entry form, and dashboard */}
    </div>
  );
}

export default App;

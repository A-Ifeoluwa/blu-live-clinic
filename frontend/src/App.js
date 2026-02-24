import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = "http://backend-url-blu-live-clinic.apps.lab.ocp.bludive/api";

const doctorPhotos = {
  "Faith Bitrus": "https://lh3.googleusercontent.com/d/140WAJOrcnvvZlj9Wb5WYXz1tj7vwWj8E", 
  "Jonah Irande": "https://lh3.googleusercontent.com/d/1nbqutYXkbCL7ZS43ifUEUTr_fbboVY7l",
  "Oluwatosin Daniel": "https://lh3.googleusercontent.com/d/1P0dxXfDuOyA1Qel5NGGXHhjvDDhVVqkk",
  "admin": "https://cdn-icons-png.flaticon.com/512/6024/6024190.png"
};

const healthTips = [
  { title: "Stay Hydrated", text: "Drinking at least 8 glasses of water daily helps maintain energy levels and skin health." },
  { title: "Rest Well", text: "Aim for 7-9 hours of sleep to allow your body to repair tissues and consolidate memory." },
  { title: "Move More", text: "Just 30 minutes of brisk walking can significantly improve cardiovascular health." },
  { title: "Fiber First", text: "Adding more greens and whole grains to your diet aids digestion and stabilizes blood sugar." }
];

function App() {
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [view, setView] = useState('landing'); 
  const [loginErr, setLoginErr] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const [regData, setRegData] = useState({ username: '', password: '', age: 'Adult (20-64)', location: '', symptoms: '' });

  const theme = { primary: '#1e40af', secondary: '#3b82f6', accent: '#10b981', danger: '#ef4444', bg: '#f8fafc', textDark: '#1e293b' };

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get(`${API}/patients`);
      setPatients(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 5000); 
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3000);
  };

  // --- UPDATED MEDICAL REPORT EXPORT ---
  const exportPatientReceipt = (p) => {
    const date = new Date().toLocaleDateString('en-GB'); // Format: DD/MM/YYYY
    const reportTemplate = `
==========================================
        BLUCLINIC MEDICAL REPORT
==========================================
Date: ${date}
Patient Name: ${p.username}
Age Group: ${p.age}
Location: ${p.location}
------------------------------------------
Attending Doctor: Dr. ${p.assignedDoctor || 'N/A'}
------------------------------------------
SYMPTOMS REPORTED:
${p.symptoms}

DIAGNOSIS:
${p.diagnosis || 'Pending Assessment'}

PRESCRIPTION:
${p.prescription || 'N/A'}
------------------------------------------
This is a computer-generated medical record.
==========================================`;

    const file = new Blob([reportTemplate], {type: 'text/plain'});
    const element = document.createElement("a");
    element.href = URL.createObjectURL(file);
    element.download = `Medical_Report_${p.username}.txt`;
    element.click();
    showToast("Professional Report Downloaded");
  };

  const downloadCSV = () => {
    const headers = "Patient,Age,Location,Status,Doctor,Diagnosis\n";
    const rows = patients.map(p => `${p.username},${p.age},${p.location},${p.status},${p.assignedDoctor || 'N/A'},${p.diagnosis || 'N/A'}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BluClinic_Activities.csv';
    a.click();
  };

  const resetPassword = async (id) => {
    const newPass = prompt("Enter new password for patient:");
    if (!newPass) return;
    try {
      await axios.put(`${API}/patients/${id}`, { password: newPass });
      showToast("Password Reset Successfully");
      loadData(true);
    } catch (err) { showToast("Reset Failed", "danger"); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/register`, regData);
      showToast("Consultation Submitted!");
      setView('login');
    } catch (err) { showToast("Error connecting to server", "danger"); }
  };

  const handleLogin = () => {
    const name = document.getElementById('l-name').value;
    const pass = document.getElementById('l-pass').value;
    if (name === 'admin' && pass === 'p@ssw0rd') return setUser({ name: 'admin', role: 'admin' });
    const doctors = ['Jonah Irande', 'Oluwatosin Daniel', 'Faith Bitrus'];
    if (doctors.includes(name) && pass === 'p@ssw0rd') return setUser({ name: name, role: 'doctor' });
    const found = patients.find(p => p.username === name && p.password === pass);
    if (found) { setUser({ name: found.username, role: 'patient' }); setLoginErr(""); } 
    else { setLoginErr("Invalid Credentials"); }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: theme.bg }}><div className="spinner"></div><style>{`.spinner{width:40px;height:40px;border:4px solid #ddd;border-top-color:${theme.primary};border-radius:50%;animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style></div>;

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {toast.show && <div style={{ position: 'fixed', top: 20, right: 20, background: toast.type==='success'?theme.accent:theme.danger, color:'white', padding:'12px 24px', borderRadius:8, zIndex:1000 }}>{toast.msg}</div>}

      <nav style={{ background: 'white', padding: '0 5%', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setView('landing')}>
          <div style={{ background: theme.primary, width: 35, height: 35, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>B</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>BLUCLINIC+</h2>
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <img src={doctorPhotos[user.name] || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="User" style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${theme.primary}`, objectFit: 'cover' }} />
            <span style={{ fontWeight: 600 }}>{user.name}</span>
            <button onClick={() => {setUser(null); setView('landing');}} style={{ background: '#fef2f2', color: theme.danger, border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Sign Out</button>
          </div>
        )}
      </nav>

      <main style={{ padding: '40px 5%' }}>
        
        {!user && view === 'landing' && (
          <div style={{ maxWidth: '1000px', margin: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h1 style={{ fontSize: '60px', fontWeight: 900, marginBottom: '20px' }}>Your Health, <span style={{color: theme.secondary}}>Simplified.</span></h1>
                <p style={{ fontSize: '20px', color: '#64748b', marginBottom: '40px' }}>Professional medical care and records at your fingertips.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                    <button onClick={() => setView('register')} style={{ padding: '18px 36px', background: theme.primary, color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Start Consultation</button>
                    <button onClick={() => setView('login')} style={{ padding: '18px 36px', background: 'white', color: theme.primary, border: `2px solid ${theme.primary}`, borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Patient Login</button>
                    <button onClick={() => setView('login')} style={{ padding: '18px 36px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Staff Portal</button>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {healthTips.map((tip, i) => (
                    <div key={i} style={{ background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ color: theme.primary, marginTop: 0 }}>{tip.title}</h4>
                        <p style={{ fontSize: '14px', margin: 0, color: '#64748b' }}>{tip.text}</p>
                    </div>
                ))}
            </div>
          </div>
        )}

        {!user && view === 'register' && (
          <div style={{ maxWidth: 550, margin: 'auto', background: 'white', padding: 40, borderRadius: 24, boxShadow: '0 20px 25px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginBottom: '25px' }}>New Consultation</h2>
            <form onSubmit={handleRegister} style={{ display: 'grid', gap: 18 }}>
              <input placeholder="Full Name" required style={{ padding: 14, borderRadius: 12, border: '1px solid #ddd' }} onChange={e => setRegData({...regData, username: e.target.value})} />
              <input type="password" placeholder="Password" required style={{ padding: 14, borderRadius: 12, border: '1px solid #ddd' }} onChange={e => setRegData({...regData, password: e.target.value})} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <select style={{ padding: 14, borderRadius: 12, border: '1px solid #ddd' }} onChange={e => setRegData({...regData, age: e.target.value})}>
                  <option value="Infant (0-2)">Infant (0-2)</option>
                  <option value="Child (3-12)">Child (3-12)</option>
                  <option value="Teenager (13-19)">Teenager (13-19)</option>
                  <option value="Adult (20-64)" selected>Adult (20-64)</option>
                  <option value="Senior (65+)">Senior (65+)</option>
                </select>
                <input placeholder="Location" required style={{ padding: 14, borderRadius: 12, border: '1px solid #ddd' }} onChange={e => setRegData({...regData, location: e.target.value})} />
              </div>
              <textarea placeholder="Describe your symptoms..." required style={{ padding: 14, borderRadius: 12, border: '1px solid #ddd', height: 120 }} onChange={e => setRegData({...regData, symptoms: e.target.value})} />
              <button type="submit" style={{ padding: 18, background: theme.accent, color: 'white', border: 'none', borderRadius: 12, fontWeight: 'bold' }}>Submit Consultation</button>
              <p onClick={() => setView('landing')} style={{ textAlign: 'center', color: '#64748b', cursor: 'pointer' }}>Cancel</p>
            </form>
          </div>
        )}

        {!user && view === 'login' && (
          <div style={{ maxWidth: 400, margin: 'auto', background: 'white', padding: 40, borderRadius: 24, boxShadow: '0 20px 25px rgba(0,0,0,0.05)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: 25 }}>Access Portal</h2>
            <div style={{ display: 'grid', gap: 15 }}>
                <input id="l-name" placeholder="Name" style={{ padding: 14, borderRadius: 12, border: '1px solid #ddd' }} />
                <input id="l-pass" type="password" placeholder="Password" style={{ padding: 14, borderRadius: 12, border: '1px solid #ddd' }} />
                <button onClick={handleLogin} style={{ padding: 16, background: theme.primary, color: 'white', border: 'none', borderRadius: 12, fontWeight: '700' }}>Login</button>
                <p onClick={() => setView('landing')} style={{ textAlign: 'center', color: theme.secondary, cursor: 'pointer' }}>Back</p>
            </div>
          </div>
        )}

        {/* ADMIN VIEW */}
        {user?.role === 'admin' && (
            <div style={{ maxWidth: 1100, margin: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                    <h1>Triage Dashboard</h1>
                    <button onClick={downloadCSV} style={{ background: theme.accent, color: 'white', padding: '12px 24px', borderRadius: 10 }}>Export Activities</button>
                </div>
                <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ padding: 15, borderBottom: '1px solid #eee' }}><input placeholder="Search..." style={{ padding: 10, width: 300, borderRadius: 8 }} onChange={e => setSearchTerm(e.target.value)} /></div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: 20, textAlign: 'left' }}>Patient</th><th style={{ padding: 20, textAlign: 'left' }}>Doctor</th><th style={{ padding: 20, textAlign: 'left' }}>Actions</th></tr></thead>
                        <tbody>
                            {patients.filter(p => p.username.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                <tr key={p._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: 20 }}>{p.username}<br/><small>{p.age}</small></td>
                                    <td style={{ padding: 20 }}>
                                        {p.status === 'Pending' ? (
                                            <select style={{ padding: 8 }} onChange={e => axios.put(`${API}/assign`, { patientId: p._id, doctorName: e.target.value }).then(() => loadData(true))}>
                                                <option>Assign...</option><option value="Jonah Irande">Dr. Jonah</option><option value="Oluwatosin Daniel">Dr. Daniel</option><option value="Faith Bitrus">Dr. Faith</option>
                                            </select>
                                        ) : p.assignedDoctor}
                                    </td>
                                    <td style={{ padding: 20 }}>
                                        <button onClick={() => resetPassword(p._id)} style={{ color: theme.primary, border: 'none', background: 'none', cursor: 'pointer', marginRight: 10 }}>Reset</button>
                                        <button onClick={() => axios.delete(`${API}/patients/${p._id}`).then(() => loadData(true))} style={{ color: theme.danger, border: 'none', background: 'none' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* DOCTOR VIEW */}
        {user?.role === 'doctor' && (
            <div style={{ maxWidth: 900, margin: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
                     <img src={doctorPhotos[user.name]} alt="Doc" style={{ width: 100, height: 100, borderRadius: 25, objectFit: 'cover' }} />
                     <div><h1>Dr. {user.name}</h1><p>Medical Center</p></div>
                </div>
                <h3>Active Consultations</h3>
                {patients.filter(p => p.assignedDoctor === user.name && p.status === 'Assigned').map(p => (
                    <div key={p._id} style={{ background: 'white', padding: 25, borderRadius: 24, marginBottom: 20, border: '1px solid #e2e8f0' }}>
                        <h4>{p.username} ({p.age})</h4>
                        <p><strong>Symptoms:</strong> {p.symptoms}</p>
                        <input id={`diag-${p._id}`} placeholder="Diagnosis" style={{ width: '100%', padding: 12, marginBottom: 10 }} />
                        <textarea id={`pres-${p._id}`} placeholder="Prescription" style={{ width: '100%', padding: 12, marginBottom: 10 }} />
                        <button onClick={async () => {
                             const d = document.getElementById(`diag-${p._id}`).value;
                             const pr = document.getElementById(`pres-${p._id}`).value;
                             await axios.put(`${API}/diagnose`, { patientId: p._id, diagnosis: d, prescription: pr });
                             loadData(true); showToast("Consultation Saved");
                        }} style={{ background: theme.primary, color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8 }}>Finalize Consultation</button>
                    </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 }}>
                    <h3>History</h3>
                    <input placeholder="Search History..." style={{ padding: 10, borderRadius: 8 }} onChange={e => setHistorySearch(e.target.value)} />
                </div>
                <div style={{ background: 'white', borderRadius: 20, marginTop: 15 }}>
                    {patients.filter(p => p.assignedDoctor === user.name && p.status === 'Completed' && p.username.toLowerCase().includes(historySearch.toLowerCase())).map(p => (
                        <div key={p._id} style={{ padding: 15, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{p.username} - {p.diagnosis}</span>
                            <button onClick={() => exportPatientReceipt(p)} style={{ color: theme.primary, border: 'none', background: 'none', cursor: 'pointer' }}>Download Report</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* PATIENT VIEW */}
        {user?.role === 'patient' && (
            <div style={{ maxWidth: 850, margin: 'auto' }}>
                <h1>Medical Records</h1>
                {patients.filter(p => p.username === user.name).map(p => (
                    <div key={p._id} style={{ background: 'white', padding: 30, borderRadius: 24, marginBottom: 25, border: '1px solid #edf2f7' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                            <strong>Status: {p.status}</strong>
                            {p.status === 'Completed' && <button onClick={() => exportPatientReceipt(p)} style={{ background: theme.primary, color: 'white', padding: '10px 20px', borderRadius: 10 }}>Get Report</button>}
                        </div>
                        <p><strong>Reported:</strong> {p.symptoms}</p>
                        {p.status === 'Completed' && <div style={{ borderTop: '1px solid #eee', paddingTop: 10 }}><p><strong>Doctor Assessment:</strong> {p.diagnosis}</p></div>}
                    </div>
                ))}
            </div>
        )}

      </main>
    </div>
  );
}

export default App;
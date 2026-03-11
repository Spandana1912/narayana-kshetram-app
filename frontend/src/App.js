import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import './App.css'; // We will create this for the new theme styles

const API_BASE = "https://temple-backend-pjy8.onrender.com";

function App() {
  const webcamRef = useRef(null);

  // States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const [details, setDetails] = useState({ token: '', gender: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(true);

  // Camera State
  const [facingMode, setFacingMode] = useState("environment");

  // View States
  const [viewingTokens, setViewingTokens] = useState(null); // 'Male' | 'Female' | null
  const [tokensData, setTokensData] = useState([]);

  const [viewingMissing, setViewingMissing] = useState(null); // 'Male' | 'Female' | null
  const [missingTokensData, setMissingTokensData] = useState([]);

  // Image Lightbox State
  const [viewingImage, setViewingImage] = useState(null);

  // Custom UI Dialog State
  const [customDialog, setCustomDialog] = useState(null); // { type: 'alert' | 'confirm', message: string, onConfirm?: () => void }

  // Load default selection
  useEffect(() => {
    const savedGender = localStorage.getItem("gender");
    const savedType = localStorage.getItem("type");
    if (savedGender && savedType) {
      setDetails(prev => ({ ...prev, gender: savedGender, type: savedType }));
      setShowSetup(false);
    }
  }, []);

  /* ================= ACTION HANDLERS ================= */

  const handleCapture = async () => {
    if (!details.token) return setCustomDialog({ type: 'alert', message: "Please enter a Token Number first!" });
    if (!webcamRef.current) return setCustomDialog({ type: 'alert', message: "Webcam not ready" });

    setLoading(true);
    const imageSrc = webcamRef.current.getScreenshot();

    const payload = {
      image: imageSrc,
      tokenNumber: details.token,
      gender: details.gender,
      category: details.type
    };

    try {
      const response = await axios.post(`${API_BASE}/api/tokens`, payload);

      // Auto-print immediately
      const savedUrl = response.data.photoUrl.startsWith('http')
        ? response.data.photoUrl
        : `${API_BASE}${response.data.photoUrl}`;
      printToken(savedUrl);

      // Clear token for next devotee without blocking the print script
      setTimeout(() => setCustomDialog({ type: 'alert', message: "✅ Token saved successfully!" }), 500);
      setDetails(prev => ({ ...prev, token: '' }));
    } catch (error) {
      if (error.response) setCustomDialog({ type: 'alert', message: error.response.data.error || "Server error" });
      else setCustomDialog({ type: 'alert', message: "Cannot reach backend server" });
    } finally {
      setLoading(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const loadTokens = async (gender) => {
    try {
      const res = await axios.get(`${API_BASE}/api/tokens?gender=${gender}`);
      // Sort ascending (1 to 108)
      const sorted = res.data.sort((a, b) => a.tokenNumber - b.tokenNumber);
      setTokensData(sorted);
      setViewingTokens(gender);
    } catch (err) {
      setCustomDialog({ type: 'alert', message: "Failed to load tokens." });
    }
  };

  const loadMissingTokens = async (gender) => {
    try {
      const res = await axios.get(`${API_BASE}/api/tokens?gender=${gender}`);
      const existingNumbers = res.data.map(t => Number(t.tokenNumber));

      const missing = [];
      for (let i = 1; i <= 108; i++) {
        if (!existingNumbers.includes(i)) {
          missing.push(i);
        }
      }
      setMissingTokensData(missing);
      setViewingMissing(gender);
    } catch (err) {
      setCustomDialog({ type: 'alert', message: "Failed to load missing tokens." });
    }
  };

  const deleteAllTokens = async () => {
    setCustomDialog({
      type: 'confirm',
      message: "⚠️ ARE YOU SURE? This will permanently delete ALL male and female tokens.",
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE}/api/tokens`);
          setCustomDialog({ type: 'alert', message: "All tokens deleted successfully." });
          setTokensData([]);
          if (viewingMissing) loadMissingTokens(viewingMissing);
        } catch (err) {
          setCustomDialog({ type: 'alert', message: "Failed to delete tokens." });
        }
      }
    });
  };

  const deleteToken = async (id, tokenNumber, gender) => {
    setCustomDialog({
      type: 'confirm',
      message: `⚠️ Are you sure you want to delete Token ${tokenNumber}?`,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE}/api/tokens/${id}`);
          // Refresh the list after deleting
          loadTokens(gender);
        } catch (err) {
          setCustomDialog({ type: 'alert', message: "Failed to delete token." });
        }
      }
    });
  };

  const printToken = (url) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setCustomDialog({ type: 'alert', message: 'Please allow Pop-ups to print tokens.' });
        return;
      }
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Token</title>
            <style>
              @page { margin: 0; }
              body { margin: 0; display: flex; justify-content: center; align-items: flex-start; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <img src="${url}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("Failed to print token:", err);
      setCustomDialog({ type: 'alert', message: "Printing failed. Please try manually from view tokens." });
    }
  };

  /* ================= RENDER ================= */

  // The Login Screen
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card panel-card">
          <img src="/logo.png" alt="Temple Logo" className="login-logo" />
          <h1 style={{ color: 'var(--temple-red)', margin: '10px 0' }}>నారాయణ క్షేత్రం</h1>
          <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>Authorized Personnel Only</p>

          <input
            type="password"
            className="token-input"
            placeholder="Enter Admin Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (passwordInput === 'narayana') setIsAuthenticated(true);
                else alert('Incorrect Password!');
              }
            }}
            style={{ marginBottom: '20px' }}
          />
          <button
            className="capture-btn"
            style={{ padding: '15px' }}
            onClick={() => {
              if (passwordInput === 'narayana') setIsAuthenticated(true);
              else alert('Incorrect Password!');
            }}
          >
            🔒 SECURE LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">

      {/* --- SETUP OVERLAY --- */}
      {showSetup && (
        <div className="overlay">
          <div className="setup-card modal-card">
            <h2>🕉️ Default Setup</h2>
            <div className="input-group">
              <p>Category</p>
              <label><input type="radio" name="popupGender" value="Male" onChange={e => setDetails({ ...details, gender: e.target.value })} /> Male / పురుషుడు</label>
              <label><input type="radio" name="popupGender" value="Female" onChange={e => setDetails({ ...details, gender: e.target.value })} /> Female / స్త్రీ</label>
            </div>
            <div className="input-group">
              <p>Type</p>
              <label><input type="radio" name="popupType" value="Self" onChange={e => setDetails({ ...details, type: e.target.value })} /> Self</label>
              <label><input type="radio" name="popupType" value="Others" onChange={e => setDetails({ ...details, type: e.target.value })} /> Others</label>
            </div>
            <button className="primary-btn" onClick={() => {
              if (!details.gender || !details.type) return setCustomDialog({ type: 'alert', message: "Please select both options" });
              localStorage.setItem("gender", details.gender);
              localStorage.setItem("type", details.type);
              setShowSetup(false);
            }}>Begin Seva</button>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="temple-header">
        <img src="/logo.png" alt="Temple Logo" className="header-logo" style={{ width: 120, marginBottom: 15 }} />
        <h1>నారాయణ క్షేత్రం</h1>
        <h3>శ్రీ దేవుడు బాబు సంస్థానం</h3>
        <p className="subtitle">Token Management System</p>
      </header>

      {/* --- TOP MOBILE ACTIONS --- */}
      <div className="mobile-action-bar">
        <div className="active-status" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <span style={{ fontSize: '1.1rem' }}>Active: <b style={{ color: 'var(--saffron)' }}>{details.gender}</b> ({details.type})</span>
          <button className="text-btn" onClick={() => setShowSetup(true)} style={{ margin: 0, padding: '5px 10px', background: '#f8f9fa', borderRadius: '5px', border: '1px solid #ddd' }}>Change</button>
        </div>

        <div className="horizontal-buttons">
          <button className="action-btn" onClick={toggleCamera}>🔄 Camera</button>
          <button className="action-btn male-btn" onClick={() => loadTokens('Male')}>👁️ Male</button>
          <button className="action-btn female-btn" onClick={() => loadTokens('Female')}>👁️ Female</button>
          <button className="action-btn warn-btn" onClick={() => loadMissingTokens(details.gender || 'Male')}>❓ Missing</button>
          <button className="action-btn danger-btn" onClick={deleteAllTokens}>🗑️ Erase All</button>
        </div>
      </div>

      {/* --- MAIN CAPTURE LAYOUT --- */}
      <main className="main-layout">

        {/* Camera Panel */}
        <section className="camera-panel panel-card compact-camera">
          <div className="camera-wrapper">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: facingMode }}
              className="webcam-feed"
            />
          </div>
          <p className="camera-status" style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>🟢 Live Camera Feed</p>
        </section>

        {/* Capture Panel */}
        <section className="control-panel panel-card" style={{ borderTop: '5px solid var(--temple-red)' }}>
          <div className="capture-section">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="token-input"
              value={details.token}
              onChange={e => {
                const val = e.target.value;
                if (val === '' || /^[0-9\b]+$/.test(val)) {
                  setDetails({ ...details, token: val });
                }
              }}
              placeholder="Enter Token No (1-108)"
              maxLength="3"
              style={{ padding: '20px', fontSize: '1.4rem' }}
            />
            <button className="capture-btn" onClick={handleCapture} disabled={loading} style={{ fontSize: '1.3rem', padding: '20px' }}>
              {loading ? "Saving..." : "📸 CAPTURE PHOTO"}
            </button>
          </div>
        </section>

      </main>

      {/* --- MODALS --- */}

      {/* View Tokens Modal */}
      {viewingTokens && (
        <div className="overlay" onClick={() => setViewingTokens(null)}>
          <div className="modal-card wide-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{viewingTokens} Tokens ({tokensData.length}/108)</h2>
              <button className="close-btn" onClick={() => setViewingTokens(null)}>✖</button>
            </div>
            <div className="gallery-grid">
              {tokensData.length === 0 ? <p>No tokens captured yet.</p> : tokensData.map(t => {
                const imgUrl = t.photoUrl.startsWith('http') ? t.photoUrl : `${API_BASE}${t.photoUrl}`;
                return (
                  <div key={t._id} className="token-card">
                    <img
                      src={imgUrl}
                      alt={`Token ${t.tokenNumber}`}
                      onClick={() => setViewingImage(imgUrl)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div className="token-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>Token: {t.tokenNumber}</strong>
                      <div className="token-actions" style={{ display: 'flex', gap: '5px' }}>
                        <button className="print-btn" onClick={() => printToken(imgUrl)} title="Print">🖨️</button>
                        <button className="danger-btn" style={{ padding: '8px', fontSize: '12px' }} onClick={() => deleteToken(t._id, t.tokenNumber, viewingTokens)} title="Delete">🗑️</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* View Missing Tokens Modal */}
      {viewingMissing && (
        <div className="overlay" onClick={() => setViewingMissing(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Missing {viewingMissing} Tokens</h2>
              <button className="close-btn" onClick={() => setViewingMissing(null)}>✖</button>
            </div>
            <div className="missing-list">
              {missingTokensData.length === 0
                ? <p>All 108 tokens captured! 🎉</p>
                : <div className="number-grid">
                  {missingTokensData.map(num => <span key={num} className="missing-number">{num}</span>)}
                </div>
              }
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {viewingImage && (
        <div className="overlay image-lightbox" onClick={() => setViewingImage(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={viewingImage} alt="Full Screen Token" />
            <button className="close-btn" onClick={() => setViewingImage(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fff', borderRadius: '50%', padding: '10px', zIndex: 3000 }}>✖</button>
          </div>
        </div>
      )}

      {/* --- CUSTOM DIALOG UI --- */}
      {customDialog && (
        <div className="overlay" style={{ zIndex: 9999 }}>
          <div className="dialog-card">
            <h3 style={{ marginTop: 0, color: 'var(--text-dark)', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
              {customDialog.type === 'confirm' ? 'Confirm Action' : 'Notification'}
            </h3>
            <p style={{ fontSize: '1.1rem', margin: '20px 0', lineHeight: 1.5 }}>
              {customDialog.message}
            </p>
            <div className="dialog-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              {customDialog.type === 'confirm' && (
                <button
                  className="action-btn"
                  onClick={() => setCustomDialog(null)}
                >
                  Cancel
                </button>
              )}
              <button
                className="primary-btn"
                onClick={() => {
                  if (customDialog.type === 'confirm' && customDialog.onConfirm) {
                    customDialog.onConfirm();
                  }
                  setCustomDialog(null);
                }}
              >
                {customDialog.type === 'confirm' ? 'Yes, Proceed' : 'Okay'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

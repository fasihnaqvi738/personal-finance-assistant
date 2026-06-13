import { useState } from "react";
import api from "../services/api";

function Login({ setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");

  const handleLogin = async () => {
    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.access_token);

      if (response.data.username) {
        localStorage.setItem("username", response.data.username);
      }

      setIsLoggedIn(true);
      alert("Login successful!");
    } catch (error) {
      console.error(error.response?.data || error);
      alert("Login failed");
    }
  };

  const handleRegister = async () => {
    try {
      await api.post("/register", {
        username: registerUsername,
        email: registerEmail,
        password: registerPassword,
        categories: categories.filter((c) => c.trim() !== ""),
      });

      alert("Registration successful!");
      setShowRegister(false);
      resetRegisterForm();
    } catch (error) {
      console.error("REGISTER ERROR:", error.response?.data || error);
      alert(error.response?.data?.detail || "Registration failed");
    }
  };

  const resetRegisterForm = () => {
    setRegisterUsername("");
    setRegisterEmail("");
    setRegisterPassword("");
    setCategories([]);
    setCategoryInput("");
  };

  const openRegisterModal = () => {
    resetRegisterForm();
    setShowRegister(true);
  };

  const addCategory = () => {
    if (!categoryInput.trim()) return;

    setCategories([...categories, categoryInput.trim()]);
    setCategoryInput("");
  };

  const removeCategory = (indexToRemove) => {
    setCategories(categories.filter((_, index) => index !== indexToRemove));
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #07111f 0%, #101827 45%, #13251f 100%)",
      color: "#e5edf5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "28px",
      fontFamily: "Inter, Segoe UI, Arial, sans-serif",
    },
    shell: {
      width: "min(1040px, 100%)",
      display: "grid",
      gridTemplateColumns: "1.1fr 0.9fr",
      gap: "22px",
      alignItems: "stretch",
    },
    hero: {
      background: "rgba(15, 23, 42, 0.72)",
      border: "1px solid rgba(148, 163, 184, 0.18)",
      borderRadius: "8px",
      padding: "34px",
      boxShadow: "0 22px 70px rgba(0, 0, 0, 0.26)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      minHeight: "430px",
    },
    brand: {
      margin: 0,
      fontSize: "38px",
      fontWeight: 900,
      letterSpacing: 0,
      color: "#f8fafc",
    },
    subtitle: {
      margin: "12px 0 0",
      color: "#8ea0b5",
      fontSize: "15px",
      lineHeight: 1.6,
      maxWidth: "520px",
    },
    statGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "12px",
      marginTop: "28px",
    },
    stat: {
      background: "rgba(2, 6, 23, 0.52)",
      border: "1px solid rgba(148, 163, 184, 0.14)",
      borderRadius: "8px",
      padding: "14px",
    },
    statValue: {
      margin: 0,
      fontSize: "20px",
      fontWeight: 900,
      color: "#86efac",
    },
    statLabel: {
      margin: "5px 0 0",
      color: "#93a4b8",
      fontSize: "12px",
    },
    card: {
      background: "rgba(15, 23, 42, 0.86)",
      border: "1px solid rgba(148, 163, 184, 0.2)",
      borderRadius: "8px",
      padding: "28px",
      boxShadow: "0 22px 70px rgba(0, 0, 0, 0.3)",
      minHeight: "430px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },
    cardTitle: {
      margin: 0,
      fontSize: "28px",
      fontWeight: 900,
      color: "#f8fafc",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      marginTop: "24px",
    },
    input: {
      background: "#0f172a",
      border: "1px solid #314158",
      color: "#e5edf5",
      borderRadius: "8px",
      padding: "12px 13px",
      outline: "none",
      fontSize: "14px",
    },
    primaryButton: {
      background: "#14b8a6",
      border: "1px solid #2dd4bf",
      color: "#031312",
      borderRadius: "8px",
      padding: "12px 15px",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: "14px",
    },
    ghostButton: {
      background: "rgba(15, 23, 42, 0.88)",
      border: "1px solid #334155",
      color: "#dbeafe",
      borderRadius: "8px",
      padding: "11px 14px",
      cursor: "pointer",
      fontWeight: 800,
    },
    hintRow: {
      marginTop: "18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      color: "#93a4b8",
      fontSize: "14px",
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(2, 6, 23, 0.76)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      zIndex: 10,
    },
    modal: {
      background: "#0f172a",
      color: "#e5edf5",
      padding: "24px",
      borderRadius: "8px",
      border: "1px solid rgba(148, 163, 184, 0.22)",
      width: "min(520px, 100%)",
      boxShadow: "0 26px 80px rgba(0, 0, 0, 0.45)",
    },
    modalTitle: {
      margin: "0 0 8px",
      fontSize: "24px",
      fontWeight: 900,
    },
    modalText: {
      margin: "0 0 18px",
      color: "#8ea0b5",
      fontSize: "14px",
    },
    categoryInputRow: {
      display: "flex",
      gap: "10px",
    },
    chips: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      marginTop: "12px",
      minHeight: "36px",
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      background: "rgba(20, 184, 166, 0.12)",
      border: "1px solid rgba(45, 212, 191, 0.35)",
      color: "#ccfbf1",
      borderRadius: "8px",
      padding: "7px 9px",
      fontSize: "13px",
      fontWeight: 700,
    },
    chipButton: {
      background: "transparent",
      border: 0,
      color: "#fca5a5",
      cursor: "pointer",
      fontWeight: 900,
      padding: 0,
    },
    modalActions: {
      display: "flex",
      gap: "10px",
      justifyContent: "flex-end",
      marginTop: "20px",
    },
  };

  return (
    <div style={styles.page}>
      <style>{`
        @media (max-width: 860px) {
          .login-shell {
            grid-template-columns: 1fr !important;
          }

          .login-stat-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="login-shell" style={styles.shell}>
        <section style={styles.hero}>
          <div>
            <h1 style={styles.brand}>Finance Assistant</h1>
            <p style={styles.subtitle}>
              A focused dashboard for categories, expenses, and spending decisions that deserve a little less chaos.
            </p>
          </div>

          <div className="login-stat-grid" style={styles.statGrid}>
            <div style={styles.stat}>
              <p style={styles.statValue}>Track</p>
              <p style={styles.statLabel}>Daily expenses</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statValue}>Plan</p>
              <p style={styles.statLabel}>Category budgets</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statValue}>Review</p>
              <p style={styles.statLabel}>Spending history</p>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Login</h2>
          <p style={styles.subtitle}>Welcome back. Sign in to continue managing your money.</p>

          <div style={styles.form}>
            <input
              style={styles.input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button style={styles.primaryButton} onClick={handleLogin}>
              Login
            </button>
          </div>

          <div style={styles.hintRow}>
            <span>New user?</span>
            <button style={styles.ghostButton} onClick={openRegisterModal}>
              Register
            </button>
          </div>
        </section>
      </div>

      {showRegister && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Create account</h3>
            <p style={styles.modalText}>Add a few starter categories now, or create more later from the dashboard.</p>

            <div style={styles.form}>
              <input
                style={styles.input}
                type="text"
                placeholder="Username"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
              />

              <input
                style={styles.input}
                type="email"
                placeholder="Email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />

              <input
                style={styles.input}
                type="password"
                placeholder="Password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
              />

              <div style={styles.categoryInputRow}>
                <input
                  style={{ ...styles.input, flex: 1 }}
                  type="text"
                  placeholder="Enter category"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addCategory();
                  }}
                />

                <button style={styles.ghostButton} type="button" onClick={addCategory}>
                  Add
                </button>
              </div>
            </div>

            <div style={styles.chips}>
              {categories.map((cat, index) => (
                <span key={`${cat}-${index}`} style={styles.chip}>
                  {cat}
                  <button style={styles.chipButton} type="button" onClick={() => removeCategory(index)}>
                    x
                  </button>
                </span>
              ))}
            </div>

            <div style={styles.modalActions}>
              <button style={styles.ghostButton} onClick={() => setShowRegister(false)}>
                Cancel
              </button>

              <button style={styles.primaryButton} onClick={handleRegister}>
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;

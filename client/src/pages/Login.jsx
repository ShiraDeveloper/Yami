import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowRegister(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({})); // תמיד נסה לקרוא JSON

      if (!response.ok) {
        // ניהול שגיאות לפי תוכן השרת
        if (data.error) {
          setError(data.error);
          if (data.error.toLowerCase().includes("invalid credentials")) {
            setShowRegister(true);
          }
        } else {
          setError("Login failed");
        }
        return;
      }

      // התחברות הצליחה
      localStorage.setItem("token", data.token);
      console.log("JWT Token:", data.token);
      window.location.href = "/stores";
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2>Login</h2>
        {error && <p style={styles.error}>{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          {loading ? "Loading..." : "Login"}
        </button>

        {showRegister && (
          <p
            style={{ color: "blue", cursor: "pointer", marginTop: "10px" }}
            onClick={() => window.location.href = "/register"}
          >
            Register here
          </p>
        )}
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    width: "300px",
    gap: "10px",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
  },
  button: {
    padding: "10px",
    cursor: "pointer",
  },
  error: {
    color: "red",
  },
};
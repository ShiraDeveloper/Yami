import { useState } from "react";
import { useNavigate } from "react-router-dom";

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // שמירת טוקן
      localStorage.setItem("token", data.token);

      // פענוח JWT
      const decoded = parseJwt(data.token);

      console.log("decoded token:", decoded);

      const role =
        decoded?.role ||
        decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      // ניווט לפי role
      if (role === "Customer") navigate("/stores");
      else if (role === "Admin") navigate("/admin");
      else if (role === "Courier") navigate("/courier");
      else navigate("/stores"); // fallback

    } catch (err) {
      setError("Server error");
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

        <button style={styles.button} disabled={loading}>
          {loading ? "Loading..." : "Login"}
        </button>

        <p style={styles.link} onClick={() => navigate("/register")}>
          Register
        </p>
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
    gap: "12px",
    textAlign: "center",
  },
  input: {
    padding: "10px",
    fontSize: "14px",
  },
  button: {
    padding: "10px",
    cursor: "pointer",
  },
  error: {
    color: "red",
  },
  link: {
    cursor: "pointer",
    color: "blue",
    textDecoration: "underline",
    fontSize: "14px",
  },
};

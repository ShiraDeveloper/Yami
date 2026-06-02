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
          body: JSON.stringify({ email, password, rememberMe: true }), 
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      localStorage.setItem("token", data.token); 
      localStorage.setItem("userId", data.userId);
      window.dispatchEvent(new Event("storage"));
      
      const decoded = parseJwt(data.token);
      const role = decoded?.role || decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      if (role === "Customer") navigate("/stores");
      else if (role === "Admin") navigate("/admin");
      else if (role === "Delivery") navigate("/courier");
      else navigate("/stores");

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
          id="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          style={styles.input}
          required
        />

        <input
          type="password"
          id="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          style={styles.input}
          required
        />


        <button style={styles.button} disabled={loading} type="submit">
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
    color: "#EF5A6F",
  },
  link: {
    cursor: "pointer",
    color: "#7B8FF5",
    textDecoration: "underline",
    fontSize: "14px",
  },
};

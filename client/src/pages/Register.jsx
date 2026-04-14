import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Users/register`,
        {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({name,email,password})
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      // כניסה אוטומטית
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      if (data.role === "Customer") navigate("/stores");
      else if (data.role === "Admin") navigate("/admin");
      else if (data.role === "Courier") navigate("/courier");

    } catch {
      setError("Server error");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleRegister} style={styles.form}>

        <h2>Register</h2>

        {error && <p style={styles.error}>{error}</p>}

        <input
          placeholder="Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          style={styles.input}
        />

        <button style={styles.button}>Register</button>

        <p style={styles.link} onClick={()=>navigate("/")}>
          Back to Login
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
  success: {
    color: "green",
  },
  link: {
    cursor: "pointer",
    color: "blue",
    textDecoration: "underline",
    fontSize: "14px",
  },
};
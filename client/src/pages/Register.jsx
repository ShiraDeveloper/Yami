import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Users/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            Name: name, 
            Email: email, 
            Password: password, 
            Phone: phone 
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      // --- שלב הכניסה האוטומטית ---
      // שמירת הטוקן שהתקבל מהשרת ישר ב-localStorage
      localStorage.setItem("token", data.token);

      // ניווט ישיר לפי ה-Role שהתקבל
      const role = data.role;
      if (role === "Customer") navigate("/stores");
      else if (role === "Admin") navigate("/admin");
      else if (role === "Delivery" || role === "Courier") navigate("/courier");
      else navigate("/stores");

    } catch (err) {
      setError("Server error during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleRegister} style={styles.form}>
        <h2>Create Account</h2>
        {error && <p style={styles.error}>{error}</p>}
        
        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
        <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} style={styles.input} required />

        <button style={styles.button} disabled={loading}>
          {loading ? "Registering..." : "Sign Up & Start"}
        </button>

        <p style={styles.link} onClick={() => navigate("/")}>Already have an account? Login</p>
      </form>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" },
  form: { display: "flex", flexDirection: "column", width: "300px", gap: "12px", textAlign: "center" },
  input: { padding: "10px", fontSize: "14px" },
  button: { padding: "10px", cursor: "pointer" },
  error: { color: "#EF5A6F" },
  link: { cursor: "pointer", color: "#7B8FF5", textDecoration: "underline", fontSize: "14px" },
};
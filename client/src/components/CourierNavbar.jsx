import React from "react";
import { useNavigate } from "react-router-dom";

export default function CourierNavbar({ courierName }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.leftSection}>
        <h2 style={styles.logo}>YAMI Courier</h2>
        <span style={styles.badge}>מצב: פעיל</span>
      </div>
      
      <div style={styles.rightSection}>
        <span style={styles.welcome}>שלום, {courierName || "שליח"}</span>
        <button onClick={handleLogout} style={styles.logoutBtn}>התנתק</button>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    height: "60px",
    backgroundColor: "#1F2937", // צבע כהה ומקצועי לשליחים
    color: "white",
    boxShadow: "0 4px 16px rgba(31, 41, 55, 0.06)",
  },
  leftSection: { display: "flex", alignItems: "center", gap: "15px" },
  logo: { fontSize: "1.2rem", margin: 0, fontWeight: "bold" },
  badge: { 
    backgroundColor: "#10B981", 
    padding: "2px 8px", 
    borderRadius: "10px", 
    fontSize: "0.8rem" 
  },
  rightSection: { display: "flex", alignItems: "center", gap: "20px" },
  welcome: { fontSize: "0.9rem" },
  logoutBtn: {
    padding: "6px 12px",
    backgroundColor: "#DC2A45",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem"
  }
};
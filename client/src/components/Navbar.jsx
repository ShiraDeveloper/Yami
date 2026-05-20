import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from 'react';

// פונקציית עזר לפענוח התפקיד מהטוקן
function getRoleFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload?.role || payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  } catch {
    return null;
  }
}

export default function Navbar() {
  const navigate = useNavigate();
  const role = getRoleFromToken();

  const [userName, setUserName] = useState("Loading...");
  const [isLive, setIsLive] = useState(false); // ברירת מחדל כבוי עד לקבלת הנתונים מהשרת
  const [cartCount, setCartCount] = useState(0);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7234";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // 1. שליפת פרופיל המשתמש
    fetch(`${API_BASE_URL}/api/Users/profile`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then(data => {
        if (data && (data.name || data.Name)) {
          setUserName(data.name || data.Name);
        } else {
          setUserName("User");
        }
      })
      .catch(err => {
        console.error("Error fetching user from DB:", err);
        setUserName("User");
      });

    // 2. אם המשתמש הוא שליח, נשלוף את סטטוס הזמינות הנוכחי שלו מהשרת
    if (role === "Delivery") {
      fetch(`${API_BASE_URL}/api/Courier/availability-status`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setIsLive(data.isAvailable);
        })
        .catch(err => console.error("Error fetching availability status:", err));
    }
  }, [role, API_BASE_URL]);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];

      const totalItems = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      setCartCount(totalItems);
    };

    // טעינה ראשונית
    updateCartCount();

    // האזנה לעדכונים
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // פונקציית עדכון סטטוס אקטיבית מול השרת
  const toggleStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const nextStatus = !isLive;

      const res = await fetch(`${API_BASE_URL}/api/Courier/toggle-availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable: nextStatus })
      });

      if (res.ok) {
        setIsLive(nextStatus);

        // ריענון קל כדי לסנכרן אוטומטית את ה-Dashboard וחיבור ה-SignalR
        window.location.reload();
      }
    } catch (err) {
      console.error("Error toggling availability:", err);
    }
  };

  return (
    <div style={styles.navbar}>
      {/* לוגו האפליקציה - עגול */}
      <h3 style={styles.logo} onClick={() => navigate(role === "Delivery" ? "/courier" : "/stores")}>
        <img
          src="../public/images/logo.png"
          alt="Logo"
          style={{ height: "60px", width: "auto", objectFit: "contain", display: "block", borderRadius: "50%" }}
        />
      </h3>

      {/* תפריט הקישורים והכפתורים */}
      <div style={styles.links}>
        {/* כפתורים שמופיעים רק לשליח (Delivery) */}
        {role === "Delivery" && (
          <>
            <button
              onClick={toggleStatus}
              style={{
                ...styles.statusBtn,
                ...(isLive ? styles.connected : styles.disconnected)
              }}
            >
              {isLive ? '● Connected' : '○ Disconnected'}
            </button>
            <button onClick={() => navigate("/courier")}>Dashboard</button>
            <button onClick={() => navigate("/courier-map")}>Active Route</button>
          </>
        )}

        {/* כפתורים שמופיעים רק ללקוח (Customer) */}
        {role === "Customer" && (
          <>
            <button onClick={() => navigate("/stores")}>Stores</button>
            <button
              onClick={() => navigate("/cart")}
              style={styles.cartButton}
            >
              🧺 Cart

              {cartCount > 0 && (
                <span style={styles.cartBadge}>
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate("/my-orders")}>My Orders</button>
          </>
        )}

        {/* שורת שלום ושם המשתמש הדינמי */}
        {role && (
          <span style={styles.welcomeText}>
            Hello, {userName}
          </span>
        )}

        {/* כפתור Logout */}
        {role && (
          <button onClick={logout} style={styles.logout}>
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 25px",
    backgroundColor: "#ffffff",
    color: "white",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  logo: { cursor: "pointer", margin: 0 },
  links: { display: "flex", gap: "12px", alignItems: "center" },
  welcomeText: {
    color: "#333333",
    fontSize: "14px",
    fontWeight: "500",
    marginLeft: "5px",
    marginRight: "5px",
  },
  logout: {
    backgroundColor: "#EF5A6F",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  statusBtn: {
    border: "none",
    padding: "6px 14px",
    borderRadius: "50px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    transition: "background-color 0.2s ease",
    color: "#ffffff",
  },
  connected: {
    backgroundColor: "#2E7D32", // ירוק כהה וברור יותר לסטטוס פעיל
  },
  disconnected: {
    backgroundColor: "#C62828", // אדום ברור לסטטוס מנותק
  },
  cartButton: {
  position: "relative",
  backgroundColor: "#7B8FF5",
  color: "white",
  border: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
},

cartBadge: {
  position: "absolute",
  top: "-6px",
  right: "-6px",
  backgroundColor: "#828282",
  color: "white",
  borderRadius: "50%",
  minWidth: "20px",
  height: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11px",
  fontWeight: "bold",
  padding: "0 5px",
},
};
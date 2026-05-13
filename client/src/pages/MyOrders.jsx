import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to see your orders");
        setLoading(false);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || "https://localhost:7234";
      
      const res = await fetch(`${apiUrl}/api/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      console.log("Data from server:", data);

      // לוגיקה לטיפול בכל סוגי התגובות: מערך, אובייקט בודד, או עטיפת $values
      let normalizedData = [];
      if (Array.isArray(data)) {
        normalizedData = data;
      } else if (data && typeof data === 'object') {
        // אם זה אובייקט עם שדה של ערכים (נפוץ ב-EF Core)
        if (data.$values && Array.isArray(data.$values)) {
          normalizedData = data.$values;
        } else if (data.id || data.Id) {
          // אם זה אובייקט בודד של הזמנה אחת
          normalizedData = [data];
        }
      }
      
      setOrders(normalizedData);

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    // מפה לפי ה-Enum ב-C# (0=New, 1=Approved, 2=InProgress, 3=Delivered, 4=Canceled)
    const statusMap = {
      0: "🆕 New",
      1: "👨‍🍳 Preparing",
      2: "🚚 On the way",
      3: "✅ Delivered",
      4: "❌ Canceled",
      "New": "🆕 New",
      "Approved": "👨‍🍳 Preparing",
      "InProgress": "🚚 On the way",
      "Delivered": "✅ Delivered",
      "Canceled": "❌ Canceled"
    };
    return statusMap[status] || "Unknown";
  };

  const getStatusStyle = (status) => {
    const isFinal = [3, 4, "Delivered", "Canceled"].includes(status);
    const isSuccess = status === 3 || status === "Delivered";
    return {
      fontWeight: "bold",
      color: isSuccess ? "#16a34a" : isFinal ? "#dc2626" : "#2563eb"
    };
  };

  if (loading) return <div style={styles.center}><h2>Loading orders...</h2></div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>My Orders</h1>

      {error && (
        <div style={styles.center}>
          <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>
          <button onClick={fetchOrders} style={styles.button}>Retry</button>
        </div>
      )}

      {!error && orders.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No orders yet</p>
      ) : (
        <div style={styles.list}>
          {orders.map((order) => {
            const orderId = order.id || order.Id;
            const status = order.status !== undefined ? order.status : order.Status;
            const storeName = order.store?.name || order.Store?.Name || "Unknown Store";
            const date = new Date(order.createdAt || order.CreatedAt).toLocaleString();

            return (
              <div key={orderId} style={styles.card}>
                <div style={styles.info}>
                  <h3 style={{ margin: "0 0 10px 0" }}>Order #{orderId}</h3>
                  <p style={styles.text}>🏪 <strong>Store:</strong> {storeName}</p>
                  <p style={styles.text}>
                    📦 <strong>Status:</strong>{" "}
                    <span style={getStatusStyle(status)}>
                      {getStatusText(status)}
                    </span>
                  </p>
                  <p style={{ ...styles.text, fontSize: "0.85rem", color: "#666" }}>🕒 {date}</p>
                </div>

                <div style={styles.actions}>
                  <button
                    style={styles.button}
                    onClick={() => navigate(`/order/${orderId}`)}
                  >
                    Details
                  </button>
                  {/* כפתור מעקב יופיע רק אם ההזמנה לא סופקה או בוטלה */}
                  {![3, 4, "Delivered", "Canceled"].includes(status) && (
                    <button
                      style={styles.trackBtn}
                      onClick={() => navigate(`/track/${orderId}`)}
                    >
                      Track
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "40px 20px", backgroundColor: "#f5f6fa", minHeight: "100vh", direction: "ltr" },
  title: { textAlign: "center", marginBottom: "40px", color: "#2d3436" },
  list: { display: "flex", flexDirection: "column", gap: "20px", maxWidth: "800px", margin: "0 auto" },
  card: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    background: "white", 
    padding: "25px", 
    borderRadius: "15px", 
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    border: "1px solid #eee"
  },
  info: { flex: 1 },
  text: { margin: "5px 0", color: "#2d3436" },
  actions: { display: "flex", flexWrap: "wrap", gap: "10px", marginLeft: "20px" },
  button: { 
    padding: "10px 20px", 
    backgroundColor: "#4e73df", 
    color: "white", 
    border: "none", 
    borderRadius: "8px", 
    cursor: "pointer",
    fontWeight: "600",
    transition: "background 0.2s"
  },
  trackBtn: { 
    padding: "10px 20px", 
    backgroundColor: "#16a34a", 
    color: "white", 
    border: "none", 
    borderRadius: "8px", 
    cursor: "pointer",
    fontWeight: "600"
  },
  center: { display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", flexDirection: "column" },
};
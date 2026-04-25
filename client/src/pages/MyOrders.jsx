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

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/my-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }

      const ordersData = Array.isArray(data)
        ? data
        : data.orders || data.data || [];

      setOrders(ordersData);
    } catch (err) {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <h2>Loading orders...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={fetchOrders}>Retry</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>My Orders</h1>

      {orders.length === 0 ? (
        <p style={{ textAlign: "center" }}>No orders yet</p>
      ) : (
        <div style={styles.list}>
          {orders.map((order) => (
            <div key={order.id} style={styles.card}>
              
              {/* 📦 פרטי הזמנה */}
              <div>
                <h3>Order #{order.id}</h3>

                <p>🏪 Store: {order.storeName || "Unknown"}</p>

                <p>
                  📦 Status:{" "}
                  <span style={getStatusStyle(order.status)}>
                    {formatStatus(order.status)}
                  </span>
                </p>

                <p>
                  🕒 {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>

              {/* 🎯 כפתורים */}
              <div style={styles.actions}>
                
                <button
                  style={styles.button}
                  onClick={() => navigate(`/order/${order.id}`)}
                >
                  Details
                </button>

                {/* 🚀 Track רק להזמנות פעילות */}
                {order.status !== "Delivered" &&
                  order.status !== "Canceled" && (
                    <button
                      style={styles.trackBtn}
                      onClick={() => navigate(`/track/${order.id}`)}
                    >
                      Track
                    </button>
                  )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 🎨 עיצוב סטטוסים
const getStatusStyle = (status) => {
  switch (status) {
    case "New":
      return { color: "#6b7280", fontWeight: "bold" };
    case "Approved":
      return { color: "#f59e0b", fontWeight: "bold" };
    case "InProgress":
      return { color: "#2563eb", fontWeight: "bold" };
    case "Delivered":
      return { color: "#16a34a", fontWeight: "bold" };
    case "Canceled":
      return { color: "#dc2626", fontWeight: "bold" };
    default:
      return { color: "black" };
  }
};

// 🧠 טקסט יפה לסטטוס
const formatStatus = (status) => {
  switch (status) {
    case "New":
      return "🆕 New";
    case "Approved":
      return "👨‍🍳 Preparing";
    case "InProgress":
      return "🚚 On the way";
    case "Delivered":
      return "✅ Delivered";
    case "Canceled":
      return "❌ Canceled";
    default:
      return status;
  }
};

const styles = {
  container: {
    padding: "40px",
    backgroundColor: "#f5f6fa",
    minHeight: "100vh",
  },

  title: {
    textAlign: "center",
    marginBottom: "30px",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    maxWidth: "700px",
    margin: "0 auto",
  },

  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
  },

  actions: {
    display: "flex",
    gap: "10px",
  },

  button: {
    padding: "8px 12px",
    backgroundColor: "#4e73df",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  trackBtn: {
    padding: "8px 12px",
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    flexDirection: "column",
  },
};
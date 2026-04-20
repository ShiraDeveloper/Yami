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

              <div>
                <h3>Order #{order.id}</h3>

                <p>🏪 Store: {order.storeName || "Unknown"}</p>

                <p>
                  📦 Status:{" "}
                  <span style={getStatusStyle(order.status)}>
                    {order.status}
                  </span>
                </p>

                <p>
                  🕒 {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                style={styles.button}
                onClick={() => navigate(`/order/${order.id}`)}
              >
                View Details
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const getStatusStyle = (status) => {
  switch (status) {
    case "New":
      return { color: "orange" };
    case "Approved":
      return { color: "blue" };
    case "InProgress":
      return { color: "purple" };
    case "Delivered":
      return { color: "green" };
    default:
      return { color: "black" };
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
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0 5px 10px rgba(0,0,0,0.1)",
  },

  button: {
    padding: "8px 12px",
    backgroundColor: "#4e73df",
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
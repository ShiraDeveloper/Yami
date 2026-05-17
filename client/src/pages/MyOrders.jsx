import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

useEffect(() => {
  fetchOrders(true);

  const interval = setInterval(() => {
    fetchOrders(false);
  }, 5000);

  return () => clearInterval(interval);
}, []);

  const fetchOrders = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
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
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      let normalized = [];
      if (Array.isArray(data)) normalized = data;
      else if (data && typeof data === "object") {
        if (data.$values && Array.isArray(data.$values)) normalized = data.$values;
        else if (data.id || data.Id) normalized = [data];
      }
      setOrders(normalized);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const STATUS = {
    0: { label: "New", color: "#7B8FF5", bg: "#EEF2FF", icon: "🆕" },
    1: { label: "Preparing", color: "#D97706", bg: "#FEF3C7", icon: "👨‍🍳" },
    2: { label: "On the way", color: "#7B8FF5", bg: "#EEF2FF", icon: "🚚" },
    3: { label: "Delivered", color: "#10B981", bg: "#D1FAE5", icon: "✅" },
    4: { label: "Canceled", color: "#DC2A45", bg: "#FEE2E2", icon: "❌" },
  };
  const getStatus = (s) => {
    if (typeof s === "string") {
      const map = { New: 0, Approved: 1, InProgress: 2, Delivered: 3, Canceled: 4 };
      s = map[s] ?? 0;
    }
    return STATUS[s] || STATUS[0];
  };

  if (loading)
    return (
      <div style={styles.container}>
        <div style={styles.center}>
          <div style={styles.spinner} />
          <p style={styles.muted}>Loading orders...</p>
        </div>
      </div>
    );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Orders</h1>
        <p style={styles.subtitle}>
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </p>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <p style={{ margin: 0, color: "#DC2A45" }}>{error}</p>
          <button onClick={fetchOrders} style={styles.btnPrimary}>
            Retry
          </button>
        </div>
      )}

      {!error && orders.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={{ margin: "12px 0 4px", color: "#1F2937" }}>No orders yet</h3>
          <p style={styles.muted}>Your past orders will appear here.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {orders.map((order) => {
            const orderId = order.id || order.Id;
            const statusKey = order.status !== undefined ? order.status : order.Status;
            const st = getStatus(statusKey);
            const storeName = order.store?.name || order.Store?.Name || "Unknown Store";
            const date = new Date(order.createdAt || order.CreatedAt);
            const total = order.totalPrice || order.TotalPrice || order.total || 0;
            const isOpen = ![3, 4, "Delivered", "Canceled"].includes(statusKey);

            return (
              <div key={orderId} style={styles.card}>
                <div style={styles.cardLeft}>
                  <div style={styles.storeAvatar}>
                    {storeName.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.info}>
                    <div style={styles.topLine}>
                      <h3 style={styles.storeName}>{storeName}</h3>
                      <span style={styles.orderId}>#{orderId}</span>
                    </div>
                    <p style={styles.date}>
                      {date.toLocaleDateString()} · {date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <span
                      style={{
                        ...styles.badge,
                        color: st.color,
                        background: st.bg,
                      }}
                    >
                      {st.icon} {st.label}
                    </span>
                  </div>
                </div>

                <div style={styles.cardRight}>
                  {total > 0 && <p style={styles.price}>₪{Number(total).toFixed(2)}</p>}
                  <div style={styles.actions}>
                    <button
                      style={styles.btnGhost}
                      onClick={() => navigate(`/order/${orderId}`)}
                    >
                      Details
                    </button>
                    {isOpen && (
                      <button
                        style={styles.btnPrimary}
                        onClick={() => navigate(`/track/${orderId}`)}
                      >
                        Track
                      </button>
                    )}
                  </div>
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
  container: {
    padding: "40px 20px",
    backgroundColor: "#F8FAFC",
    minHeight: "100vh",
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
    color: "#1F2937",
  },
  header: { maxWidth: "820px", margin: "0 auto 24px" },
  title: { margin: 0, fontSize: "28px", fontWeight: 700, color: "#1F2937" },
  subtitle: { margin: "4px 0 0", color: "#6B7280", fontSize: "14px" },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    maxWidth: "820px",
    margin: "0 auto",
  },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    background: "white",
    padding: "18px 20px",
    borderRadius: "14px",
    boxShadow: "0 4px 16px rgba(31, 41, 55, 0.06)",
    border: "1px solid #F1F5F9",
    flexWrap: "wrap",
  },
  cardLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flex: 1,
    minWidth: "240px",
  },
  storeAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #7B8FF5, #A5B4FC)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "18px",
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  topLine: {
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
    flexWrap: "wrap",
  },
  storeName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 600,
    color: "#1F2937",
  },
  orderId: { fontSize: "12px", color: "#9CA3AF", fontWeight: 500 },
  date: { margin: "4px 0 8px", fontSize: "13px", color: "#6B7280" },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
  },
  cardRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px",
  },
  price: { margin: 0, fontSize: "18px", fontWeight: 700, color: "#10B981" },
  actions: { display: "flex", gap: "8px" },
  btnPrimary: {
    padding: "8px 16px",
    backgroundColor: "#7B8FF5",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
  },
  btnGhost: {
    padding: "8px 16px",
    backgroundColor: "white",
    color: "#7B8FF5",
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
  },
  empty: {
    maxWidth: "520px",
    margin: "60px auto 0",
    textAlign: "center",
    background: "white",
    padding: "40px 20px",
    borderRadius: "16px",
    border: "1px solid #F1F5F9",
  },
  emptyIcon: { fontSize: "48px" },
  muted: { color: "#6B7280", margin: 0 },
  errorBox: {
    maxWidth: "820px",
    margin: "0 auto 20px",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    padding: "14px 18px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  center: { textAlign: "center", marginTop: "80px" },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #E5E7EB",
    borderTopColor: "#7B8FF5",
    borderRadius: "50%",
    margin: "0 auto 12px",
    animation: "spin 0.8s linear infinite",
  },
};

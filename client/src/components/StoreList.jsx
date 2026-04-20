import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StoreList() {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);

  const navigate = useNavigate();
  console.log("FIRST STORE:", filteredStores?.[0]);
console.log("ALL FILTERED:", filteredStores);

  // 📍 קבלת מיקום משתמש
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setLocation({ lat: 32, lng: 34 }); // fallback
      }
    );
  }, []);

  // 🏪 טעינת חנויות
  useEffect(() => {
    if (location) fetchStores();
  }, [location]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Stores?userLat=${location.lat}&userLng=${location.lng}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      console.log("stores response:", data);

      if (!res.ok) {
        throw new Error("Failed to fetch stores");
      }

      // 🧠 תמיכה בכל סוגי מבנה API
      const storesData = Array.isArray(data)
        ? data
        : data.stores || data.data || [];

      setStores(storesData);
      setFilteredStores(storesData);

    } catch (err) {
      setError("Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  // 🔍 חיפוש
  const handleSearch = (value) => {
    setSearch(value);

    if (!value) {
      setFilteredStores(stores);
      return;
    }

    const filtered = stores.filter((s) =>
      (s.name || s.storeName || "")
        .toLowerCase()
        .includes(value.toLowerCase())
    );

    setFilteredStores(filtered);
  };

  // ⏳ טעינה
  if (loading) {
    return (
      <div style={styles.center}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // ❌ שגיאה
  if (error) {
    return (
      <div style={styles.center}>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={fetchStores}>Retry</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button onClick={() => navigate("/my-orders")}>
       🧾 My Orders
      </button>
      <h1 style={styles.title}>Stores Near You</h1>

      {/* 🔍 חיפוש */}
      <input
        placeholder="Search store..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        style={styles.search}
      />

      {/* 🏪 רשימת חנויות */}
      <div style={styles.grid}>
        {filteredStores.map((store) => (
          
          <div key={store.id} style={styles.card}>
            
            {/* מידע חנות */}
            <div>
              <h2>{store.name || "Unnamed store"}</h2>

              <p style={styles.address}>
                📍 {store.address || "No address available"}
              </p>

              <p style={styles.distance}>
                🚶 {store.distanceFromUser?.toFixed(2)} km
              </p>

              {store.kosherTags && (
                <p style={{ color: "green" }}>
                  {store.kosherTags}
                </p>
              )}
            </div>

            {/* כפתור מעבר לתפריט */}
            <button
              style={styles.button}
              onClick={() => navigate(`/store/${store.id}`)}
            >
              View Menu
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// 🎨 עיצוב
const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px",
    backgroundColor: "#f5f6fa",
    color: "#1e1e1e", // 🔥 צבע בסיס לכל הטקסט
    fontFamily: "Arial, sans-serif",
  },

  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#2c3e50",
    fontSize: "28px",
    fontWeight: "bold",
  },

  search: {
    display: "block",
    margin: "0 auto 30px",
    padding: "10px",
    width: "300px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#ffffff",
    color: "#000000", // 🔥 חשוב
  },

  grid: {
    display: "grid",
    gap: "20px",
    maxWidth: "700px",
    margin: "0 auto",
  },

  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#ffffff",
    padding: "15px",
    borderRadius: "12px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
  },

  storeName: {
    color: "#1e1e1e", // 🔥 שלא יהיה לבן
    marginBottom: "5px",
  },

  address: {
    color: "#555",
    fontSize: "14px",
  },

  distance: {
    color: "#777",
    fontSize: "14px",
  },

  kosher: {
    color: "green",
    fontSize: "13px",
  },

  button: {
    padding: "8px 12px",
    backgroundColor: "#4e73df",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  myOrdersBtn: {
    marginBottom: "20px",
    padding: "10px 15px",
    backgroundColor: "#2c3e50",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    flexDirection: "column",
    color: "#1e1e1e", // 🔥 גם כאן
  },
};
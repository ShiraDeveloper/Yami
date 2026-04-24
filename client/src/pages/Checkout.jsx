import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(saved);
  }, []);

  // 🌍 המרת כתובת ל־lat/lng
  const getCoordinates = async (address) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );

    const data = await res.json();

    if (!data || data.length === 0) {
      throw new Error("Address not found");
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  };

  // 📍 מיקום נוכחי
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => reject("LOCATION_DENIED")
      );
    });
  };

  const handleCheckout = async () => {
    setError("");

    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }

    // ❗ רק חנות אחת
    const storeId = cart[0]?.storeId;
    const sameStore = cart.every(item => item.storeId === storeId);

    if (!sameStore) {
      setError("You can order from one store only");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      let lat, lng;

      // 🔥 לוגיקה חכמה
      if (address && address.trim() !== "") {
        const coords = await getCoordinates(address);
        lat = coords.lat;
        lng = coords.lng;
      } else {
        const coords = await getCurrentLocation();
        lat = coords.lat;
        lng = coords.lng;
      }

      const dto = {
        storeId: storeId,
        deliveryLatitude: lat,
        deliveryLongitude: lng,
        orderItems: cart.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity
        }))
      };

      const response = await fetch(
        "https://localhost:7234/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(dto)
        }
      );

      let data = {};
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        console.log("SERVER ERROR:", data);
        setError(data.message || "Failed to create order");
        return;
      }

      // ✅ הצלחה
      localStorage.removeItem("cart");
      alert("Order created successfully!");
      navigate("/my-orders");

    } catch (err) {
      console.error(err);

      if (err === "LOCATION_DENIED") {
        setError("Please allow location or enter address");
      } else if (err.message === "Address not found") {
        setError("Invalid address");
      } else {
        setError("Server error");
      }
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Checkout</h1>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.section}>
        <h3>Delivery Address</h3>

        <input
          type="text"
          placeholder="Enter address (or leave empty to use current location)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.section}>
        <h3>Order Summary</h3>

        {cart.map(item => (
          <div key={item.id} style={styles.item}>
            <span>{item.name}</span>
            <span>
              ₪{item.price} × {item.quantity}
            </span>
          </div>
        ))}

        <h2 style={styles.total}>Total: ₪{total}</h2>
      </div>

      <button
        style={styles.button}
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? "Processing..." : "Place Order"}
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    maxWidth: "600px",
    margin: "0 auto",
  },

  title: {
    textAlign: "center",
    marginBottom: "20px",
  },

  section: {
    marginBottom: "20px",
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "10px",
  },

  input: {
    display: "block",
    width: "100%",
    marginBottom: "10px",
    padding: "8px",
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "5px",
  },

  total: {
    marginTop: "10px",
  },

  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

  error: {
    color: "red",
    textAlign: "center",
  },
};
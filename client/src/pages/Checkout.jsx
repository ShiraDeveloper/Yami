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

  // 1. המרת כתובת שהוקלדה לקואורדינטות (עבור הזמנה לחבר/כתובת אחרת)
  const getCoordinates = async (manualAddress) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}`
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

  // 2. המרת קואורדינטות לכתובת טקסטואלית (עבור מיקום נוכחי)
  const getAddressFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      return data.display_name || "Unknown Location";
    } catch (err) {
      return "Current Location (Address lookup failed)";
    }
  };

  // 3. שליפת מיקום ה-GPS של המכשיר
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("GEOLOCATION_NOT_SUPPORTED");
        return;
      }
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

      let lat, lng, finalAddress;

      // לוגיקה חכמה: אם הוקלדה כתובת - מחשבים קואורדינטות. אם ריק - לוקחים GPS וממירים לטקסט.
      if (address && address.trim() !== "") {
        const coords = await getCoordinates(address);
        lat = coords.lat;
        lng = coords.lng;
        finalAddress = address; 
      } else {
        const coords = await getCurrentLocation();
        lat = coords.lat;
        lng = coords.lng;
        // המרה לטקסט כדי שהשליח יראה כתובת ב-DB
        finalAddress = await getAddressFromCoords(lat, lng);
      }

      // בניית ה-DTO המדויק עבור ה-API ב-C#
const dto = {
  storeId: storeId,
  deliveryLatitude: lat,       // התאמה ל-DeliveryLatitude
  deliveryLongitude: lng,      // התאמה ל-DeliveryLongitude
  address: finalAddress,       // התאמה ל-Address
  orderItems: cart.map(item => ({
    menuItemId: item.id,       // וודאי שב-OrderItemCreateDto השם הוא menuItemId
    quantity: item.quantity
  }))
};

      const response = await fetch("https://localhost:7234/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dto)
      });

      let data = {};
      try {
        data = await response.json();
      } catch (e) {}

      if (!response.ok) {
        setError(data.message || "Failed to create order");
        return;
      }

      // הצלחה
      localStorage.removeItem("cart");
      alert("Order created successfully!");
      navigate("/my-orders");

    } catch (err) {
      console.error(err);
      if (err === "LOCATION_DENIED") {
        setError("Please allow location access or enter an address manually.");
      } else if (err.message === "Address not found") {
        setError("The address you entered could not be found.");
      } else {
        setError("An error occurred while processing your order.");
      }
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Checkout</h1>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.section}>
        <h3>Delivery Details</h3>
        <p style={styles.label}>Enter address for a friend, or leave empty for your current location:</p>
        <input
          type="text"
          placeholder="Street, City, House Number..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.section}>
        <h3>Order Summary</h3>
        {cart.map(item => (
          <div key={item.id} style={styles.item}>
            <span>{item.name} x {item.quantity}</span>
            <span>₪{item.price * item.quantity}</span>
          </div>
        ))}
        <hr />
        <h2 style={styles.total}>Total: ₪{total}</h2>
      </div>

      <button
        style={loading ? {...styles.button, backgroundColor: '#ccc'} : styles.button}
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? "Processing..." : "Place Order Now"}
      </button>
    </div>
  );
}

const styles = {
  container: { padding: "30px", maxWidth: "600px", margin: "0 auto", fontFamily: "Arial, sans-serif" },
  title: { textAlign: "center", color: "#333" },
  errorBox: { backgroundColor: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "5px", marginBottom: "20px", textAlign: "center" },
  section: { marginBottom: "25px", padding: "20px", border: "1px solid #eee", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },
  label: { fontSize: "14px", color: "#666", marginBottom: "8px" },
  input: { width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ddd", boxSizing: "border-box" },
  item: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  total: { textAlign: "right", margin: "10px 0" },
  button: { width: "100%", padding: "15px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }
};
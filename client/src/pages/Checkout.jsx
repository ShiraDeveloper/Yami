import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(saved);
  }, []);

  const getCoordinates = async (manualAddress) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}`
    );
    const data = await res.json();
    if (!data || data.length === 0) throw new Error("כתובת לא נמצאה במערכת המפות");
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  };

  const getAddressFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      return data.display_name || "מיקום נוכחי";
    } catch (err) {
      return "מיקום נוכחי";
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject("הדפדפן אינו תומך בגישה למיקום");
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject("גישה למיקום נדחתה על ידי המשתמש")
      );
    });
  };

  const handleCheckout = async () => {
    setError("");

    if (cardNumber.length !== 16) {
      setError("מספר כרטיס חייב להכיל בדיוק 16 ספרות.");
      return;
    }
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiry)) {
      setError("פורמט תוקף לא תקין (MM/YY).");
      return;
    }
    if (cvv.length < 3) {
      setError("קוד CVV לא תקין.");
      return;
    }
    if (!cardName.trim()) {
      setError("נא להזין את שם בעל הכרטיס.");
      return;
    }

    if (cart.length === 0) {
      setError("הסל שלך ריק.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }

      let lat, lng, finalAddress;

      if (address && address.trim() !== "") {
        const coords = await getCoordinates(address);
        lat = coords.lat; lng = coords.lng;
        finalAddress = address;
      } else {
        const coords = await getCurrentLocation();
        lat = coords.lat; lng = coords.lng;
        finalAddress = await getAddressFromCoords(lat, lng);
      }

      const dto = {
        storeId: Number(cart[0]?.storeId),
        deliveryLatitude: parseFloat(lat),
        deliveryLongitude: parseFloat(lng),
        address: finalAddress || "",
        orderItems: cart.map(item => ({
          menuItemId: Number(item.id),
          quantity: Number(item.quantity)
        }))
      };

      const response = await fetch("https://localhost:7234/api/Orders/create", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(dto)
      });

      if (response.status === 401) {
          throw new Error("אינך מחובר או שהחיבור פג תוקף");
      }

      if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(errorMsg || "נכשל ביצירת הזמנה");
      }

      localStorage.removeItem("cart");
      alert("התשלום בוצע בהצלחה וההזמנה התקבלה!");
      navigate("/my-orders");

    } catch (err) {
      console.error(err);
      setError(err.message || "אירעה שגיאה בתהליך ההזמנה.");
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>סיכום הזמנה ותשלום</h1>      

      <div style={styles.section}>
        <h3>📍 פרטי משלוח</h3>
        <p style={styles.label}>כתובת למשלוח (השאר ריק לשימוש ב-GPS):</p>
        <input
          type="text"
          placeholder="עיר, רחוב ומספר בית..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.section}>
        <h3>💳 פרטי תשלום (סימולציה)</h3>
        <input
          type="text"
          placeholder="שם בעל הכרטיס"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          style={{...styles.input, marginBottom: "10px"}}
        />
        <input
          type="text"
          placeholder="מספר כרטיס (16 ספרות)"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
          style={{...styles.input, marginBottom: "10px"}}
        />
        <div style={{display: "flex", gap: "10px"}}>
          <input
            type="text"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => {
              let v = e.target.value.replace(/\D/g, '');
              if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
              setExpiry(v);
            }}
            maxLength="5"
            style={styles.input}
          />
          <input
            type="password"
            placeholder="CVV"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.section}>
        <h3>🛒 סיכום סל</h3>
        {cart.map(item => (
          <div key={item.id} style={styles.item}>
            <span>{item.name} (x{item.quantity})</span>
            <span>₪{item.price * item.quantity}</span>
          </div>
        ))}
        <hr style={{border: '0.5px solid #eee'}} />
        <h2 style={styles.total}>סה"כ לתשלום: ₪{total}</h2>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <button
        style={loading ? {...styles.button, backgroundColor: '#E5E9F2'} : styles.button}
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? "מעבד נתונים..." : "בצע הזמנה עכשיו"}
      </button>
    </div>
  );
}

const styles = {
  container: { padding: "30px", maxWidth: "550px", margin: "0 auto", fontFamily: "Segoe UI, sans-serif", direction: "rtl" },
  title: { textAlign: "center", color: "#2d3748", marginBottom: "30px" },
  errorBox: { backgroundColor: "#fff5f5", color: "#c53030", padding: "12px", borderRadius: "8px", marginBottom: "20px", textAlign: "center", border: "1px solid #feb2b2" },
  section: { marginBottom: "20px", padding: "20px", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 16px rgba(31, 41, 55, 0.06)", border: "1px solid #edf2f7" },
  label: { fontSize: "13px", color: "#718096", marginBottom: "8px" },
  input: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", boxSizing: "border-box", outline: "none", transition: "border 0.2s" },
  item: { display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#4a5568" },
  total: { textAlign: "left", margin: "15px 0", color: "#2d3748" },
  button: { width: "100%", padding: "16px", backgroundColor: "#38a169", color: "white", border: "none", borderRadius: "10px", fontSize: "18px", fontWeight: "bold", cursor: "pointer", transition: "all 0.3s" }
};
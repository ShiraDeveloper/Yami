import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const saved = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(saved);
  };

const saveCart = (updated) => {
  setCart(updated);
  localStorage.setItem("cart", JSON.stringify(updated));

  window.dispatchEvent(new Event("cartUpdated"));
};

  // ✅ חסימה של כמה חנויות
  const addToCartSafe = (product) => {
    if (cart.length > 0 && cart[0].storeId !== product.storeId) {
      alert("You can order only from one store");
      return;
    }

    saveCart([...cart, product]);
  };

  const increase = (id) => {
    const updated = cart.map(item =>
      item.id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    saveCart(updated);
  };

  const decrease = (id) => {
    const updated = cart
      .map(item =>
        item.id === id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter(item => item.quantity > 0);

    saveCart(updated);
  };

  const removeItem = (id) => {
    const updated = cart.filter(item => item.id !== id);
    saveCart(updated);
  };

  // ================= PRICES =================

  const itemsTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ✅ מחיר משלוח פשוט לפי כמות (זמני)
  const deliveryPrice =
    cart.length === 0
      ? 0
      : itemsTotal < 50
      ? 10
      : itemsTotal < 100
      ? 15
      : 20;

  const total = itemsTotal + deliveryPrice;

  // ================= UI =================

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>My Cart 🧺</h1>

      {cart.length === 0 ? (
        <p style={styles.empty}>Your cart is empty</p>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.id} style={styles.card}>
              <div>
                <h3 style={styles.name}>{item.name}</h3>
                <p style={styles.text}>Price: ₪{item.price}</p>

                <div style={styles.qty}>
                  <button style={styles.btn} onClick={() => decrease(item.id)}>-</button>

                  <span style={styles.qtyNumber}>{item.quantity}</span>

                  <button style={styles.btn} onClick={() => increase(item.id)}>+</button>
                </div>
              </div>

              <button style={styles.remove} onClick={() => removeItem(item.id)}>
                Remove
              </button>
            </div>
          ))}

          <div style={styles.footer}>
            <p style={styles.text}>Items: ₪{itemsTotal}</p>
            <p style={styles.text}>Delivery: ₪{deliveryPrice}</p>

            <h2 style={styles.total}>Total: ₪{total}</h2>

            <button
              style={styles.checkout}
              onClick={() => navigate("/checkout")}
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    backgroundColor: "#F8FAFC",
    minHeight: "100vh",
    color: "#1F2937", // טקסט כהה כללי
  },

  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#1F2937",
  },

  empty: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: "16px",
  },

  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: "15px",
    marginBottom: "10px",
    borderRadius: "10px",
    boxShadow: "0 4px 16px rgba(31, 41, 55, 0.06)",
  },

  name: {
    margin: 0,
    color: "#1F2937",
  },

  text: {
    color: "#1F2937",
  },

  qty: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "10px",
  },

  qtyNumber: {
    color: "#1F2937",
    fontWeight: "bold",
  },

  btn: {
    padding: "4px 10px",
    backgroundColor: "#E5E9F2",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    color: "#1F2937",
  },

  remove: {
    backgroundColor: "#EF5A6F",
    color: "#ffffff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  footer: {
    marginTop: "20px",
    textAlign: "center",
  },

  total: {
    color: "#1F2937",
  },

  checkout: {
    marginTop: "10px",
    padding: "10px 20px",
    backgroundColor: "#7B8FF5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
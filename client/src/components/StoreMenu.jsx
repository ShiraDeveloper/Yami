import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function StoreMenu() {
  const { id } = useParams(); // 🔥 זה ה-ID האמיתי

  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/menu/store/${id}`
        );

        const data = await res.json();

        console.log("MENU DATA:", data);

        setMenus(Array.isArray(data) ? data : data.items || []);
      } catch (err) {
        console.error("Error fetching menus:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMenus();
    }
  }, [id]);

const addToCart = (item) => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  // אם הסל לא ריק ויש חנות אחרת → חוסמים
  if (cart.length > 0 && cart[0].storeId !== item.storeId) {
    alert("You can only order from one store at a time");
    return;
  }

  const existing = cart.find(x => x.id === item.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      storeId: item.storeId, // חשוב מאוד
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
};

  if (loading) return <p>טוען תפריט...</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🍽 תפריט החנות</h1>

      {menus.length === 0 ? (
        <p style={styles.empty}>אין פריטים בתפריט</p>
      ) : (
        <div style={styles.grid}>
          {menus.map((menu) => (
            <div key={menu.id} style={styles.card}>

              <div>
                <h3 style={styles.name}>
                  {menu.itemName || menu.name}
                </h3>

                <p style={styles.category}>
                  {menu.category}
                </p>

                <p style={styles.price}>
                  ₪{menu.price}
                </p>
              </div>

              <button onClick={() => addToCart(menu)} style={styles.button}>
                Add to Cart
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px",
    backgroundColor: "#f5f6fa",
    color: "#1e1e1e", // צבע בסיס לכל הטקסט
    fontFamily: "Arial, sans-serif",
  },

  title: {
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "28px",
    fontWeight: "bold",
    color: "#2c3e50",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "14px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "transform 0.2s ease",
  },

  name: {
    marginBottom: "6px",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e1e1e",
  },

  category: {
    fontSize: "13px",
    color: "#7f8c8d",
    marginBottom: "10px",
  },

  price: {
    fontWeight: "bold",
    fontSize: "18px",
    color: "#27ae60",
    marginBottom: "15px",
  },

  button: {
    backgroundColor: "#4e73df",
    color: "#ffffff",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "0.2s",
  },

  empty: {
    textAlign: "center",
    color: "#7f8c8d",
    fontSize: "16px",
  },
};
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function StoreMenu() {
  const { id } = useParams(); 

  const [menus, setMenus] = useState([]);
  const [store, setStore] = useState(null); // 🌟 שומר את נתוני החנות בשביל ה-IsOpen
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreAndMenu = async () => {
      try {
        setLoading(true);

        // מבצעים שתי קריאות במקביל: לתפריט ולפרטי החנות
        const [menuRes, storeRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/menu/store/${id}`),
          fetch(`${import.meta.env.VITE_API_URL}/api/Stores/${id}`) // 📌 ודאי שזה נתיב ה-API שלך לשליפת חנות לפי ID
        ]);

        const menuData = await menuRes.json();
        setMenus(Array.isArray(menuData) ? menuData : menuData.items || []);

        if (storeRes.ok) {
          const storeData = await storeRes.json();
          setStore(storeData); 
          console.log("STORE DATA:", storeData);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStoreAndMenu();
    }
  }, [id]);

  const addToCart = (item) => {
    // 🛑 בדיקה: אם החנות סגורה, מקפיצים ALERT ועוצרים מיד!
    if (store && !store.isOpen) {
      alert("The store is currently closed, products cannot be added to the cart.");
      return; // מונע מהמוצר להיכנס ל-localStorage
    }

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
        storeId: item.storeId, 
        quantity: 1
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  if (loading) return <p>טוען תפריט...</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🍽 Store menu{store?.name ? `- ${store.name}` : ""}</h1>

      {menus.length === 0 ? (
        <p style={styles.empty}>There are no items in the menu</p>
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

              {/* 🌟 הכפתור המקורי שלך ללא שינויי עיצוב או דיסאבלד */}
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
    backgroundColor: "#F8FAFC",
    color: "#1F2937", 
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
  },
  title: {
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1F2937",
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
    boxShadow: "0 4px 16px rgba(31, 41, 55, 0.06)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "transform 0.2s ease",
  },
  name: {
    marginBottom: "6px",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1F2937",
  },
  category: {
    fontSize: "13px",
    color: "#6B7280",
    marginBottom: "10px",
  },
  price: {
    fontWeight: "bold",
    fontSize: "18px",
    color: "#10B981",
    marginBottom: "15px",
  },
  button: {
    backgroundColor: "#7B8FF5",
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
    color: "#6B7280",
    fontSize: "16px",
  },
};
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

// המיפוי המדויק לפי ה-Enum של ה-Backend שלך
const CATEGORY_MAP = {
  1: "Main Courses",
  2: "Appetizers",
  3: "Salads",
  4: "Sandwiches",
  5: "Pizzas",
  6: "Pastas",
  7: "Burgers",
  8: "Desserts",
  9: "Drinks",
  10: "Coffee",
  11: "Alcohol",
  12: "Kids Meals"
};

export default function StoreMenu() {
  const { id } = useParams(); 

  const [menus, setMenus] = useState([]);
  const [store, setStore] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  
  // State למעקב אחר הסל הנוכחי לצורך תצוגת הכמויות (+ / -)
  const [cart, setCart] = useState([]);
  // State עבור שורת החיפוש החופשי
  const [searchQuery, setSearchQuery] = useState("");
  // State עבור סינון קטגוריה נבחרת (null אומר שהכל מוצג)
  const [selectedCategory, setSelectedCategory] = useState(null);

  // טעינת הסל הראשונית מ-localStorage
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(savedCart);
  }, []);

  useEffect(() => {
    const fetchStoreAndMenu = async () => {
      try {
        setLoading(true);
        const [menuRes, storeRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/menu/store/${id}`),
          fetch(`${import.meta.env.VITE_API_URL}/api/Stores/${id}`) 
        ]);

        const menuData = await menuRes.json();
        setMenus(Array.isArray(menuData) ? menuData : menuData.items || []);

        if (storeRes.ok) {
          const storeData = await storeRes.json();
          setStore(storeData); 
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

  // פונקציית עזר לקבלת כמות של מוצר ספציפי בסל
  const getItemQuantity = (itemId) => {
    const found = cart.find(x => x.id === itemId);
    return found ? found.quantity : 0;
  };

  // עדכון הסל: הוספה והעלאת כמות (+ / -)
  const updateQuantity = (item, amount) => {
    if (store && !store.isOpen && amount > 0) {
      alert("The store is currently closed, products cannot be added to the cart.");
      return;
    }

    let currentCart = JSON.parse(localStorage.getItem("cart")) || [];

    if (amount > 0 && currentCart.length > 0 && currentCart[0].storeId !== item.storeId) {
      alert("You can only order from one store at a time");
      return;
    }

    const existingIndex = currentCart.findIndex(x => x.id === item.id);

    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += amount;
      if (currentCart[existingIndex].quantity <= 0) {
        currentCart.splice(existingIndex, 1);
      }
    } else if (amount > 0) {
      currentCart.push({
        id: item.id,
        name: item.itemName || item.name,
        price: item.price,
        storeId: item.storeId, 
        quantity: 1
      });
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));
    setCart(currentCart); 
    window.dispatchEvent(new Event("cartUpdated"));
  };

  if (loading) return <p style={{ color: "#6B7280", textAlign: "center", marginTop: "50px" }}>Loading menu...</p>;

  // שליפת כל הקטגוריות הקיימות מתוך המוצרים שחזרו מה-API (בשביל כפתורי הסינון המהיר)
  const availableCategories = Array.from(
    new Set(menus.map(item => item.category !== undefined ? item.category : 0))
  );

  // סינון משולב: גם לפי שורת החיפוש וגם לפי הקטגוריה שנבחרה בכפתורים
  const filteredMenus = menus.filter(menu => {
    const name = (menu.itemName || menu.name || "").toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    
    const categoryId = menu.category !== undefined ? menu.category : 0;
    const matchesCategory = selectedCategory === null || categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // קיבוץ מוצרים לפי קטגוריות מילוליות מתוך ה-MAP
  const groupedMenu = filteredMenus.reduce((acc, item) => {
    const categoryId = item.category !== undefined ? item.category : 0;
    const categoryName = CATEGORY_MAP[categoryId] || "Other Items";
    
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(item);
    return acc;
  }, {});

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🍽 {store?.name ? store.name : "Store Menu"}</h1>

      {/* אזור החיפוש והסינון בעיצוב העגול והנקי החדש */}
      <div style={styles.searchWrapper}>
{/* אזור תיבת החיפוש החופשי בעיצוב כמוסה עגול ורך */}
<div style={styles.searchContainer}>
  <input
    type="text"
    placeholder="Search store..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    onFocus={() => setIsFocused(true)}
    onBlur={() => setIsFocused(false)}
    style={{
      ...styles.searchInput,
      ...(isFocused ? styles.searchInputFocus : {}) // מחיל את עיצוב הפוקוס כשהתיבה פעילה
    }}
  />
</div>
        {/* כפתורי סינון מהיר לפי קטגוריות */}
        <div style={styles.filterBadgeRow}>
          <button 
            onClick={() => setSelectedCategory(null)}
            style={{
              ...styles.filterBadge,
              backgroundColor: selectedCategory === null ? "#7B8FF5" : "#E2E8F0",
              color: selectedCategory === null ? "#ffffff" : "#475569"
            }}
          >
            All Items
          </button>
          
          {availableCategories.map(catId => (
            <button
              key={catId}
              onClick={() => setSelectedCategory(catId)}
              style={{
                ...styles.filterBadge,
                backgroundColor: selectedCategory === catId ? "#7B8FF5" : "#E2E8F0",
                color: selectedCategory === catId ? "#ffffff" : "#475569"
              }}
            >
              {CATEGORY_MAP[catId] || "Other"}
            </button>
          ))}
        </div>
      </div>

      {filteredMenus.length === 0 ? (
        <p style={styles.empty}>No items match your criteria.</p>
      ) : (
        // מעבר על פני הקטגוריות המקובצות והצגתן בכותרות (מיושרות לשמאל)
        Object.keys(groupedMenu).map((categoryName) => (
          <div key={categoryName} style={styles.categorySection}>
            <h2 style={styles.categoryTitle}>{categoryName}</h2>
            
            <div style={styles.grid}>
              {groupedMenu[categoryName].map((menu) => {
                const quantity = getItemQuantity(menu.id);
                
                const finalImageUrl = menu.imageUrl
                  ? (menu.imageUrl.startsWith("http") ? menu.imageUrl : `${import.meta.env.VITE_API_URL}/${menu.imageUrl}`)
                  : "https://via.placeholder.com/150/7B8FF5/fff?text=YAMI";

                return (
                  <div key={menu.id} style={styles.card}>
                    <div style={styles.imageWrapper}>
                      <img 
                        src={finalImageUrl} 
                        alt={menu.itemName || menu.name} 
                        style={styles.image}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/150/7B8FF5/fff?text=YAMI";
                        }}
                      />
                      
                      <div style={styles.quantityBadge}>
                        {quantity === 0 ? (
                          <button onClick={() => updateQuantity(menu, 1)} style={styles.plusOnlyBtn}>
                            +
                          </button>
                        ) : (
                          <div style={styles.selectorRow}>
                            <button onClick={() => updateQuantity(menu, 1)} style={styles.actionBtn}>+</button>
                            <span style={styles.qtyText}>{quantity}</span>
                            <button onClick={() => updateQuantity(menu, -1)} style={styles.actionBtn}>-</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={styles.cardBody}>
                      <h3 style={styles.name}>{menu.itemName || menu.name}</h3>
                      <p style={styles.price}>₪{Number(menu.price).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px 20px",
    backgroundColor: "#F8FAFC", 
    color: "#1F2937", 
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  },
  title: {
    textAlign: "center",
    marginBottom: "24px",
    fontSize: "28px",
    fontWeight: "700",
    color: "#1F2937",
  },
  searchWrapper: {
    maxWidth: "600px",
    margin: "0 auto 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px"
  },
searchContainer: {
  maxWidth: "360px", // הקטנה נוספת של התיבה למראה קומפקטי ומדויק
  margin: "0 auto 30px",
  width: "100%",
},
searchInput: {
  width: "100%",
  padding: "8px 18px", // ריפוד פנימי מוקטן ועדין
  borderRadius: "30px", // שומר על המראה המעוגל
  border: "1px solid #E2E8F0",
  backgroundColor: "#ffffff",
  color: "#1F2937",
  fontSize: "14px", // גופן קטן ומהודק יותר
  outline: "none",
  boxSizing: "border-box",
  boxShadow: "0 2px 6px rgba(148, 163, 184, 0.04)",
  transition: "all 0.2s ease-in-out", // מעבר חלק ויפה בזמן הלחיצה
},
searchInputFocus: {
  border: "1px solid #C7D2FE", // גבול סגלגל רך התואם לתמונה
  boxShadow: "0 0 0 4px rgba(123, 143, 245, 0.15)", // הילה חלקה ויוקרתית מסביב לתיבה בזמן פוקוס
  backgroundColor: "#ffffff",
},
  filterBadgeRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center"
  },
  filterBadge: {
    padding: "8px 18px",
    borderRadius: "20px", // כפתורי סינון מעוגלים (Pills)
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
    transition: "all 0.2s ease",
  },
  categorySection: {
    maxWidth: "1000px",
    margin: "0 auto 40px",
  },
  categoryTitle: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "16px",
    borderBottom: "2px solid #E2E8F0",
    paddingBottom: "8px",
    color: "#1E293B",
    textAlign: "left", // שינוי לשמאל לבקשתך
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "24px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(31, 41, 55, 0.05)",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #F1F5F9",
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: "160px",
    backgroundColor: "#F1F5F9",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  quantityBadge: {
    position: "absolute",
    top: "12px",
    left: "12px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(8px)",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  plusOnlyBtn: {
    width: "36px",
    height: "36px",
    backgroundColor: "#7B8FF5", 
    color: "#ffffff",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  selectorRow: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
  },
  actionBtn: {
    width: "32px",
    height: "32px",
    backgroundColor: "transparent",
    color: "#7B8FF5",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    padding: "0 8px",
    color: "#1F2937",
    fontWeight: "600",
    fontSize: "14px",
    minWidth: "16px",
    textAlign: "center",
  },
  cardBody: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    textAlign: "left", // שינוי לשמאל לבקשתך
  },
  name: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#1F2937",
  },
  price: {
    margin: 0,
    fontWeight: "700",
    fontSize: "16px",
    color: "#10B981", 
  },
  empty: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: "16px",
    marginTop: "30px",
  },
};
import { useNavigate } from "react-router-dom";

// פונקציית עזר לפענוח הטוקן (העתקתי מהקוד הקודם שלך)
function getRoleFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload?.role || payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  } catch {
    return null;
  }
}

export default function Navbar() {
  const navigate = useNavigate();
  const role = getRoleFromToken();

  const logout = () => {
    localStorage.clear(); // מנקה גם טוקן וגם עגלה
    navigate("/login");
  };

  return (
    <div style={styles.navbar}>
      <h3 style={styles.logo} onClick={() => navigate(role === "Delivery" ? "/courier" : "/stores")}>
        Yami 🍱
      </h3>

      <div style={styles.links}>
        {/* כפתורים שמופיעים רק ללקוח (Customer) */}
        {role === "Customer" && (
          <>
            <button onClick={() => navigate("/stores")}>Stores</button>
            <button onClick={() => navigate("/cart")}>🧺 Cart</button>
            <button onClick={() => navigate("/my-orders")}>My Orders</button>
          </>
        )}

        {/* כפתורים שמופיעים רק לשליח (Delivery) */}
        {role === "Delivery" && (
          <>
            <button onClick={() => navigate("/courier")}>Dashboard</button>
            <button onClick={() => navigate("/courier-map")}>Active Route</button>
          </>
        )}

        {/* כפתור Logout מופיע תמיד למי שמחובר */}
        {role && (
          <button onClick={logout} style={styles.logout}>
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  // השארתי את הסטייל שלך בדיוק כפי שהיה
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 25px",
    backgroundColor: "#4e73df",
    color: "white",
  },
  logo: { cursor: "pointer", margin: 0 },
  links: { display: "flex", gap: "10px" },
  logout: {
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
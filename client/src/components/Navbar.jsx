import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    navigate("/login");
  };

  return (
    <div style={styles.navbar}>
      <h3 style={styles.logo} onClick={() => navigate("/stores")}>
        Yami 🍱
      </h3>

      <div style={styles.links}>
        <button onClick={() => navigate("/stores")}>
          Stores
        </button>

        <button onClick={() => navigate("/cart")}>
          🧺 Cart
        </button>

        <button onClick={() => navigate("/live-courier-map")}>
          Live Courier Map
        </button>


        <button onClick={() => navigate("/my-orders")}>
          My Orders
        </button>

        <button onClick={logout} style={styles.logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 25px",
    backgroundColor: "#4e73df",
    color: "white",
  },

  logo: {
    cursor: "pointer",
    margin: 0,
  },

  links: {
    display: "flex",
    gap: "10px",
  },

  logout: {
    backgroundColor: "red",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
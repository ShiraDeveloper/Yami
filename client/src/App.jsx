import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StoreMenu from "./components/StoreMenu";
import StoreList from "./components/StoreList";
import MyOrders from "./pages/MyOrders";
import Navbar from "./components/Navbar";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import LiveCourierMap from "./pages/LiveCourierMap";
import TrackOrder from "./pages/TrackOrder";
import CourierDashboard from "./pages/CourierDashboard";

function getRoleFromToken() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
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

function AppContent() {
  const location = useLocation();
  const role = getRoleFromToken();
  const [newOffer, setNewOffer] = useState(null); // סטייט גלובלי להצעה חדשה

  const hideNavbarRoutes = ["/", "/register", "/login"];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);

  // לוגיקה גלובלית לבדיקת הצעות - תרוץ מכל עמוד אם השליח מחובר
  useEffect(() => {
    if (role !== "Delivery") return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/courier/check-for-offers'); // נתיב ה-API שלך
        const data = await response.json();
        if (data && data.offer) {
          setNewOffer(data.offer);
        }
      } catch (err) {
        console.error("Error checking offers", err);
      }
    }, 10000); // בדיקה כל 10 שניות

    return () => clearInterval(interval);
  }, [role]);

  if (location.pathname === "/" && role) {
    if (role === "Delivery") return <Navigate to="/courier" replace />;
    if (role === "Admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/stores" replace />;
  }

  return (
    <>
      {shouldShowNavbar && <Navbar />}

      {/* התראה גלובלית שתקפוץ מעל הכל אם יש הצעה חדשה */}
      {newOffer && (
        <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999, background: '#008080', color: '#fff', padding: '15px', borderRadius: '8px' }}>
          יש לך הצעת משלוח חדשה!
          <button onClick={() => { setNewOffer(null); window.location.href = '/courier'; }}>
            צפה בהצעה
          </button>
        </div>
      )}
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/stores" element={<StoreList />} />
        <Route path="/store/:id" element={<StoreMenu />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/live-courier-map" element={<LiveCourierMap />} />
        <Route path="/track/:orderId" element={<TrackOrder />} />
        <Route path="/courier" element={<CourierDashboard newOffer={newOffer} />} />
        <Route path="/courier-map" element={<LiveCourierMap />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
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

// פונקציית עזר לפענוח הטוקן בטעינת האפליקציה
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

  const hideNavbarRoutes = ["/", "/register"];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);

  // לוגיקה לניתוב אוטומטי של משתמש שכבר מחובר ומנסה להגיע לדף הלוגין ("/")
  if (location.pathname === "/" && role) {
    if (role === "Delivery") return <Navigate to="/courier" replace />;
    if (role === "Admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/stores" replace />;
  }

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      
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
        <Route path="/courier" element={<CourierDashboard />} />
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
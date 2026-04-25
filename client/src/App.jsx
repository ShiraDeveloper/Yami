import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/stores" element={<StoreList />} />
        <Route path="/store/:id" element={<StoreMenu />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/live-courier-map" element={<LiveCourierMap />} />
        <Route path="/track/:orderId" element={<TrackOrder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
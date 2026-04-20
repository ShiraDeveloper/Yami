import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StoreMenu from "./components/StoreMenu";
import StoreList from "./components/StoreList";
import MyOrders from "./pages/MyOrders";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/stores" element={<StoreList />} />
        <Route path="/store/:id" element={<StoreMenu />} />
        <Route path="/my-orders" element={<MyOrders />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
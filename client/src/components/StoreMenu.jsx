import React, { useState, useEffect } from "react";

const StoreMenu = ({ storeId, customerId }) => {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [orderStatus, setOrderStatus] = useState("");

  // --- Fetch menu from API asynchronously ---
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`https://localhost:5001/api/stores/${storeId}/menu`);
        if (!res.ok) throw new Error("Error loading menu");
        const data = await res.json();
        setMenu(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMenu(false);
      }
    };

    fetchMenu();
  }, [storeId]);

  // --- Cart functions ---
  const addToCart = (item) => setCart([...cart, item]);
  const removeFromCart = (itemId) => setCart(cart.filter((item) => item.id !== itemId));
  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  // --- Place order function ---
  const placeOrder = async () => {
    if (cart.length === 0) return;

    const orderPayload = {
      CustomerId: customerId,
      StoreId: storeId,
      Items: cart.map((item) => ({ ProductId: item.id, Quantity: 1 })),
      DeliveryLatitude: 32.0853,
      DeliveryLongitude: 34.7818,
    };

    try {
      setOrderStatus("Sending order...");
      const res = await fetch("https://localhost:5001/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) throw new Error("Error placing order");

      const result = await res.json();
      console.log("Order placed successfully:", result);
      setOrderStatus("Order placed successfully!");
      setCart([]); // empty the cart
    } catch (err) {
      console.error(err);
      setOrderStatus("Error placing order");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Store Menu</h1>

      {loadingMenu ? (
        <p>Loading menu...</p>
      ) : (
        <ul>
          {menu.map((item) => (
            <li key={item.id} style={{ marginBottom: "10px" }}>
              {item.name} - ${item.price}{" "}
              <button onClick={() => addToCart(item)}>Add to cart</button>
            </li>
          ))}
        </ul>
      )}

      <h2>My Cart</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <ul>
          {cart.map((item) => (
            <li key={item.id}>
              {item.name} - ${item.price}{" "}
              <button onClick={() => removeFromCart(item.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}

      <p>Total: ${totalPrice}</p>
      <button onClick={placeOrder} disabled={cart.length === 0}>
        Place Order
      </button>

      {orderStatus && <p>{orderStatus}</p>}
    </div>
  );
};

export default StoreMenu;

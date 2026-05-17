import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

export default function CourierTracker({ orderId, courierId }) {
  const connectionRef = useRef(null);
  const watchIdRef = useRef(null);
  const [status, setStatus] = useState("disconnected");

  // 🧠 מניעת ספאם של שליחת מיקומים (throttle)
  const lastSentRef = useRef(0);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7234/trackingHub")
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    const startConnection = async () => {
      try {
        setStatus("connecting");

        await connection.start();

        setStatus("connected");

        console.log("🚚 Courier connected to tracking hub");

        startTracking();
      } catch (err) {
        console.error("SignalR connection error:", err);
        setStatus("error");
      }
    };

    // 📡 שליחת מיקום בצורה חכמה
    const startTracking = () => {
      if (!navigator.geolocation) {
        console.error("Geolocation not supported");
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const now = Date.now();

          // ⏱️ שולח רק כל 2-3 שניות (לא מציף את השרת)
          if (now - lastSentRef.current < 2500) return;

          lastSentRef.current = now;

          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          if (connectionRef.current?.state === "Connected") {
            connectionRef.current.invoke(
              "UpdateCourierLocation",
              courierId,
              orderId,
              lat,
              lng
            );
          }
        },
        (err) => {
          console.error("GPS error:", err);
          setStatus("gps_error");
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 5000,
        }
      );
    };

    startConnection();

    return () => {
      console.log("🧹 Cleaning courier tracker...");

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [orderId, courierId]);

  return (
    <div style={styles.container}>
      <h3>🚚 Courier Tracking</h3>

      <p>Status: {status}</p>

      <p>Order: #{orderId}</p>
      <p>Courier: #{courierId}</p>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    bottom: 20,
    left: 20,
    background: "white",
    padding: "12px 16px",
    borderRadius: "10px",
    boxShadow: "0 4px 16px rgba(31, 41, 55, 0.06)",
    fontSize: "14px",
    zIndex: 9999,
  },
};
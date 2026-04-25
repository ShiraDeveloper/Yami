import { useEffect, useRef, useState } from "react";
import { GoogleMap, useLoadScript, Marker, Polyline } from "@react-google-maps/api";
import * as signalR from "@microsoft/signalr";

const containerStyle = { width: "100%", height: "100vh" };
const customerLocation = { lat: 32.0853, lng: 34.7818 };

const courierIcon = {
  url: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
  scaledSize: { width: 38, height: 38 },
};

export default function LiveCourierMap({ orderId }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [couriers, setCouriers] = useState({});
  const connectionRef = useRef(null);
  const isConnecting = useRef(false); // למניעת חיבורים כפולים ברינדור כפול

  useEffect(() => {
    // מניעת כניסה כפולה אם חיבור כבר בתהליך
    if (isConnecting.current) return;
    isConnecting.current = true;

    let isMounted = true;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7234/trackingHub")
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      // בדיקה שהחיבור לא התחיל כבר במקום אחר
      if (connection.state !== signalR.HubConnectionState.Disconnected) return;

      try {
        await connection.start();
        if (isMounted && orderId) {
          console.log("SignalR Connected Successfully.");
          await connection.invoke("JoinOrder", Number(orderId));
        }
      } catch (err) {
        // התעלמות משגיאות ביטול (Abort) שנובעות מ-Strict Mode
        if (isMounted && err.name !== "AbortError") {
          console.error("SignalR Connection Error: ", err);
        }
      } finally {
        isConnecting.current = false;
      }
    };

    startConnection();

    connection.on("ReceiveCourierLocation", (courierId, lat, lng) => {
      if (!isMounted) return;
      setCouriers((prev) => {
        const old = prev[courierId];
        if (old) {
          animateMove(courierId, old, { lat, lng });
          return prev;
        }
        return { ...prev, [courierId]: { lat, lng } };
      });
    });

    connectionRef.current = connection;

    return () => {
      isMounted = false;
      isConnecting.current = false;
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop();
      }
    };
  }, [orderId]);

  const animateMove = (id, from, to) => {
    let start = null;
    const step = (t) => {
      if (!start) start = t;
      const progress = Math.min((t - start) / 400, 1);
      const next = {
        lat: from.lat + (to.lat - from.lat) * progress,
        lng: from.lng + (to.lng - from.lng) * progress,
      };
      setCouriers((prev) => ({ ...prev, [id]: next }));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={customerLocation}
      zoom={15}
      options={{ disableDefaultUI: true, zoomControl: true }}
    >
      <Marker position={customerLocation} />
      {Object.entries(couriers).map(([id, pos]) => (
        <Marker key={id} position={pos} icon={courierIcon} />
      ))}
      {Object.entries(couriers).map(([id, pos]) => (
        <Polyline
          key={id}
          path={[pos, customerLocation]}
          options={{ strokeColor: "#2563eb", strokeWeight: 4 }}
        />
      ))}
    </GoogleMap>
  );
}
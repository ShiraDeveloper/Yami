import { useEffect, useRef, useState } from "react";
import { GoogleMap, useLoadScript, Marker, Polyline } from "@react-google-maps/api";
import * as signalR from "@microsoft/signalr";

const containerStyle = { width: "100%", height: "100vh" };
const customerLocation = { lat: 32.0853, lng: 34.7818 };

const courierIcon = typeof window !== "undefined" && window.google ? {
  url: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
  scaledSize: new window.google.maps.Size(38, 38), // שימוש ב-Size הרשמי של גוגל מונע מהאייקון להיעלם
} : null;

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

connection.on("ReceiveCourierLocation", (data) => {
  if (!isMounted || !data) return;
  
  // חילוץ הנתונים מתוך האובייקט שהשרת שלח
  const { courierId, lat, lng } = data; 
  const newPos = { lat, lng };

  console.log(`Courier ${courierId} moved to:`, newPos);

  setCouriers((prev) => {
    const old = prev[courierId];
    if (old) {
      // הפעלת האנימציה החלקה מנקודה לנקודה
      animateMove(courierId, old, newPos);
      return prev;
    }
    // אם זה השליח הראשון שנכנס, נוסיף אותו לסטייט
    return { ...prev, [courierId]: newPos };
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
    {/* המרקר של הלקוח */}
    <Marker position={customerLocation} />

    {/* המרקרים של השליחים על המפה */}
    {Object.entries(couriers).map(([id, pos]) => (
      <Marker key={id} position={pos} icon={courierIcon} />
    ))}

    {/* קווי הציור המחברים בין כל שליח ללקוח */}
    {Object.entries(couriers).map(([id, pos]) => (
      <Polyline
        key={id}
        path={[pos, customerLocation]}
        options={{ 
          strokeColor: "#7B8FF5", // צבע הקו
          strokeWeight: 4,        // עובי הקו
          strokeOpacity: 0.8 
        }}
      />
    ))}
  </GoogleMap>
);}
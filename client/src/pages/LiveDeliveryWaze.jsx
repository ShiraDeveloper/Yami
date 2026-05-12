import { useEffect, useRef, useState } from "react";
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api";
import * as signalR from "@microsoft/signalr";

const containerStyle = { width: "100%", height: "100vh" };
const customerLocation = { lat: 32.0853, lng: 34.7818 };

export default function LiveCourierMap({ orderId }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [courier, setCourier] = useState(null);
  const [directions, setDirections] = useState(null);
  const [eta, setEta] = useState(null);
  
  const connectionRef = useRef(null);
  const isConnecting = useRef(false); // מונע חיבורים כפולים

  useEffect(() => {
    // אם אין orderId או שכבר בתהליך חיבור - עצור
    if (!orderId || isConnecting.current) return;
    isConnecting.current = true;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7234/trackingHub")
      .withAutomaticReconnect()
      .build();

    const start = async () => {
      try {
        await connection.start();
        console.log("✅ Connected to Hub");
        // המרה למספר כדי למנוע שגיאת טיפוס בשרת
        await connection.invoke("JoinOrder", parseInt(orderId));
      } catch (err) {
        console.error("❌ SignalR Error:", err);
      } finally {
        isConnecting.current = false;
      }
    };

    connection.on("ReceiveCourierLocation", (courierId, lat, lng) => {
      setCourier({ lat, lng });
      calculateRoute({ lat, lng });
    });

    start();
    connectionRef.current = connection;

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        isConnecting.current = false;
      }
    };
  }, [orderId]);

  const calculateRoute = (courierPos) => {
    if (!window.google) return;
    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: courierPos,
        destination: customerLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
          setEta(result.routes[0].legs[0].duration.text);
        }
      }
    );
  };

  if (!isLoaded) return <div>טוען מפה...</div>;

  return (
    <div style={{ position: "relative" }}>
      <GoogleMap mapContainerStyle={containerStyle} center={customerLocation} zoom={14}>
        <Marker position={customerLocation} label="בית" />
        {courier && (
          <Marker 
            position={courier} 
            icon={{
              url: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
              scaledSize: new window.google.maps.Size(40, 40)
            }} 
          />
        )}
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
      {eta && <div style={panelStyle}>זמן הגעה משוער: {eta}</div>}
    </div>
  );
}

const panelStyle = {
  position: "absolute", top: 20, right: 20, background: "white",
  padding: "12px 15px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
};
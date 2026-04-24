import { useEffect, useRef, useState } from "react";
import { GoogleMap, useLoadScript, Marker, Polyline } from "@react-google-maps/api";
import * as signalR from "@microsoft/signalr";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

// 📍 יעד לקוח
const customerLocation = {
  lat: 32.0853,
  lng: 34.7818,
};

// 🚴‍♂️ אייקון שליח יציב
const courierIcon = {
  url: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
  scaledSize: { width: 38, height: 38 },
};

// 📍 אייקון יעד
const customerIcon = {
  url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
};

export default function LiveCourierMap({ orderId }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [couriers, setCouriers] = useState({});

  const connectionRef = useRef(null);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7234/trackingHub")
      .withAutomaticReconnect()
      .build();

    connection.start().then(() => {
      connection.invoke("JoinOrder", orderId);
    });

    // 📡 קבלת מיקום שליח
    connection.on("ReceiveCourierLocation", (courierId, lat, lng) => {
      setCouriers((prev) => {
        const old = prev[courierId];

        // 🎯 אנימציה קטנה במקום קפיצה
        if (old) {
          animateMove(courierId, old, { lat, lng });
          return prev;
        }

        return {
          ...prev,
          [courierId]: { lat, lng },
        };
      });
    });

    connectionRef.current = connection;

    return () => connection.stop();
  }, [orderId]);

  // 🎬 תנועה חלקה קטנה
  const animateMove = (id, from, to) => {
    let start = null;

    const step = (t) => {
      if (!start) start = t;
      const progress = Math.min((t - start) / 400, 1);

      const next = {
        lat: from.lat + (to.lat - from.lat) * progress,
        lng: from.lng + (to.lng - from.lng) * progress,
      };

      setCouriers((prev) => ({
        ...prev,
        [id]: next,
      }));

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
      options={{
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      {/* 🏠 יעד לקוח */}
      <Marker position={customerLocation} icon={customerIcon} />

      {/* 🚴‍♂️ שליחים */}
      {Object.entries(couriers).map(([id, pos]) => (
        <Marker
          key={id}
          position={pos}
          icon={courierIcon}
        />
      ))}

      {/* 🛣️ מסלול */}
      {Object.entries(couriers).map(([id, pos]) => (
        <Polyline
          key={id}
          path={[pos, customerLocation]}
          options={{
            strokeColor: "#2563eb",
            strokeOpacity: 0.9,
            strokeWeight: 4,
          }}
        />
      ))}
    </GoogleMap>
  );
}
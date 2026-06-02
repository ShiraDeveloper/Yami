import { useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";
import * as signalR from "@microsoft/signalr";
import { useParams } from "react-router-dom";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const customerLocation = {
  lat: 32.054073,
  lng: 34.960141,
};

const createEmojiIcon = (emoji, size = 32) => {
  if (!window.google) return null;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <text x="50%" y="50%" font-size="${size * 0.75}"
        text-anchor="middle" dominant-baseline="central">
        ${emoji}
      </text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(size, size),
    anchor: new window.google.maps.Point(size / 2, size / 2),
  };
};

export default function TrackOrder() {
  const { orderId } = useParams();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [courier, setCourier] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [emojiIcon, setEmojiIcon] = useState(null);

  const mapRef = useRef(null);
  const connectionRef = useRef(null);
  const courierRef = useRef(null);
  const lastRouteTimeRef = useRef(0);

  const onLoad = (map) => {
    mapRef.current = map;
  };
  // ZOOM
  const fitMapBounds = (pos) => {
    if (!mapRef.current || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(pos);
    bounds.extend(customerLocation);

    mapRef.current.fitBounds(bounds);
  };

  // ================= SIGNALR =================
  useEffect(() => {
    if (!isLoaded) return;

    if (connectionRef.current) return;

    setEmojiIcon(createEmojiIcon("🛵", 32));

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7234/trackingHub", {
        accessTokenFactory: () => localStorage.getItem("token"),
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on("ReceiveCourierLocation", (data) => {
      const newPos = {
        lat: Number(data.lat),
        lng: Number(data.lng),
      };

      const isFirst = !courierRef.current;

      courierRef.current = newPos;
      setCourier(newPos);

      if (isFirst) {
        fitMapBounds(newPos);
        updateRoute(newPos);
        lastRouteTimeRef.current = Date.now();
        return;
      }

      const now = Date.now();
      if (now - lastRouteTimeRef.current > 1000) {
        lastRouteTimeRef.current = now;
        updateRoute(newPos);
      }
    });

    const start = async () => {
      try {
        if (connection.state !== signalR.HubConnectionState.Disconnected) return;

        await connection.start();

        console.log("✅ TRACK CONNECTED");

        await connection.invoke("JoinOrder", Number(orderId));

        console.log("✅ JOINED ORDER:", orderId);
      } catch (err) {
        console.error("TRACK ERROR:", err);
      }
    };

    start();

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  }, [orderId, isLoaded]);

  // ================= ROUTE =================
  const updateRoute = (pos) => {
    if (!window.google) return;

    const service = new window.google.maps.DirectionsService();

    service.route(
      {
        origin: pos,
        destination: customerLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (res, status) => {
        if (status !== "OK") return;

        const path = res.routes[0].overview_path.map((p) => ({
          lat: p.lat(),
          lng: p.lng(),
        }));

        setRoutePath(path);

        const leg = res.routes[0].legs[0];
        setEta(leg.duration.text);
        setDistance(leg.distance.text);
      }
    );
  };

  if (!isLoaded) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>

      {/* ================= TOP CARD  ================= */}
      <div style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        zIndex: 10,
        backgroundColor: "white",
        borderRadius: "18px",
        width: "260px",
        padding: "20px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
      }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
          Live Tracking
        </h3>

        <div style={{ marginTop: 10 }}>
          <div style={{ marginBottom: 12 }}>
            🛵 Courier: {eta || "..."}
          </div>

          <div>
            👤 You: Destination
          </div>
        </div>

        <hr />

        <div>
          <div>Distance: {distance || "--"}</div>
          <div>ETA: {eta || "--"}</div>
        </div>
      </div>

      {/* ================= MAP ================= */}
      <GoogleMap
        onLoad={onLoad}
        mapContainerStyle={containerStyle}
        center={courier || customerLocation}
        zoom={15}
        options={{ disableDefaultUI: true }}
      >
        <Marker position={customerLocation} />

        {courier && emojiIcon && (
          <Marker position={courier} icon={emojiIcon} />
        )}

        {routePath.length > 0 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: "#2563EB",
              strokeWeight: 5,
            }}
          />
        )}
      </GoogleMap>

      {/* ================= BOTTOM CARD ================= */}
      {/* <div style={{
        position: "absolute",
        bottom: "30px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "white",
        padding: "20px",
        borderRadius: "20px",
        width: "80%",
        maxWidth: "600px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
      }}>
        <h2 style={{ textAlign: "center" }}>
          Your delivery is on the way
        </h2>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>ETA: {eta || "--"}</div>
          <div>Distance: {distance || "--"}</div>
        </div>
      </div> */}

    </div>
  );
}
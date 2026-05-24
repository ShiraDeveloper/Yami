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

// Customer Location (Example)
const customerLocation = {
  lat: 32.054073,
  lng: 34.960141,
};

// ------ Helper Function: Converts Emoji to a sharp, proportional SVG Vector Data-URL ------
const createEmojiIcon = (emoji, size = 32) => {
  if (!window.google) return null;

  // Building an SVG that perfectly centers the emoji inside the bounding box
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <text x="50%" y="50%" font-size="${size * 0.75}px" font-family="system-ui, apple-system, sans-serif" dominant-baseline="central" text-anchor="middle">
        ${emoji}
      </text>
    </svg>
  `;

  // Safe encoding of the SVG into a Data URL
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return {
    url: dataUrl,
    scaledSize: new window.google.maps.Size(size, size), // Physical size on the map
    anchor: new window.google.maps.Point(size / 2, size / 2), // Exact center alignment
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

  // State to store the computed vector emoji icon
  const [emojiIcon, setEmojiIcon] = useState(null);

  const mapRef = useRef(null);
  const connectionRef = useRef(null);
  const courierRef = useRef(null);
  const lastRouteTimeRef = useRef(0);

  // ---------------- MAP LOAD ----------------
  const onLoad = (map) => {
    mapRef.current = map;
  };

  // ----- Adjusts map bounds to fit both courier and customer locations -----
  const fitMapBounds = (courierPos) => {
    if (!mapRef.current || !window.google || !courierPos) return;
    
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(new window.google.maps.LatLng(courierPos.lat, courierPos.lng));
    bounds.extend(new window.google.maps.LatLng(customerLocation.lat, customerLocation.lng));
    
    mapRef.current.fitBounds(bounds);
    
    const listener = window.google.maps.event.addListener(mapRef.current, 'bounds_changed', function() {
      if (this.getZoom() > 16) {
        this.setZoom(16); // Prevents excessive automatic zoom-in on first load
      }
      window.google.maps.event.removeListener(listener);
    });
  };

  // ---------------- SIGNALR & ICON CREATION ----------------
  useEffect(() => {
    if (!isLoaded) return; 

    // Create the vector icon with a normal proportional size (32px)
    const calculatedIcon = createEmojiIcon("🛵", 32);
    setEmojiIcon(calculatedIcon);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7234/trackingHub", {
        accessTokenFactory: () => localStorage.getItem("token"),
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveCourierLocation", (data) => {
      const newPos = {
        lat: Number(data.lat),
        lng: Number(data.lng),
      };

      // Detect if this is the very first location payload received from the courier
      const isFirstLocation = courierRef.current === null;

      // Trigger animation and immediate position updates
      animateMarker(courierRef.current || newPos, newPos);
      courierRef.current = newPos;
      fitMapBounds(newPos);

      // Handle path routing and distances without initial delays
      if (isFirstLocation) {
        // First execution: bypass throttle to call the Google API instantly
        lastRouteTimeRef.current = Date.now();
        updateRoute(newPos);
      } else {
        // Ongoing updates: enforce 5-second throttle protection to save API quota
        const now = Date.now();
        if (now - lastRouteTimeRef.current >= 5000) {
          lastRouteTimeRef.current = now;
          updateRoute(newPos);
        }
      }
    });

    connection.start().then(() => {
      connection.invoke("JoinOrder", Number(orderId));
    });

    connectionRef.current = connection;

    return () => connection.stop();
  }, [orderId, isLoaded]);

  // ---------------- SMOOTH ANIMATION ----------------
  const animateMarker = (start, end) => {
    const duration = 800;
    const startTime = performance.now();

    const step = (t) => {
      const progress = Math.min((t - startTime) / duration, 1);

      const pos = {
        lat: start.lat + (end.lat - start.lat) * progress,
        lng: start.lng + (end.lng - start.lng) * progress,
      };

      setCourier(pos);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  // ---------------- UPDATE ROUTE & DISTANCE ----------------
  const updateRoute = (courierPos) => {
    if (!window.google || !courierPos) return;

    const service = new window.google.maps.DirectionsService();

    service.route(
      {
        origin: courierPos,
        destination: customerLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          const path = result.routes[0].overview_path.map((p) => ({
            lat: p.lat(),
            lng: p.lng(),
          }));

          setRoutePath(path);

          const leg = result.routes[0].legs[0];
          setEta(leg.duration.text);
          setDistance(leg.distance.text);
        }
      }
    );
  };

  if (!isLoaded) return <div style={{ padding: 20, textAlign: "center", fontFamily: "sans-serif" }}>Loading Map...</div>;

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative", fontFamily: "system-ui, -apple-system, sans-serif", direction: "ltr" }}>
      
      {/* 1. Top Tracking Card */}
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
        <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", fontWeight: "700", color: "#1F2937" }}>Live Order Tracking</h3>
        
        <div style={{ position: "relative", paddingLeft: "35px", marginBottom: "15px" }}>
          <div style={{
            position: "absolute",
            left: "16px",
            top: "24px",
            bottom: "24px",
            width: "2px",
            borderLeft: "2px dashed #9CA3AF"
          }}></div>

          {/* Courier Row */}
          <div style={{ display: "flex", flexDirection: "column", marginBottom: "20px", position: "relative" }}>
            <div style={{
              position: "absolute",
              left: "-35px",
              top: "0",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              🛵
            </div>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#1F2937" }}>Courier</span>
            <span style={{ fontSize: "12px", color: "#6B7280" }}>
              {eta ? `${eta} away` : "Calculating distance..."}
            </span>
          </div>

          {/* Customer Row */}
          <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
            <div style={{
              position: "absolute",
              left: "-35px",
              top: "0",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#FEF2F2",
              border: "1px solid #FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              👤
            </div>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#1F2937" }}>You</span>
            <span style={{ fontSize: "12px", color: "#6B7280" }}>Delivery Destination</span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "12px", fontSize: "13px", color: "#4B5563" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span>Est. Distance:</span>
            <span style={{ fontWeight: "700", color: "#111827" }}>{distance || "--"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Est. Arrival:</span>
            <span style={{ fontWeight: "700", color: "#111827" }}>{eta || "--"}</span>
          </div>
        </div>
      </div>

      {/* 2. Google Map Component */}
      <GoogleMap
        onLoad={onLoad}
        mapContainerStyle={containerStyle}
        center={courier || customerLocation}
        zoom={15}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { featureType: "water", stylers: [{ color: "#e9e9e9" }, { visibility: "on" }] },
            { featureType: "landscape", stylers: [{ color: "#f5f5f5" }] },
            { featureType: "road", stylers: [{ color: "#ffffff" }] },
            { featureType: "road.highway", stylers: [{ visibility: "simplified" }] },
          ]
        }}
      >
        {/* Destination (Customer) */}
        <Marker position={customerLocation} />

        {/* Courier - Rendered using the clean SVG Vector Icon (🛵) */}
        {courier && emojiIcon && (
          <Marker
            position={courier}
            icon={emojiIcon}
          />
        )}

        {/* Polylines Route */}
        {routePath.length > 0 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: "#3B82F6",
              strokeWeight: 6,
              strokeOpacity: 0.9,
            }}
          />
        )}
      </GoogleMap>

      {/* 3. Bottom Summary Status Card */}
      <div style={{
        position: "absolute",
        bottom: "30px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 40px)",
        maxWidth: "600px",
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "800", color: "#111827" }}>Your delivery is on the way!</h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#4B5563" }}>The courier is heading towards your location</p>
        </div>

        <div style={{ width: "100%", height: "6px", backgroundColor: "#E5E7EB", borderRadius: "10px", overflow: "hidden", position: "relative" }}>
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "65%",
            backgroundColor: "#2563EB", 
            borderRadius: "10px",
            transition: "width 0.5s ease"
          }}></div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "2px" }}>Estimated Time</span>
            <span style={{ fontSize: "18px", fontWeight: "800", color: "#111827" }}>{eta || "--"}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "2px" }}>Distance Left</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "14px", color: "#2563EB" }}>📍</span>
              <span style={{ fontSize: "18px", fontWeight: "800", color: "#111827" }}>{distance || "--"}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
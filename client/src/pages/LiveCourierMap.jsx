import { useEffect, useRef, useState, useCallback } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import * as signalR from "@microsoft/signalr";

const containerStyle = { 
  width: "100vw", 
  height: "100vh",
  position: "absolute",
  top: 0,
  left: 0
};

const DEFAULT_CENTER = { lat: 32.0853, lng: 34.7818 };

const cleanMapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
  ]
};

// 🔵 אייקון השליח - נקודה כחולה מהבהבת
const COURIER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
    <circle cx="20" cy="20" r="16" fill="rgba(59, 130, 246, 0.3)">
      <animate attributeName="r" from="16" to="20" dur="1.5s" begin="0s" repeatCount="indefinite" />
      <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s" repeatCount="indefinite" />
    </circle>
    <circle cx="20" cy="20" r="8" fill="white"/>
    <circle cx="20" cy="20" r="6" fill="#3B82F6"/>
  </svg>
`.trim())}`;

// 📦 אייקון יעד המשלוח (החבילה)
const PACKAGE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="40" height="40">
    <circle cx="32" cy="32" r="30" fill="white" stroke="rgb(229,231,235)" stroke-width="2"/>
    <path d="M32 14L16 22l16 8 16-8-16-8z" fill="#4F46E5"/>
    <path d="M16 24v16l16 8V32L16 24z" fill="#4338CA"/>
    <path d="M48 24v16l-16 8V32l16-8z" fill="#3730A3"/>
    <path d="M32 20l8 4-8 4-8-4 8-4z" fill="#6366F1"/>
  </svg>
`.trim())}`;

export default function LiveCourierMap() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [courier, setCourier] = useState(null); 
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState(null);

  const mapRef = useRef(null);
  const hubConnectionRef = useRef(null); 
  const currentIndexRef = useRef(0);
  const ordersRef = useRef([]);
  const isRoutingRef = useRef(false);
  const courierRef = useRef(null); // שומר גישה מיידית למיקום האחרון של ה-GPS בשביל ה-API

  // 1. בניית קווי הניווט (Waze) 
  const buildRoute = useCallback((origin, currentStops) => {
    if (!window.google || !origin || !currentStops || !currentStops.length || isRoutingRef.current) return;

    const activeStops = currentStops.slice(currentIndexRef.current);
    if (!activeStops.length) {
      setDirections(null);
      return;
    }

    isRoutingRef.current = true; 
    const service = new window.google.maps.DirectionsService();
    const destination = activeStops[activeStops.length - 1];
    const waypoints = activeStops.slice(0, -1).map((o) => ({
      location: { lat: o.lat, lng: o.lng },
      stopover: true,
    }));

    service.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        isRoutingRef.current = false; 
        if (status === "OK") {
          setDirections(result);
        } else {
          console.warn("Directions request failed due to:", status);
        }
      }
    );
  }, []);

  // 2. שליפת היעדים עם מנגנון דחיפה מיידי (מניע את ה-10 דקות המתנה!)
  const loadRoute = useCallback(async () => {
    try {
      const res = await fetch("https://localhost:7234/api/orders/route", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) return [];
      const data = await res.json();

      if (!data || !Array.isArray(data)) return [];

      const formatted = data
        .filter(o => o && (o.lat || o.Latitude) && (o.lng || o.Longitude))
        .map((o) => ({
          id: o.id || o.Id,
          lat: Number(o.lat || o.Latitude),
          lng: Number(o.lng || o.Longitude),
          address: o.address || o.Address || "",
          status: "pending",
        }));

      setOrders(formatted);
      ordersRef.current = formatted;

      // 🔥 התיקון הקריטי: אם ה-GPS כבר החזיר מיקום של השליח, נבנה את המסלול מיידית עכשיו!
      if (courierRef.current && formatted.length > 0) {
        buildRoute(courierRef.current, formatted);
      }

      return formatted;
    } catch (err) {
      console.error("Error loading destinations:", err);
      return [];
    }
  }, [buildRoute]);

  // 3. טעינה ראשונית של היעדים מיד כשגוגל מפות מוכן
  useEffect(() => {
    if (isLoaded) {
      loadRoute();
    }
  }, [isLoaded, loadRoute]);

  // 4. מנוע המעקב הרציף של ה-GPS וסנכרון מול ה-Hub
  useEffect(() => {
    if (!isLoaded) return;

    let watchId;

    const initTrackingAndHub = async () => {
      const token = localStorage.getItem("token");
      let courierId = 1; 
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          courierId = payload.id || payload.nameid || 1;
        } catch (e) {
          console.error("Failed to parse token for courierId", e);
        }
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7234/trackingHub", {
          accessTokenFactory: () => localStorage.getItem("token"),
        })
        .withAutomaticReconnect()
        .build();

      try {
        await connection.start();
        console.log("🚀 Connected to Hub");
        hubConnectionRef.current = connection;
      } catch (err) {
        console.error("Hub connection failed:", err);
      }

      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const currentGpsPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            setCourier(currentGpsPos);
            courierRef.current = currentGpsPos; // שמירה ב-Ref זמין

            // הזזת המצלמה בצורה חלקה ללא שינוי ה-State של ה-center
            if (mapRef.current) {
              mapRef.current.panTo(currentGpsPos);
            }

            // עדכון קו הניווט אל היעדים בתנועה
            if (ordersRef.current.length > 0) {
              buildRoute(currentGpsPos, ordersRef.current);
            }

            // הפצת המיקום לשרת ה-C# בזמן אמת
            if (hubConnectionRef.current && hubConnectionRef.current.state === signalR.HubConnectionState.Connected) {
              try {
                const activeOrder = ordersRef.current.find(o => o.status === "pending");
                const currentOrderId = activeOrder ? activeOrder.id : 0;

                await hubConnectionRef.current.invoke(
                  "updateCourierLocation", 
                  Number(courierId), 
                  Number(currentOrderId), 
                  currentGpsPos.lat, 
                  currentGpsPos.lng
                );
              } catch (invokeErr) {
                console.warn("Broadcast temporarily delayed.", invokeErr);
              }
            }
          },
          (error) => console.error("GPS error:", error),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    };

    initTrackingAndHub();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (hubConnectionRef.current) hubConnectionRef.current.stop();
    };
  }, [isLoaded, buildRoute]);

  if (loadError) return <div style={{ padding: "20px", color: "red" }}>שגיאה בטעינת המפה.</div>;
  if (!isLoaded) return <div style={{ padding: "20px" }}>טוען מערכת ניווט...</div>;

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        defaultCenter={DEFAULT_CENTER}
        center={mapCenter} 
        zoom={16} 
        onLoad={(map) => {
          mapRef.current = map;
          window.google.maps.event.trigger(map, "resize");
        }}
        options={cleanMapOptions}
      >
        {/* 🔵 השליח (נקודה כחולה מהבהבת) */}
        {courier && (
          <Marker 
            position={courier} 
            icon={{
              url: COURIER_SVG,
              scaledSize: window.google ? new window.google.maps.Size(40, 40) : undefined,
              anchor: window.google ? new window.google.maps.Point(20, 20) : undefined
            }}
            options={{ optimized: false, zIndex: 100 }} 
          />
        )}

        {/* 📦 יעדי ההזמנות הממתינות לשליח */}
        {orders.length > 0 && orders
          .filter((o) => o.status === "pending")
          .map((o) => (
            <Marker 
              key={o.id} 
              position={{ lat: o.lat, lng: o.lng }} 
              icon={{
                url: PACKAGE_SVG,
                scaledSize: window.google ? new window.google.maps.Size(40, 40) : undefined,
                anchor: window.google ? new window.google.maps.Point(20, 20) : undefined
              }}
              options={{ optimized: false, zIndex: 50 }}
            />
          ))}

        {/* 🛣️ קו הניווט הכחול של ה-Directions */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true, 
              polylineOptions: {
                strokeColor: "#3B82F6",
                strokeWeight: 6,
                strokeOpacity: 0.85,
              },
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
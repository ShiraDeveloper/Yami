import { useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import * as signalR from "@microsoft/signalr";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const customerLocation = {
  lat: 32.0853,
  lng: 34.7818,
};

// 🎨 ערכת עיצוב מינימליסטית - מסירה קניונים, מסעדות, אטרקציות ומשאירה רק כבישים וערים
const cleanMapStyle = [
  {
    featureType: "poi",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6B7280" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#F1F5F9" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#E2E8F0" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#1F2937" }, { fontWeight: "bold" }],
  }
];

export default function LiveCourierMap({ orderId }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [courier, setCourier] = useState(null);
  const [directions, setDirections] = useState(null);
  const [eta, setEta] = useState(null);

  const connectionRef = useRef(null);
  const animationRef = useRef(null);

  // 🔌 SignalR Hub connection
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7234/trackingHub")
      .withAutomaticReconnect()
      .build();

    connection.start().then(() => {
      connection.invoke("JoinOrder", orderId);
    }).catch(err => console.error("SignalR Connection Error: ", err));

    connection.on("ReceiveCourierLocation", (courierId, lat, lng) => {
      const newPos = { lat, lng };
      
      // עדכון המיקום החלק והרצת חישוב המסלול מול ה-API של גוגל
      setCourier((currentCourier) => {
        smoothMove(currentCourier, newPos);
        return currentCourier ? currentCourier : newPos;
      });
      
      getRoute(newPos);
    });

    connectionRef.current = connection;

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
      clearInterval(animationRef.current);
    };
  }, [orderId]);

  // 🎯 חישוב צעדי האנימציה לתנועה חלקה (מניעת קפיצות של המרקר)
  const smoothMove = (startPos, endPos) => {
    if (!startPos) return;

    let step = 0;
    const steps = 25;
    const deltaLat = (endPos.lat - startPos.lat) / steps;
    const deltaLng = (endPos.lng - startPos.lng) / steps;

    clearInterval(animationRef.current);

    animationRef.current = setInterval(() => {
      step++;
      
      setCourier((prev) => {
        if (!prev) return endPos;
        return {
          lat: prev.lat + deltaLat,
          lng: prev.lng + deltaLng,
        };
      });

      if (step >= steps) {
        clearInterval(animationRef.current);
      }
    }, 30);
  };

  // 🛣️ חישוב מסלול נסיעה וזמן הגעה (ETA)
  const getRoute = (courierPos) => {
    if (!window.google) return;
    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: courierPos,
        destination: customerLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
          const leg = result.routes[0].legs[0];
          setEta(leg.duration.text); 
        }
      }
    );
  };

  if (!isLoaded) return <div style={styles.centerLoading}>Loading Live Map...</div>;

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={courier || customerLocation}
        zoom={14}
        options={{
          styles: cleanMapStyle, // 📌 החלת העיצוב הנקי ללא קניונים ומסעדות
          disableDefaultUI: true, // הסרת כפתורי ממשק מיותרים
          zoomControl: true,
        }}
      >
        {/* 📍 מרקר יעד הלקוח - קלאסי ונקי */}
        <Marker
          position={customerLocation}
          options={{
            label: { text: "Y", color: "#ffffff", fontWeight: "bold" } // לוגו קטן קלאסי במקום סיכה גנרית
          }}
        />

        {/* 🚚 מרקר השליח בזמן אמת */}
        {courier && (
          <Marker
            position={courier}
            icon={{
              url: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png", // האייקון שבחרת
              scaledSize: new window.google.maps.Size(35, 35),
            }}
          />
        )}

        {/* 🛣️ ציור קו המסלול בעיצוב מותאם אישית שלא יעמיס על המפה */}
        {directions && (
          <DirectionsRenderer 
            directions={directions} 
            options={{
              suppressMarkers: true, // מונע מגוגל להוסיף את סיכות ה-A ו-B המעצבות שלהם מעל הסיכות שלך
              polylineOptions: {
                strokeColor: "#1F2937", // קו כהה, סולידי ונקי (במקום הכחול הזרחני)
                strokeOpacity: 0.7,
                strokeWeight: 4
              }
            }}
          />
        )}
      </GoogleMap>

      {/* 📊 פאנל ETA בעיצוב מונוכרומטי עדין */}
      {eta && (
        <div style={styles.panelStyle}>
          <span style={styles.etaLabel}>Estimated Arrival</span>
          <span style={styles.etaTime}>{eta}</span>
        </div>
      )}
    </div>
  );
}

// 🎨 מערך עיצוב סולידי ומשולב לקומפוננטה
const styles = {
  panelStyle: {
    position: "absolute",
    top: "80px", // ממוקם בבטחה מתחת ל-Navbar הקבוע שלך (60px)
    right: "20px",
    backgroundColor: "#ffffff",
    padding: "12px 18px",
    borderRadius: "8px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 4px 12px rgba(31, 41, 55, 0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    fontFamily: "system-ui, sans-serif",
    minWidth: "140px"
  },
  etaLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#6B7280",
    fontWeight: "600"
  },
  etaTime: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1F2937"
  },
  centerLoading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontFamily: "system-ui, sans-serif",
    color: "#4B5563",
    backgroundColor: "#F8FAFC"
  }
};
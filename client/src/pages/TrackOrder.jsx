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

const cleanMapStyle = [
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#F1F5F9" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#E2E8F0" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#1F2937" }, { fontWeight: "bold" }] }
];

export default function TrackOrder({ orderId }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [courier, setCourier] = useState(null);
  const [directions, setDirections] = useState(null);
  const [eta, setEta] = useState(null);

  const connectionRef = useRef(null);
  const animationRef = useRef(null);
  // רפרנס שישמור תמיד את המיקום הנוכחי העדכני ביותר של השליח לטובת האנימציה הבאה
  const courierRef = useRef(null); 

  // 🔌 SignalR Hub connection
useEffect(() => {

  console.log(
    "TOKEN:",
    localStorage.getItem("token")
  );

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(
      "https://localhost:7234/trackingHub",
      {
        accessTokenFactory: () =>
          localStorage.getItem("token"),
      }
    )
    .withAutomaticReconnect()
    .build();

  connection.on("ReceiveCourierLocation", (data) => {

    console.log("LIVE DATA:", data);

    const newPos = {
      lat: Number(data.lat),
      lng: Number(data.lng),
    };

    if (!courierRef.current) {
      setCourier(newPos);
      courierRef.current = newPos;
    } else {
      smoothMove(courierRef.current, newPos);
    }

    getRoute(newPos);
  });

  connection.start()
    .then(async () => {

      console.log("ORDER ID:", orderId);

      await connection.invoke(
        "JoinOrder",
        Number(orderId)
      );

      console.log("JOINED ORDER GROUP");
    })
    .catch(err => {
      console.error("SIGNALR ERROR:", err);
    });

  connectionRef.current = connection;

  return () => {

    if (connectionRef.current) {
      connectionRef.current.stop();
    }

    clearInterval(animationRef.current);
  };

}, [orderId]);

  // 🎯 חישוב צעדי האנימציה לתנועה חלקה
  const smoothMove = (startPos, endPos) => {
    let step = 0;
    const steps = 25;
    const deltaLat = (endPos.lat - startPos.lat) / steps;
    const deltaLng = (endPos.lng - startPos.lng) / steps;

    clearInterval(animationRef.current);

    animationRef.current = setInterval(() => {
      step++;
      
      const currentStepPos = {
        lat: startPos.lat + deltaLat * step,
        lng: startPos.lng + deltaLng * step,
      };

      setCourier(currentStepPos);
      courierRef.current = currentStepPos; // מעדכנים את הרפרנס כדי שהצעד הבא יידע מאיפה להמשיך

      if (step >= steps) {
        clearInterval(animationRef.current);
      }
    }, 30);
  };

  // 🛣️ חישוב מסלול נסיעה וזמן הגעה (ETA)
  const getRoute = (courierPos) => {
    if (!window.google || !courierPos) return;
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
        } else {
          console.error("Directions Request Failed: ", status);
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
          styles: cleanMapStyle,
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        {/* 📍 מרקר יעד הלקוח - עם לוגו YAMI קטן ולבן */}
        <Marker
          position={customerLocation}
          options={{
            label: { text: "Y", color: "#ffffff", fontWeight: "bold" }
          }}
        />

        {/* 🏍️ מרקר השליח בזמן אמת */}
        {courier && (
          <Marker
            position={courier}
            icon={{
              url: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
              scaledSize: new window.google.maps.Size(40, 40),
            }}
          />
        )}

        {/* 🛣️ ציור קו המסלול המותאם אישית בין השליח ללקוח */}
        {directions && (
          <DirectionsRenderer 
            directions={directions} 
            options={{
              suppressMarkers: true, // מונע את סיכות ה-A ו-B המקוריות של גוגל
              polylineOptions: {
                strokeColor: "#1F2937", // קו כהה, סולידי ונקי (מתאים ללוגו של YAMI!)
                strokeOpacity: 0.8,
                strokeWeight: 5
              }
            }}
          />
        )}
      </GoogleMap>

      {/* 📊 פאנל ETA */}
      {eta && (
        <div style={styles.panelStyle}>
          <span style={styles.etaLabel}>Estimated Arrival</span>
          <span style={styles.etaTime}>{eta}</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  panelStyle: {
    position: "absolute",
    top: "80px",
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
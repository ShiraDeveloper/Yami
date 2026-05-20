import { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";

/**
 * CarSelectionList Component - שלב 2 בחיוב
 * מציג רשימת רכבים עם סטטוס זמינות בזמן אמת
 * 
 * Props:
 *   - cars: array of car objects with id, name, price, etc.
 *   - selectedDate: Date object for the booking date
 *   - fromHour: Number (9-23)
 *   - toHour: Number (9-23)
 *   - onCarSelect: Function(carId) - called when user selects a car
 */
export default function CarSelectionList({ cars, selectedDate, fromHour, toHour, onCarSelect }) {
  const [carStatuses, setCarStatuses] = useState({});
  const connectionRef = useRef(null);
  const timeSlotKeyRef = useRef("");

  // 🔧 יצירת מפתח ייחודי לשעות שנבחרו
  const generateTimeSlotKey = (date, from, to) => {
    const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    return `${dateStr}_${String(from).padStart(2, '0')}-${String(to).padStart(2, '0')}`;
  };

  // 🔌 SignalR חיבור ומאזינים לעדכוני סטטוס רכבים
  useEffect(() => {
    if (!selectedDate || fromHour === undefined || toHour === undefined) return;

    const timeSlotKey = generateTimeSlotKey(selectedDate, fromHour, toHour);
    timeSlotKeyRef.current = timeSlotKey;

    let isMounted = true;

    // יצירת חיבור חדש ל-SignalR
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL || "https://localhost:7234"}/trackingHub`)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    // 📡 הקשבה לעדכוני סטטוס רכבים
    connection.on("CarStatusUpdated", (data) => {
      if (!isMounted) return;

      console.log(`🚗 Car ${data.carId} status updated to: ${data.status}`);

      // עדכון הסטטוס של הרכב הספציפי בלבד
      setCarStatuses((prev) => ({
        ...prev,
        [data.carId]: data.status,
      }));
    });

    // התחלת החיבור
    const startConnection = async () => {
      try {
        if (connection.state !== signalR.HubConnectionState.Disconnected) {
          return;
        }

        await connection.start();
        console.log("✅ SignalR connected for car selection");

        // הצטרפות לקבוצת הרכבים של שעות אלו
        await connection.invoke("JoinCarSelectionGroup", timeSlotKey);
        console.log(`👥 Joined car group: ${timeSlotKey}`);
      } catch (err) {
        console.error("❌ SignalR connection error:", err);
      }
    };

    startConnection();

    // 🧹 ניקוי בעת סגירת הקומפוננטה
    return () => {
      isMounted = false;

      if (connectionRef.current) {
        connectionRef.current.invoke("LeaveCarSelectionGroup", timeSlotKey).catch(console.error);
        connectionRef.current.stop().catch(console.error);
      }
    };
  }, [selectedDate, fromHour, toHour]);

  // 🎨 קביעת צבע וטקסט לפי סטטוס
  const getStatusStyle = (carId) => {
    const status = carStatuses[carId];

    if (status === "Occupied") {
      return {
        badge: { backgroundColor: "#DC2626", color: "white" },
        text: "תפוס",
        disabled: true,
      };
    }
    if (status === "Partially Available") {
      return {
        badge: { backgroundColor: "#F59E0B", color: "white" },
        text: "חלקית זמין",
        disabled: false,
      };
    }
    // Default: Available
    return {
      badge: { backgroundColor: "#10B981", color: "white" },
      text: "זמין",
      disabled: false,
    };
  };

  const handleSelectCar = (carId) => {
    const style = getStatusStyle(carId);
    if (!style.disabled) {
      onCarSelect(carId);
    } else {
      alert("הרכב הזה אינו זמין בשעות אלו");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>בחר רכב - שלב 2</h2>
      
      <div style={styles.timeInfo}>
        <span>📅 {selectedDate?.toLocaleDateString("he-IL")}</span>
        <span>🕐 {fromHour}:00 - {toHour}:00</span>
      </div>

      <div style={styles.carGrid}>
        {cars && cars.length > 0 ? (
          cars.map((car) => {
            const statusStyle = getStatusStyle(car.id);

            return (
              <div
                key={car.id}
                style={{
                  ...styles.carCard,
                  opacity: statusStyle.disabled ? 0.6 : 1,
                  cursor: statusStyle.disabled ? "not-allowed" : "pointer",
                }}
              >
                <div style={styles.carImage}>
                  <img
                    src={car.image || "https://via.placeholder.com/150"}
                    alt={car.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                <div style={styles.carInfo}>
                  <h3 style={styles.carName}>{car.name}</h3>

                  <div style={styles.badge} style={{ ...styles.badge, ...statusStyle.badge }}>
                    {statusStyle.text}
                  </div>

                  <p style={styles.price}>₪{car.price}/שעה</p>

                  <button
                    onClick={() => handleSelectCar(car.id)}
                    disabled={statusStyle.disabled}
                    style={{
                      ...styles.selectButton,
                      backgroundColor: statusStyle.disabled ? "#D1D5DB" : "#1F2937",
                      cursor: statusStyle.disabled ? "not-allowed" : "pointer",
                    }}
                  >
                    {statusStyle.disabled ? "לא זמין" : "בחר"}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p style={styles.noResults}>אין רכבים זמינים</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    direction: "rtl",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#1F2937",
  },
  timeInfo: {
    display: "flex",
    gap: "15px",
    marginBottom: "20px",
    padding: "10px",
    backgroundColor: "#F3F4F6",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#4B5563",
  },
  carGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "15px",
  },
  carCard: {
    backgroundColor: "#FFF",
    borderRadius: "12px",
    padding: "15px",
    boxShadow: "0 2px 8px rgba(31, 41, 55, 0.1)",
    transition: "all 0.3s ease",
  },
  carImage: {
    width: "100%",
    height: "150px",
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "12px",
    backgroundColor: "#F3F4F6",
  },
  carInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  carName: {
    fontSize: "16px",
    fontWeight: "600",
    margin: "0",
    color: "#1F2937",
  },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    width: "fit-content",
  },
  price: {
    fontSize: "14px",
    color: "#6B7280",
    margin: "5px 0",
  },
  selectButton: {
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    color: "white",
    fontWeight: "600",
    marginTop: "10px",
    transition: "all 0.2s ease",
  },
  noResults: {
    textAlign: "center",
    color: "#6B7280",
    gridColumn: "1 / -1",
  },
};

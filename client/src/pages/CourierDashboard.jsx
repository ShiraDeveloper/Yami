import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";

const styles = {
  appContainer: { direction: "rtl", backgroundColor: "#F8F9FA", minHeight: "100vh", fontFamily: 'sans-serif' },
  navbar: { display: "flex", justifyContent: "space-between", padding: "15px", backgroundColor: "#FFF", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
  brand: { fontWeight: "800", fontSize: "1.2rem", color: "#1A1A1A" },
  taskCard: { backgroundColor: "#FFF", borderRadius: "20px", padding: "20px", margin: "15px", boxShadow: "0 5px 15px rgba(0,0,0,0.05)" },
  offerCard: { backgroundColor: "#FFFDE7", borderRadius: "20px", padding: "20px", margin: "15px", border: "2px solid #FBC02D", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" },
  primaryBtn: { width: "100%", padding: "15px", backgroundColor: "#1A1A1A", color: "#FFF", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", marginTop: "10px" },
  secondaryBtn: { width: "100%", padding: "15px", backgroundColor: "#E0E0E0", color: "#333", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", marginTop: "10px" },
  loader: { textAlign: "center", marginTop: "50px", fontSize: "1.2rem" }
};

export default function CourierDashboard() {
  const [tasks, setTasks] = useState([]);
  const [newOffer, setNewOffer] = useState(null); // הצעה חדשה שממתינה לאישור
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const connectionRef = useRef(null);
  const navigate = useNavigate();

  // --- שליפת משימות מאושרות מהשרת ---
  const fetchTasks = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Orders/my-route`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Fetch tasks error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- אישור הצעה חדשה והפיכתה למשימה ---
  const handleAcceptOffer = async (orderId) => {
    const token = localStorage.getItem("token");
    try {
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Orders/accept/${orderId}`, {
      method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setNewOffer(null); // הסרת חלונית ההצעה
        fetchTasks();      // רענון המשימות - עכשיו ההזמנה תופיע ב-my-route
      } else {
        alert("לא ניתן היה לאשר את ההצעה");
        setNewOffer(null);
      }
    } catch (err) {
      console.error("Accept offer error:", err);
    }
  };

  // --- ניהול SignalR לתקשורת בזמן אמת ---
  useEffect(() => {
    fetchTasks();

    const token = localStorage.getItem("token");
    if (!token || (connectionRef.current && connectionRef.current.state !== signalR.HubConnectionState.Disconnected)) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL}/trackingHub`, {
        accessTokenFactory: () => token,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await newConnection.start();
        console.log("✅ Connected to SignalR Hub");
        connectionRef.current = newConnection;

        // האזנה להצעת הזמנה חדשה (לפני שיוך סופי)
        newConnection.on("NewOrderAssigned", (order) => {
          console.log("🚚 New offer received via SignalR:", order);
          setNewOffer(order); // הצגת ההצעה במקום רענון אוטומטי
        });

      } catch (err) {
        console.error("❌ SignalR Connection Error:", err);
        setTimeout(startConnection, 5000);
      }
    };

    startConnection();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [fetchTasks]);

  // --- אישור ביצוע שלב (איסוף או מסירה) ---
const handleCompleteTask = async () => {
    const token = localStorage.getItem("token");
    const task = tasks[currentIndex];

    if (!task) return;

    const idToSend = task.orderId || task.id || task.OrderId;

    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Orders/complete-task/${idToSend}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", // וודא שזה קיים
                "Authorization": `Bearer ${token}` 
            },
            // שליחת אובייקט עם אותיות קטנות (CamelCase) כמקובל ב-JS
            body: JSON.stringify({ type: task.type }) 
        });
        
        if (res.ok) {
            // רענון הרשימה מהשרת במקום רק לקדם אינדקס
            // זה יבטיח שהנתונים ב-UI תואמים ל-DB
            await fetchTasks(); 
            setCurrentIndex(0); // איפוס האינדקס כי הרשימה התעדכנה
        } else {
            const errorData = await res.json();
            console.error("Server error details:", errorData);
            alert(`שגיאה: ${errorData.message || 'הפעולה נכשלה'}`);
        }
    } catch (err) { 
        console.error("Update task error:", err); 
    }
};
  if (loading) return <div style={styles.loader}>טוען נתונים...</div>;

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.brand}>Yami Courier</div>
      </nav>

      {/* --- הצגת הצעה חדשה במידה וקיימת --- */}
      {newOffer && (
        <div style={styles.offerCard}>
          <div style={{color: "#FBC02D", fontWeight: "bold", marginBottom: "10px"}}>⚡ הצעה חדשה למשלוח!</div>
          <h3>{newOffer.storeName || "חנות חדשה"}</h3>
          <p>כתובת איסוף: {newOffer.storeAddress || "כתובת החנות"}</p>
          <div style={{display: "flex", gap: "10px", marginTop: "15px"}}>
            <button onClick={() => handleAcceptOffer(newOffer.orderId)} style={styles.primaryBtn}>אישור הצעה</button>
            <button onClick={() => setNewOffer(null)} style={styles.secondaryBtn}>התעלם</button>
          </div>
        </div>
      )}

      {/* --- הצגת משימות פעילות --- */}
      {tasks.length > 0 && tasks[currentIndex] ? (
        <div style={styles.taskCard}>
          <div style={{marginBottom: "15px"}}>
            <span style={{backgroundColor: "#E3F2FD", color: "#1976D2", padding: "5px 10px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "600"}}>
              {tasks[currentIndex].type === 'pickup' ? "איסוף מהחנות" : "מסירה ללקוח"}
            </span>
          </div>
          <h2 style={{margin: "0 0 10px 0", fontSize: "1.4rem"}}>{tasks[currentIndex].address}</h2>
          <p style={{color: "#666", marginBottom: "20px"}}>{tasks[currentIndex].customerName || "לקוח Yami"}</p>
          
          <button onClick={handleCompleteTask} style={styles.primaryBtn}>
            אישור {tasks[currentIndex].type === 'pickup' ? "איסוף" : "מסירה"}
          </button>
        </div>
      ) : !newOffer && (
        <div style={{textAlign: "center", padding: "40px", color: "#888"}}>
          <div style={{fontSize: "3rem", marginBottom: "10px"}}>🚚</div>
          <p>אין משימות פעילות. ממתין להזמנות...</p>
        </div>
      )}
    </div>
  );
}
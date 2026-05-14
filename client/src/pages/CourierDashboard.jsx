import React, { useState, useEffect, useCallback, useRef } from "react";
import * as signalR from "@microsoft/signalr";

const styles = {
    appContainer: { direction: "rtl", backgroundColor: "#F8F9FA", minHeight: "100vh", fontFamily: 'system-ui, -apple-system, sans-serif' },
    navbar: { display: "flex", justifyContent: "space-between", padding: "15px", backgroundColor: "#FFF", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
    brand: { fontWeight: "800", fontSize: "1.2rem", color: "#1A1A1A" },
    taskCard: { backgroundColor: "#FFF", borderRadius: "20px", padding: "20px", margin: "15px", boxShadow: "0 5px 15px rgba(0,0,0,0.05)" },
    offerCard: { backgroundColor: "#FFFDE7", borderRadius: "20px", padding: "20px", margin: "15px", border: "2px solid #FBC02D", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" },
    primaryBtn: { width: "100%", padding: "15px", backgroundColor: "#1A1A1A", color: "#FFF", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", marginTop: "10px" },
    secondaryBtn: { width: "100%", padding: "15px", backgroundColor: "#F1F1F1", color: "#333", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", marginTop: "10px" },
    loader: { textAlign: "center", marginTop: "50px", fontSize: "1.2rem", color: "#666" }
};

export default function CourierDashboard() {
    const [tasks, setTasks] = useState([]);
    const [newOffer, setNewOffer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const connectionRef = useRef(null);

    // --- שליפת משימות פעילות (המסלול שלי) ---
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
            } else if (res.status === 400) {
                // במקרה שהמשתמש עוד לא מוגדר כשליח - נציג רשימה ריקה
                setTasks([]);
            }
        } catch (err) {
            console.error("Fetch tasks error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- ניהול חיבור SignalR ---
useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("token");

    if (!token) {
        setLoading(false);
        return;
    }

    // יצירת החיבור פעם אחת בלבד
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${import.meta.env.VITE_API_URL}/trackingHub`, {
            accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

    const startConnection = async () => {
        try {
            await connection.start();
            if (isMounted) {
                console.log("✅ SignalR Connected Successfully");
                
                // האזנה לאירוע - וודאי שזה השם המדויק שנשלח מהשרת
                connection.on("NewOrderAssigned", (order) => {
                    console.log("New Wave Received:", order);
                    setNewOffer(order);
                });
            }
        } catch (err) {
            console.error("❌ SignalR Connection Error:", err);
            if (isMounted) setTimeout(startConnection, 5000);
        }
    };

    startConnection();
    fetchTasks(); // שליפת המשימות הקיימות

    // Cleanup: סגירת החיבור כשהקומפוננטה יורדת מהמסך
    return () => {
        isMounted = false;
        if (connection.state === signalR.HubConnectionState.Connected) {
            connection.stop();
        }
    };
}, []); // מערך תלויות ריק הוא קריטי כאן!
    // --- אישור הצעת משלוח (הגל) ---
    const handleAcceptOffer = async (orderId) => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Orders/accept/${orderId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setNewOffer(null);
                await fetchTasks(); // רענון מידי להצגת המשימה בלוח
            } else {
                alert("ההזמנה כבר נלקחה על ידי שליח אחר");
                setNewOffer(null);
            }
        } catch (err) {
            console.error("Accept error:", err);
        }
    };

    // --- עדכון סטטוס משימה (איסוף/מסירה) ---
    const handleCompleteTask = async () => {
        const token = localStorage.getItem("token");
        const currentTask = tasks[currentIndex];
        if (!currentTask) return;

        const orderId = currentTask.orderId || currentTask.id;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Orders/complete-task/${orderId}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ type: currentTask.type })
            });

            if (res.ok) {
                await fetchTasks();
                setCurrentIndex(0); // חזרה למשימה הראשונה ברשימה המעודכנת
            }
        } catch (err) {
            console.error("Update task error:", err);
        }
    };

    if (loading) return <div style={styles.loader}>מתחבר למערכת YAMI...</div>;

    return (
        <div style={styles.appContainer}>
            <nav style={styles.navbar}>
                <div style={styles.brand}>Yami Courier</div>
                <div style={{fontSize: "0.9rem", color: "#666"}}>מחובר</div>
            </nav>

            {/* חלונית הצעה חדשה (Wave) */}
            {newOffer && (
                <div style={styles.offerCard}>
                    <div style={{color: "#FBC02D", fontWeight: "bold", marginBottom: "5px"}}>⚡ הזמנה חדשה זמינה!</div>
                    <h3 style={{margin: "0 0 10px 0"}}>{newOffer.storeName}</h3>
                    <p style={{fontSize: "0.9rem", margin: "5px 0"}}>איסוף מ: {newOffer.storeAddress}</p>
                    <div style={{display: "flex", gap: "10px", marginTop: "15px"}}>
                        <button onClick={() => handleAcceptOffer(newOffer.orderId)} style={styles.primaryBtn}>אשר הגעה</button>
                        <button onClick={() => setNewOffer(null)} style={styles.secondaryBtn}>דחה</button>
                    </div>
                </div>
            )}

            {/* רשימת משימות פעילה */}
            {tasks.length > 0 ? (
                <div style={styles.taskCard}>
                    <div style={{marginBottom: "15px"}}>
                        <span style={{backgroundColor: "#E3F2FD", color: "#1976D2", padding: "5px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase"}}>
                            {tasks[currentIndex].type === 'pickup' ? "שלב 1: איסוף" : "שלב 2: מסירה"}
                        </span>
                    </div>
                    <h2 style={{margin: "0 0 5px 0", fontSize: "1.5rem"}}>{tasks[currentIndex].address}</h2>
                    <p style={{color: "#666", marginBottom: "25px"}}>{tasks[currentIndex].customerName || "לקוח Yami"}</p>
                    
                    <button onClick={handleCompleteTask} style={styles.primaryBtn}>
                        אישור {tasks[currentIndex].type === 'pickup' ? "ביצוע איסוף" : "ביצוע מסירה"}
                    </button>
                </div>
            ) : !newOffer && (
                <div style={{textAlign: "center", padding: "60px 20px", color: "#BBB"}}>
                    <div style={{fontSize: "4rem", marginBottom: "15px"}}>🛵</div>
                    <p style={{fontSize: "1.1rem"}}>אין משימות כרגע.<br/>ברגע שתתקבל הזמנה, היא תופיע כאן.</p>
                </div>
            )}
        </div>
    );
}
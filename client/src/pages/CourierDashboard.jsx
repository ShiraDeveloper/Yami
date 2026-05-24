import React, { useState, useEffect, useCallback, useRef } from "react";
import * as signalR from "@microsoft/signalr";

const styles = {
    appContainer: { direction: "rtl", backgroundColor: "#F8F9FA", minHeight: "100vh", fontFamily: 'system-ui, -apple-system, sans-serif' },
    taskCard: { backgroundColor: "#FFF", borderRadius: "20px", padding: "20px", margin: "15px", boxShadow: "0 4px 16px rgba(31, 41, 55, 0.06)" },
    offerCard: { backgroundColor: "#FFFDE7", borderRadius: "20px", padding: "20px", margin: "15px", border: "2px solid #FBC02D", boxShadow: "0 4px 16px rgba(31, 41, 55, 0.06)" },
    primaryBtn: { width: "100%", padding: "15px", backgroundColor: "#1A1A1A", color: "#FFF", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", marginTop: "10px" },
    secondaryBtn: { width: "100%", padding: "15px", backgroundColor: "#F1F1F1", color: "#333", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", marginTop: "10px" },
    loader: { textAlign: "center", marginTop: "50px", fontSize: "1.2rem", color: "#666" }
};
const orderIdBadgeStyle = {
    backgroundColor: "#f3f4f6",  // רקע אפרפר-בהיר מעודן (Neutral Gray)
    color: "#1f2937",            // צבע טקסט כהה וקריא
    padding: "5px 12px",         // מרווח פנימי שיוצר צורה של תגית (Badge)
    borderRadius: "12px",        // פינות עגולות ומודרניות
    fontSize: "13px",            // גודל גופן נקי
    fontWeight: "600",           // טקסט ממודגש מעט
    display: "inline-flex",
    alignItems: "center"
};

export default function CourierDashboard() {
    const [tasks, setTasks] = useState([]);
    const [newOffer, setNewOffer] = useState(null);
    const [isAvailable, setIsAvailable] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const connectionRef = useRef(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7234";

    // --- שליפת מצב זמינות נוכחי מהשרת ---
    const fetchAvailabilityStatus = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/Courier/availability-status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIsAvailable(data.isAvailable);
            }
        } catch (err) {
            console.error("Error fetching availability status:", err);
        }
    }, [API_BASE_URL]);

    // --- שליפת משימות פעילות ---
    const fetchTasks = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/Orders/my-route`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            } else if (res.status === 400) {
                setTasks([]);
            }
        } catch (err) {
            console.error("Fetch tasks error:", err);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    // --- הבאת נתונים ראשונית ---
    useEffect(() => {
        const initializeDashboard = async () => {
            await fetchAvailabilityStatus();
            await fetchTasks();
        };
        initializeDashboard();
    }, [fetchTasks, fetchAvailabilityStatus]);

    useEffect(() => {
        let isMounted = true;
        let retryTimeout = null;

        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (!token || !userId) {
            console.error("Missing token or userId");
            setLoading(false);
            return;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_BASE_URL}/trackingHub`, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        connectionRef.current = connection;

        // ====== EVENTS ======
        connection.on("NewOrderAssigned", (order) => {
            console.log("📩 New order received:", order);

            if (!isMounted || !isAvailable) return;

            setNewOffer(order);

            try {
                const audio = new Audio("/sounds/message.mp3");
                audio.volume = 1.0;
                audio.play();
            } catch (err) {
                console.error("Audio error:", err);
            }
        });

        connection.on("OrderTaken", (data) => {
            console.log("❌ Order taken:", data);

            setNewOffer(prev => {
                if (prev?.orderId === data.orderId) {
                    return null;
                }
                return prev;
            });
        });
        // 📌 מאזין לאירוע שהוספנו בשרת - מעלים את ההצעה מהמסך בשקט
        connection.on("RemoveOrderFromScreen", (cancelledOrderId) => {
            console.log(`🤫 Order ${cancelledOrderId} was cancelled by server.`);
            setNewOffer(prev => {
                if (prev?.orderId === cancelledOrderId) return null;
                return prev;
            });
        });
        connection.onclose(() => {
            console.warn("🔌 SignalR disconnected");
        });

        // ====== START CONNECTION ======
        const startConnection = async () => {
            try {
                if (connection.state !== signalR.HubConnectionState.Disconnected) {
                    console.log("⚠️ Connection already started or connecting:", connection.state);
                    return;
                }

                console.log("⏳ Connecting SignalR...");

                await connection.start();

                console.log("✅ SignalR connected");

                await connection.invoke("JoinCourierGroup", Number(userId));

                console.log("👥 Joined group:", userId);

            } catch (err) {
                console.error("❌ SignalR connection error:", err);

                retryTimeout = setTimeout(() => {
                    startConnection();
                }, 5000);
            }
        };

        if (isAvailable) {
            startConnection();
        }

        // ====== CLEANUP ======
        return () => {
            isMounted = false;

            if (retryTimeout) {
                clearTimeout(retryTimeout);
            }

            if (connection) {
                connection.off("NewOrderAssigned");

                connection.stop()
                    .then(() => console.log("🛑 SignalR stopped"))
                    .catch(err => console.error("Stop error:", err));
            }
        };

    }, [API_BASE_URL, isAvailable]);

    // --- שליחת מיקום בזמן אמת ---
useEffect(() => {
    if (!connectionRef.current) return;

    if (!tasks.length) return;

    const activeOrder = tasks[0];

    const watchId = navigator.geolocation.watchPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            console.log("📍 Sending location:", lat, lng);

            try {
                await connectionRef.current.invoke(
                    "UpdateCourierLocation",
                    activeOrder.courierId || 0,
                    activeOrder.id,
                    lat,
                    lng
                );

                console.log("✅ Location sent");
            } catch (err) {
                console.error("❌ Send location error:", err);
            }
        },
        (err) => {
            console.error("GPS ERROR:", err);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        }
    );

    return () => {
        navigator.geolocation.clearWatch(watchId);
    };
}, [tasks]);

    // --- אישור הצעת משלוח ---
    const handleAcceptOffer = async (orderId) => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_BASE_URL}/api/Orders/accept/${orderId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setNewOffer(null);
                await fetchTasks();
            } else {
                alert("The order has already been taken by another courier");
                setNewOffer(null);
            }
        } catch (err) {
            console.error("Accept error:", err);
        }
    };

    // --- דחיית הצעת משלוח ---
    const handleRejectOffer = () => {
        setNewOffer(null);
    };

    // --- עדכון סטטוס משימה ---
    const handleCompleteTask = async () => {
        const token = localStorage.getItem("token");
        const currentTask = tasks[currentIndex];
        if (!currentTask) return;

        const orderId = currentTask.orderId || currentTask.id;

        console.log("✅ Completing task:", currentTask);

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/Orders/complete-task/${orderId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: 3 }),// סוג 3 מסמן השלמת משימה (איסוף או מסירה)
                }
            );

            if (res.ok) {
                // מסיר את המשימה שהושלמה מיד מהמסך
                setTasks((prev) => {
                    const updated = prev.filter(
                        (t) => (t.orderId || t.id) !== orderId
                    );

                    // התאמת אינדקס כדי שלא ייצא מהטווח
                    if (updated.length === 0) {
                        setCurrentIndex(0);
                    } else if (currentIndex >= updated.length) {
                        setCurrentIndex(updated.length - 1);
                    }

                    return updated;
                });
            } else {
                console.error("Failed to complete task");
            }
        } catch (err) {
            console.error("Update task error:", err);
        }
    };

    if (loading && tasks.length === 0 && !newOffer) {
        return <div style={styles.loader}>Connecting to the YAMI system...</div>;
    }

    const currentTask = tasks[currentIndex];

    
    return (
        <div style={styles.appContainer}>

            {/* חלונית הצעה חדשה */}
            {isAvailable && newOffer && (
                <div style={styles.offerCard}>
                    <div style={{ color: "#FBC02D", fontWeight: "bold", marginBottom: "5px" }}>⚡ New order available!</div>
                    <h3 style={{ margin: "0 0 10px 0" }}>{newOffer.storeName}</h3>
                    <p style={{ fontSize: "0.9rem", margin: "5px 0" }}>Collection from: {newOffer.storeAddress}</p>
                    <p style={{ fontSize: "0.85rem", color: "#555", margin: "5px 0" }}>Order volume: {newOffer.totalVolume}</p>
                    <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                        <button onClick={() => handleAcceptOffer(newOffer.orderId)} style={styles.primaryBtn}>Confirm arrival</button>
                        <button onClick={handleRejectOffer} style={styles.secondaryBtn}>Reject</button>
                    </div>
                </div>
            )}

            {/* רשימת משימות פעילה */}
            {isAvailable && tasks.length > 0 && currentTask ? (
                <div style={styles.taskCard}>
                    <div style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ backgroundColor: "#E3F2FD", color: "#1976D2", padding: "5px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" }}>
                            {currentTask.type === 'pickup' ? "Step 1: Pick-up" : "Step 2: Delivery"}
                        </span>
                    <span style={orderIdBadgeStyle}>Order ID: {currentTask.id}</span>                  
                      </div>
                    <h2 style={{ margin: "0 0 5px 0", fontSize: "1.5rem" }}>{currentTask.address}</h2>
                    {/* שורת שם הלקוח */}
                    <div style={{ color: "#666", marginBottom: "12px", fontSize: "16px" }}>
                        <span style={{ color: "#333", fontWeight: "bold", marginRight: "6px" }}>Customer Name:</span>
                        {currentTask.customer?.name || "Yami Customer"}
                    </div>

                    {/* שורת טלפון הלקוח */}
                    <div style={{ color: "#666", marginBottom: "25px", fontSize: "16px" }}>
                        <span style={{ color: "#333", fontWeight: "bold", marginRight: "6px" }}>Customer Phone:</span>
                        {currentTask.customer?.Phone || "No Phone Provided"}
                    </div>
                    <button onClick={handleCompleteTask} style={styles.primaryBtn}>
                        Approval {currentTask.type === 'pickup' ? "Perform a pickup" : "Perform a delivery"}
                    </button>
                </div>
            ) : (
                !newOffer && (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "#BBB" }}>

                        <div style={{ fontSize: "4rem", marginBottom: "15px" }}>
                            {isAvailable ? "🛵" : "💤"}
                        </div>
                        <p style={{ fontSize: "1.1rem" }}>
                            {isAvailable ? "There are no tasks at the moment. Once an invitation is received, it will appear here." : "Disconnected system"}
                        </p>
                    </div>
                )
            )}
        </div>
    );
}
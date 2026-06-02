import React, { useState, useEffect } from "react";
import LiveCourierMap from "./LiveCourierMap";
import CourierDashboard from "./CourierDashboard";

const styles = {
    splitScreenContainer: {
        display: "flex",
        direction: "rtl",
        width: "100vw",
        height: "calc(100vh - 70px)",
        overflow: "hidden",
        backgroundColor: "#F8F9FA"
    },
    mapWrapper: {
        width: "70%",
        height: "100%",
        position: "relative"
    },
    dashboardWrapper: {
        width: "30%",
        height: "100%",
        overflowY: "auto",
        borderLeft: "1px solid #E5E7EB"
    },
    fallbackMapText: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        color: "#999",
        fontFamily: "system-ui, sans-serif"
    }
};

export default function UnifiedDeliveryScreen() {
    const [currentOrderId, setCurrentOrderId] = useState(null);

    useEffect(() => {
        const checkActiveOrder = () => {
            const storedTasks = localStorage.getItem("yami_current_tasks");
            if (storedTasks) {
                try {
                    const tasks = JSON.parse(storedTasks);
                    if (tasks && tasks.length > 0) {
                        setCurrentOrderId(tasks[0].id || tasks[0].orderId);
                        return;
                    }
                } catch (e) {
                    console.error("Error parsing tasks from localStorage:", e);
                }
            }
            setCurrentOrderId(null);
        };

        checkActiveOrder();
        const interval = setInterval(checkActiveOrder, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={styles.splitScreenContainer}>

            <div style={styles.mapWrapper}>
                {currentOrderId ? (
                    <LiveCourierMap />
                ) : (
                    <div style={styles.fallbackMapText}>
                        The map will be activated as soon as an active mission is received.                    </div>
                )}
            </div>

            <div style={styles.dashboardWrapper}>
                <CourierDashboard />
            </div>

        </div>
    );
}
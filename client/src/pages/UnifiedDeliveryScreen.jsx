import React, { useState, useEffect } from "react";
import LiveCourierMap from "./LiveCourierMap"; 
import CourierDashboard from "./CourierDashboard"; 

const styles = {
    // שימוש ב-calc כדי לקחת בחשבון את ה-Navbar ולמנוע גלישה אנכית של הדף כולו
    splitScreenContainer: { 
        display: "flex", 
        direction: "rtl", 
        width: "100vw", 
        height: "calc(100vh - 70px)", 
        overflow: "hidden", 
        backgroundColor: "#F8F9FA" 
    },
    // המפה תקבל בדיוק 70% מהמכולה ולא תגלוש החוצה
    mapWrapper: { 
        width: "70%", 
        height: "100%", 
        position: "relative" 
    },
    // הדשבורד יקבל 30% ויאפשר גלילה פנימית רק בתוכו אם רשימת המשימות ארוכה
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

    // מאזין קבוע ל-localStorage כדי לתפוס את מספר ההזמנה בזמן אמת
    useEffect(() => {
        const checkActiveOrder = () => {
            const storedTasks = localStorage.getItem("yami_current_tasks");
            if (storedTasks) {
                try {
                    const tasks = JSON.parse(storedTasks);
                    if (tasks && tasks.length > 0) {
                        // שולף את ה-ID של המשימה הנוכחית
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
        const interval = setInterval(checkActiveOrder, 1000); // בודק עדכון כל שנייה

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={styles.splitScreenContainer}>
            
            {/* צד ימין: מפה (70%) */}
            <div style={styles.mapWrapper}>
                {currentOrderId ? (
                    <LiveCourierMap /> 
                ) : (
                    <div style={styles.fallbackMapText}>
                        המפה תופעל ברגע שתתקבל משימה פעילה
                    </div>
                )}
            </div>

            {/* צד שמאל: פאנל משימות והצעות (30%) */}
            <div style={styles.dashboardWrapper}>
                <CourierDashboard />
            </div>

        </div>
    );
}
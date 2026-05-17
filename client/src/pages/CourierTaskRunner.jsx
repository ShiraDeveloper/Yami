import React, { useState, useEffect } from "react";

export default function CourierTaskRunner({ tasks }) {
  // index 0 הוא תמיד היעד הנוכחי
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTask = tasks[currentIndex];

  if (!currentTask || currentIndex >= tasks.length) {
    return <div style={styles.completed}>כל המשימות הושלמו! 🎉</div>;
  }

  // פונקציה לפתיחת אפליקציית ניווט חיצונית
  const handleNavigate = () => {
    const { lat, lng } = currentTask.location;
    // קישור גנרי שעובד גם ב-Waze וגם ב-Google Maps בנייד
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  const handleTaskComplete = async () => {
    try {
      // כאן בהמשך נוסיף קריאת API לשרת לעדכון סטטוס ההזמנה
      console.log(`סיימתי משימה: ${currentTask.id}`);
      
      // מעבר למשימה הבאה בתור
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error("שגיאה בעדכון המשימה", error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>משימה {currentIndex + 1} מתוך {tasks.length}</span>
        <div style={styles.progressBar}>
          <div style={{...styles.progress, width: `${((currentIndex) / tasks.length) * 100}%`}}></div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.title}>{currentTask.type === 'pickup' ? 'איסוף מהחנות 🛍️' : 'מסירה ללקוח 🏠'}</h2>
        <p style={styles.address}><b>כתובת:</b> {currentTask.address}</p>
        <p style={styles.details}><b>פרטים:</b> {currentTask.customerName} | הזמנה #{currentTask.orderId}</p>

        <div style={styles.actions}>
          <button onClick={handleNavigate} style={styles.navBtn}>
            פתח ניווט ליעד
          </button>
          
          <button onClick={handleTaskComplete} style={styles.completeBtn}>
            הגעתי ליעד / בצעתי מסירה
          </button>
        </div>
      </div>

      {/* תצוגה מקדימה למשימה הבאה (אופציונלי) */}
      {tasks[currentIndex + 1] && (
        <div style={styles.nextTaskSmall}>
          יעד הבא: {tasks[currentIndex + 1].address}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "20px", maxWidth: "500px", margin: "0 auto" },
  header: { marginBottom: "20px", fontSize: "0.9rem", color: "#666" },
  progressBar: { height: "8px", backgroundColor: "#eee", borderRadius: "4px", marginTop: "5px" },
  progress: { height: "100%", backgroundColor: "#7B8FF5", borderRadius: "4px", transition: "width 0.3s" },
  card: { 
    backgroundColor: "white", padding: "20px", borderRadius: "12px", 
    boxShadow: "0 4px 16px rgba(31, 41, 55, 0.06)", border: "1px solid #ddd" 
  },
  title: { margin: "0 0 15px 0", color: "#1F2937" },
  address: { fontSize: "1.1rem", marginBottom: "10px" },
  actions: { display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" },
  navBtn: { padding: "12px", backgroundColor: "#10B981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  completeBtn: { padding: "12px", backgroundColor: "#7B8FF5", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  nextTaskSmall: { marginTop: "15px", textAlign: "center", fontSize: "0.8rem", color: "#6B7280", fontStyle: "italic" },
  completed: { textAlign: "center", padding: "50px", fontSize: "1.5rem", fontWeight: "bold", color: "#10B981" }
};
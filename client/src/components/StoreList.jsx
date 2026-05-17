import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function StoreList() {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);

  // סטייט עבור הסינונים
  const [filterKosher, setFilterKosher] = useState(false);
  const [filterOpenNow, setFilterOpenNow] = useState(false);

  const navigate = useNavigate();

  // קבלת מיקום בטעינה הראשונית
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setLocation({ lat: 32, lng: 34 }); // fallback
      }
    );
  }, []);

  // טעינת חנויות מה-API
  useEffect(() => {
    if (location) fetchStores();
  }, [location]);

  // פונקציית עזר להמרת שעה בודדת (HH:MM) ב-3 שעות קדימה במידת הצורך
  const addThreeHours = (timeStr) => {
    if (!timeStr) return "00:00";
    try {
      const trimmed = timeStr.trim();
      // אם מדובר בתאריך מלא של ISO String (מכיל 'T'), נחלץ ממנו את השעה המקומית ישירות
      if (trimmed.includes("T") || trimmed.includes("-") && trimmed.length > 10) {
        const dateObj = new Date(trimmed);
        return dateObj.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false });
      }

      const [hours, minutes] = trimmed.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return trimmed;
      
      const newHours = (hours + 3) % 24;
      return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch (e) {
      return timeStr;
    }
  };

  // פונקציה חכמה שמציגה את טווח השעות המקומי המתוקן על המסך
  const getLocalHoursString = (store) => {
    const hoursStr = store.openingHours || store.openingHour || store.openHours;
    if (!hoursStr) return "N/A";

    try {
      const trimmed = hoursStr.trim();
      
      // תמיכה במקרה שהשרת מחזיר תאריך ISO גולמי (למשל תאריך פתיחה/עדכון) במקום טווח שעות
      if (trimmed.includes("T") || (trimmed.includes("-") && trimmed.split("-").length !== 2)) {
        const dateObj = new Date(trimmed);
        return dateObj.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false });
      }

      const parts = trimmed.split("-");
      if (parts.length !== 2) return trimmed;

      const localStart = addThreeHours(parts[0]);
      const localEnd = addThreeHours(parts[1]);

      return `${localStart} - ${localEnd}`;
    } catch (e) {
      return hoursStr;
    }
  };

  // בדיקה האם החנות פתוחה כעת לפי השעות המעודכנות
  const isStoreOpen = useCallback((store) => {
    const hoursStr = store.openingHours || store.openingHour || store.openHours;
    if (!hoursStr) return true; 

    try {
      const trimmed = hoursStr.trim();
      const parts = trimmed.split("-");
      if (parts.length !== 2) return true;

      const [startH, startM] = addThreeHours(parts[0]).split(":").map(Number);
      const [endH, endM] = addThreeHours(parts[1]).split(":").map(Number);

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes <= endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      } else {
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }
    } catch (e) {
      return true; 
    }
  }, []);

  // הפעלת פילטרים משולבים
  const applyFiltersAndSearch = useCallback(() => {
    let result = [...stores];

    if (search) {
      result = result.filter((s) =>
        (s.name || s.storeName || "").toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterKosher) {
      result = result.filter((s) => s.kosherTags && s.kosherTags.trim() !== "");
    }

    if (filterOpenNow) {
      result = result.filter((s) => isStoreOpen(s));
    }

    setFilteredStores(result);
  }, [search, filterKosher, filterOpenNow, stores, isStoreOpen]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [applyFiltersAndSearch]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Stores?userLat=${location.lat}&userLng=${location.lng}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch stores");

      const data = await res.json();
      const storesData = Array.isArray(data) ? data : data.stores || data.data || [];

      setStores(storesData);
      setFilteredStores(storesData);
    } catch (err) {
      setError("Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  const getFallbackImage = (storeName) => {
    const name = (storeName || "").toLowerCase();
    if (name.includes("pizza")) return "https://images.unsplash.com/photo-1513104890138-7c749659a591";
    if (name.includes("sushi")) return "https://images.unsplash.com/photo-1579871494447-9811cf80d66c";
    if (name.includes("burger")) return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd";
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591";
  };

  if (loading) return <div style={styles.center}><h2>Loading stores...</h2></div>;
  if (error) return <div style={styles.center}><p style={{ color: "#EF4444" }}>{error}</p></div>;

  return (
    <div style={styles.container}>
      
      {/* 📌 אזור דביק (Sticky Header) */}
      <div style={styles.stickyHeader}>
        <h1 style={styles.title}>Stores Near You</h1>

        <input
          placeholder="Search store..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />

        {/* כפתורי סינון */}
        <div style={styles.filterContainer}>
          <button
            style={filterKosher ? styles.activeFilterBtn : styles.filterBtn}
            onClick={() => setFilterKosher(!filterKosher)}
          >
            {filterKosher ? "✓ Kosher Only" : "Kosher"}
          </button>

          <button
            style={filterOpenNow ? styles.activeFilterBtn : styles.filterBtn}
            onClick={() => setFilterOpenNow(!filterOpenNow)}
          >
            {filterOpenNow ? "✓ Open Now" : "Open Now"}
          </button>
        </div>
      </div>

      {/* רשימת החנויות */}
      <div style={styles.list}>
        {filteredStores.map((store) => {
          const open = isStoreOpen(store);
          const displayHours = getLocalHoursString(store); 
          
          return (
            <div 
              key={store.id} 
              style={styles.rectangleCard}
              onClick={() => navigate(`/store/${store.id}`)}
            >
              <div style={styles.imageContainer}>
                <img
                  src={store.imageUrl || getFallbackImage(store.name)}
                  alt={store.name || "Store"}
                  style={styles.image}
                />
                <div style={styles.timeBadge}>
                  {store.distanceFromUser ? `${store.distanceFromUser.toFixed(1)} km` : "0 m"}
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.headerRow}>
                  <h2 style={styles.storeName}>{store.name || "Unnamed Store"}</h2>
                  <div style={styles.ratingContainer}>
                    <span style={styles.star}>★</span>
                    <span style={styles.ratingText}>{store.rating?.toFixed(1) || "4.8"}</span>
                  </div>
                </div>

                <div style={styles.metaRow}>
                  <span style={styles.categoryText}>{store.category || "Fast Food"}</span>
                  {store.kosherTags && (
                    <span style={styles.kosherBadge}>• {store.kosherTags}</span>
                  )}
                  <span style={open ? styles.openText : styles.closedText}>
                    • {open ? "Open" : "Closed"} 
                    <span style={styles.hoursText}> ({displayHours})</span>
                  </span>
                </div>

                <p style={styles.descriptionText}>
                  {store.description || store.address || "Delicious meals delivered straight to your wheels."}
                </p>
              </div>
            </div>
          );
        })}
        {filteredStores.length === 0 && (
          <p style={{ textAlign: "center", color: "#6B7280", marginTop: "20px" }}>No stores match your filters.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", padding: "0 40px 40px 40px", backgroundColor: "#F8FAFC", color: "#1F2937", fontFamily: "system-ui, sans-serif" },
  stickyHeader: { position: "sticky", top: "61px", zIndex: 900, backgroundColor: "#F8FAFC", paddingTop: "20px", paddingBottom: "10px" },
  title: { textAlign: "center", marginBottom: "20px", color: "#0C1A30", fontSize: "32px", fontWeight: "800" },
  search: { display: "block", margin: "0 auto 15px auto", padding: "12px 16px", width: "100%", maxWidth: "340px", borderRadius: "24px", border: "1px solid #E2E8F0", backgroundColor: "#ffffff", color: "#000000", fontSize: "15px", outline: "none" },
  filterContainer: { display: "flex", gap: "10px", justifyContent: "center", marginBottom: "15px" },
  filterBtn: { padding: "8px 16px", borderRadius: "20px", border: "1px solid #E2E8F0", backgroundColor: "#ffffff", color: "#4B5563", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  activeFilterBtn: { padding: "8px 16px", borderRadius: "20px", border: "1px solid #1F2937", backgroundColor: "#1F2937", color: "#ffffff", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  list: { display: "flex", flexDirection: "column", gap: "20px", maxWidth: "800px", margin: "20px auto 0 auto" },
  rectangleCard: { backgroundColor: "#ffffff", borderRadius: "24px", overflow: "hidden", boxShadow: "0 4px 16px rgba(31, 41, 55, 0.04)", border: "1px solid #E2E8F0", display: "flex", flexDirection: "row", cursor: "pointer" },
  imageContainer: { position: "relative", width: "240px", minWidth: "240px", height: "160px" },
  image: { width: "100%", height: "100%", objectFit: "cover" },
  timeBadge: { position: "absolute", bottom: "12px", right: "12px", backgroundColor: "#ffffff", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", color: "#1F2937", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" },
  cardBody: { padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, gap: "6px" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center" }, 
  storeName: { fontSize: "20px", fontWeight: "700", color: "#0C1A30", margin: 0 },
  ratingContainer: { display: "flex", alignItems: "center", gap: "4px" },
  star: { color: "#F59E0B", fontSize: "16px" },
  ratingText: { fontSize: "15px", fontWeight: "600", color: "#1F2937" },
  metaRow: { display: "flex", gap: "4px", alignItems: "center", fontSize: "14px" },
  categoryText: { color: "#6B7280" },
  kosherBadge: { color: "#10B981", fontWeight: "600" },
  openText: { color: "#10B981", fontWeight: "600" },
  closedText: { color: "#EF4444", fontWeight: "600" },
  hoursText: { fontSize: "12px", color: "#6B7280", fontWeight: "normal" }, 
  descriptionText: { fontSize: "14px", color: "#4B5563", margin: "4px 0 0 0", lineHeight: "1.4" },
  center: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", color: "#1F2937", backgroundColor: "#F8FAFC" }
};
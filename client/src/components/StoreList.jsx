import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function StoreList() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStores();
  }, []);

  async function fetchStores() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");

      const res = await fetch("/api/stores/nearest", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load stores");

      const data = await res.json();
      setStores(data);
    } catch (err) {
      setError("Failed to load stores. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-10">
        <p className="mb-4">{error}</p>
        <Button onClick={fetchStores}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Stores Near You</h1>

      <div className="grid gap-4">
        {stores.map((store, index) => (
          <motion.div
            key={store.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium">{store.name}</h2>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin size={16} className="mr-1" />
                    {store.distanceKm ? store.distanceKm.toFixed(2) : 0} km
                  </div>
                </div>

                <Button
                  onClick={() => {
                    window.location.href = `/store/${store.id}`;
                  }}
                >
                  View Menu
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";

export default function Stores() {

  const [stores, setStores] = useState([]);

  useEffect(() => {

    navigator.geolocation.getCurrentPosition(async (position) => {

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const response = await fetch(
        `https://localhost:7234/api/stores?userLat=${lat}&userLng=${lng}`
      );

      const data = await response.json();

      setStores(data);

    });

  }, []);

  return (
    <div>

      <h2>Stores Near You</h2>

      {stores.map(store => (
        <div key={store.id}>

          <h3>{store.name}</h3>
          <p>{store.address}</p>
          <p>Distance: {store.distanceFromUser.toFixed(2)} km</p>

        </div>
      ))}

    </div>
  );
}
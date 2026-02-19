import React, { useState } from 'react';
import './App.css';
import Auth from './components/Auth';
import StoreMenu from './components/StoreMenu';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="App" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      {!isLoggedIn ? (
        <Auth onLogin={() => setIsLoggedIn(true)} />
      ) : (
        <StoreMenu storeId={1} customerId={123} />
      )}
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';

import Navbar from './components/Navbar.jsx';
import MealList from './components/MealList.jsx';
import Cart from './components/Cart.jsx';
import AdminOrders from './components/AdminOrders.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminMealManager from './components/AdminMealManager.jsx';

function App() {
  const [cart, setCart] = useState([]); 
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuth(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('token', token); 
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
    setIsAuth(true); 
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    delete axios.defaults.headers.common['Authorization']; 
    setIsAuth(false); 
    navigate('/'); 
  };

  const handleAddToCart = (mealToAdd) => {
    const existingItem = cart.find(item => item.meal.uniqueCartId === mealToAdd.uniqueCartId);
    if (existingItem) {
      setCart(
        cart.map(item =>
          item.meal.uniqueCartId === mealToAdd.uniqueCartId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { meal: mealToAdd, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (uniqueCartId, newQuantity) => {
    const quantityNum = parseInt(newQuantity); 
    if (quantityNum > 0) {
      setCart(cart.map(item => item.meal.uniqueCartId === uniqueCartId ? { ...item, quantity: quantityNum } : item));
    } else {
      handleRemoveFromCart(uniqueCartId);
    }
  };

  const handleRemoveFromCart = (uniqueCartId) => {
    setCart(cart.filter(item => item.meal.uniqueCartId !== uniqueCartId));
  };

  const handleSubmitOrder = (orderData) => {
    axios.post('http://localhost:3001/api/orders', orderData)
      .then(response => {
        alert('訂單建立成功！訂單 ID: ' + response.data.orderId);
        setCart([]); 
        navigate('/'); 
      })
      .catch(error => {
        console.error("訂單建立失敗:", error);
        alert('訂單建立失敗，請稍後再試。');
      });
  };

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        cartItemCount={totalItemCount} 
        isAuth={isAuth} 
        onLogout={handleLogout} 
      />
      
      <main>
        <Routes>
          <Route 
            path="/" 
            element={<MealList onAddToCart={handleAddToCart} />} 
          />
          <Route 
            path="/cart" 
            element={
              <Cart 
                cartItems={cart} 
                onSubmitOrder={handleSubmitOrder}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveFromCart}
              />
            } 
          />
          <Route 
            path="/admin/login" 
            element={<AdminLogin onLogin={handleLogin} />} 
          />
          <Route 
            path="/admin/orders" 
            element={
              <ProtectedRoute isAuth={isAuth}>
                <AdminOrders />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/meals" 
            element={
              <ProtectedRoute isAuth={isAuth}>
               <AdminMealManager />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
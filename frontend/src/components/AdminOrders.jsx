import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3001/api/admin/orders')
      .then(response => {
        setOrders(response.data.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("獲取訂單紀錄失敗:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center">正在載入訂單紀錄...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">後台訂單管理</h1>
      
      <div className="space-y-6">
        {orders.length === 0 ? (
          <p className="text-center text-gray-500">目前沒有任何訂單。</p>
        ) : (
          orders.map(order => (
            <div key={order.id} className="border rounded-lg shadow-md p-6 bg-white">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                <h2 className="text-xl font-semibold">訂單編號: #{order.id}</h2>
                
                <span className="text-lg font-semibold text-purple-700 my-2 sm:my-0">
                  顧客: {order.customer_name}
                </span>

                <span className="text-xl font-bold text-blue-600">${order.total_price.toFixed(2)}</span>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                下單時間: {new Date(order.created_at).toLocaleString()}
              </p>

              <div className="space-y-2">
                <h3 className="text-md font-semibold text-gray-700">訂單內容:</h3>
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>{item.meal.name}</span>
                    <span>x {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminOrders;
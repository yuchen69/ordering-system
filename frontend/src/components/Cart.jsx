import React, { useState } from 'react';

function Cart({ cartItems, onSubmitOrder, onUpdateQuantity, onRemoveItem }) {
  
  const [customerName, setCustomerName] = useState('');

  const totalPrice = cartItems.reduce((total, item) => {
    return total + (item.meal.price * item.quantity);
  }, 0);

  const handleOrderClick = () => {
    if (cartItems.length === 0) {
      alert('您的購物車是空的！');
      return;
    }
    
    if (customerName.trim() === '') {
      alert('請輸入您的姓名或桌號！');
      return;
    }

    onSubmitOrder({ 
      items: cartItems, 
      totalPrice: totalPrice,
      customerName: customerName 
    });
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">您的購物車</h2>
      {cartItems.length === 0 ? (
        <p className="text-center text-gray-600">購物車目前是空的。</p>
      ) : (
        <div>
          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <div key={item.meal.uniqueCartId} className="flex flex-col md:flex-row justify-between items-center border p-4 rounded-lg shadow">
                <span className="text-lg font-semibold mb-2 md:mb-0 md:w-1/3">{item.meal.name}</span>
                <span className="text-md text-gray-700 md:w-1/6">${item.meal.price} / 份</span>
                <div className="flex items-center space-x-2 my-2 md:my-0 md:w-1/4">
                  <span className="text-sm">數量:</span>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.meal.uniqueCartId, e.target.value)}
                    className="w-16 text-center border rounded"
                  />
                </div>
                <button
                  onClick={() => onRemoveItem(item.meal.uniqueCartId)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  移除
                </button>
              </div>
            ))}
          </div>

          <hr className="my-6" />
          <div className="flex justify-between items-center text-2xl font-bold">
            <span>總金額:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          <div className="my-6">
            <label className="block text-lg font-medium text-gray-700 mb-2">
              您的姓名 或 桌號 (必填)
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-lg"
              placeholder="例如：陳先生 或 3號桌"
              required
            />
          </div>

          <button
            onClick={handleOrderClick}
            className="w-full mt-6 bg-green-500 text-white py-3 rounded-lg text-lg font-bold hover:bg-green-600 transition-colors"
          >
            送出訂單
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;
import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ cartItemCount, isAuth, onLogout }) {
  return (
    <nav className="bg-white shadow-md p-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50">
      
      <Link to="/" className="text-2xl font-bold text-blue-600">
        點餐系統
      </Link>
      
      <div className="flex items-center flex-wrap justify-center md:justify-end gap-4"> 
        
        <Link to="/cart" className="relative">
          <span className="text-xl">🛒</span>
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </Link>
        
        <Link 
          to="/admin/orders" 
          className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          訂單管理
        </Link>
        
        <Link 
          to="/admin/meals" 
          className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          餐點管理
        </Link>
        
        {isAuth && (
          <button 
            onClick={onLogout}
            className="py-2 px-4 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            登出
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
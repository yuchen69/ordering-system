import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MealCard from './MealCard.jsx';

function MealList({ onAddToCart }) {
  const [meals, setMeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const fetchMeals = (categoryId) => {
    setLoading(true);
    let apiUrl = 'http://localhost:3001/api/meals';

    if (categoryId) {
      apiUrl += `?category_id=${categoryId}`;
    }

    axios.get(apiUrl)
      .then(response => {
        setMeals(response.data.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("獲取餐點失敗:", error);
        setLoading(false);
      });
  };

  const fetchCategories = () => {
    axios.get('http://localhost:3001/api/categories')
      .then(response => {
        setCategories(response.data.data);
      })
      .catch(error => {
        console.error("獲取分類列表失敗:", error);
      });
  };

  useEffect(() => {
    fetchCategories();
    fetchMeals(null);
  }, []);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId);
    fetchMeals(categoryId);
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-center mb-8">請選擇餐點</h2>

      <div className="flex justify-center flex-wrap gap-4 mb-8">
        <button
          onClick={() => handleCategoryClick(null)}
          className={`py-2 px-5 rounded-full font-medium transition-colors
            ${selectedCategoryId === null
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100 border'
            }
          `}
        >
          全部
        </button>

        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`py-2 px-5 rounded-full font-medium transition-colors
              ${selectedCategoryId === category.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }
            `}
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center p-10">餐點載入中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {meals.length > 0 ? (
            meals.map(meal => (
              <MealCard
                key={meal.id}
                meal={meal}
                onAddToCart={onAddToCart}
              />
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-3">這個分類目前沒有餐點。</p>
          )}
        </div>
      )}
    </div>
  );
}

export default MealList;
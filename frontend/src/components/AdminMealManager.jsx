import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminMealManager() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [optionsStr, setOptionsStr] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [editingMeal, setEditingMeal] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    price: '',
    description: '',
    optionsStr: '',
    categoryId: ''
  });

  const fetchCategories = () => {
    return axios.get('http://localhost:3001/api/categories')
      .then(response => {
        setCategories(response.data.data);
      })
      .catch(error => {
        console.error("獲取分類列表失敗:", error);
        setError("無法載入分類列表");
      });
  };

  const fetchMeals = () => {
    setLoading(true);
    axios.get('http://localhost:3001/api/meals')
      .then(response => {
        setMeals(response.data.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("獲取餐點列表失敗:", error);
        setError("無法載入餐點列表");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCategories();
    fetchMeals();
  }, []);

  const handleAddMeal = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!categoryId) {
      setError('請選擇一個餐點分類');
      return;
    }

    const optionsArray = optionsStr.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);

    const newMealData = {
      name,
      price: parseFloat(price),
      description: description || null,
      options: optionsArray,
      category_id: parseInt(categoryId)
    };

    axios.post('http://localhost:3001/api/admin/meals', newMealData)
      .then(response => {
        setMessage('餐點新增成功！');
        setName(''); setPrice(''); setDescription(''); setOptionsStr(''); setCategoryId('');
        fetchMeals();
      })
      .catch(err => {
        setError(err.response?.data?.error || '新增失敗');
      });
  };

  const handleDelete = (mealId, mealName) => {
    if (window.confirm(`您確定要刪除 "${mealName}" 這筆餐點嗎？`)) {
      setMessage(''); setError('');
      axios.delete(`http://localhost:3001/api/admin/meals/${mealId}`)
        .then(response => {
          setMessage(`餐點 "${mealName}" 已成功刪除。`);
          fetchMeals();
        })
        .catch(err => {
          setError(err.response?.data?.error || '刪除失敗');
        });
    }
  };

  const handleEditClick = (meal) => {
    setEditingMeal(meal);

    setEditFormData({
      name: meal.name,
      price: meal.price,
      description: meal.description || '',
      optionsStr: meal.options ? meal.options.join(', ') : '',
      categoryId: meal.category_id
    });

    setMessage('');
    setError('');
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleUpdateMeal = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const optionsArray = editFormData.optionsStr.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);

    const updatedMealData = {
      name: editFormData.name,
      price: parseFloat(editFormData.price),
      description: editFormData.description || null,
      options: optionsArray,
      category_id: parseInt(editFormData.categoryId)
    };

    axios.put(`http://localhost:3001/api/admin/meals/${editingMeal.id}`, updatedMealData)
      .then(response => {
        setMessage(`餐點 "${updatedMealData.name}" 已成功更新。`);
        setEditingMeal(null);
        fetchMeals();
      })
      .catch(err => {
        setError(err.response?.data?.error || '更新失敗');
      });
  };

  const handleCancelEdit = () => {
    setEditingMeal(null);
    setError('');
    setMessage('');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">後台餐點管理</h1>

      <form onSubmit={handleAddMeal} className="mb-12 p-6 border rounded-lg shadow-md bg-white space-y-4">
        <h2 className="text-2xl font-semibold mb-4">新增餐點</h2>

        {message && <p className="text-green-600 bg-green-100 p-3 rounded">{message}</p>}
        {error && <p className="text-red-600 bg-red-100 p-3 rounded">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">餐點名稱 (必填)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">價格 (必填)</label>
            <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">分類 (必填)</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            required
          >
            <option value="" disabled>-- 請選擇分類 --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">描述</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">客製化選項 (請用半形逗號 , 隔開)</label>
          <input type="text" value={optionsStr} onChange={(e) => setOptionsStr(e.target.value)} placeholder="例如: 不要酸黃瓜,不要番茄醬" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <button type="submit" className="w-full bg-green-500 text-white py-2 px-4 rounded-md font-semibold hover:bg-green-600">
          確認新增
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">現有餐點列表</h2>
        {loading ? (
          <p>載入中...</p>
        ) : (
          <div className="space-y-4">
            {meals.map(meal => (
              <div key={meal.id} className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-white">
                <div>
                  <h3 className="text-lg font-semibold">{meal.name}</h3>
                  <p className="text-gray-600">${meal.price}</p>
                  <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">
                    {categories.find(c => c.id === meal.category_id)?.name || '未分類'}
                  </span>
                </div>
                <div className="space-x-2">
                  <button onClick={() => handleEditClick(meal)} className="py-1 px-3 rounded text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600">
                    編輯
                  </button>
                  <button onClick={() => handleDelete(meal.id, meal.name)} className="py-1 px-3 rounded text-sm font-medium text-white bg-red-500 hover:bg-red-600">
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg">

            <form onSubmit={handleUpdateMeal} className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">編輯餐點: {editingMeal.name}</h2>

              {error && <p className="text-red-600 bg-red-100 p-3 rounded">{error}</p>}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">餐點名稱</label>
                  <input type="text" name="name" value={editFormData.name} onChange={handleEditFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">價格</label>
                  <input type="number" name="price" min="0" step="0.01" value={editFormData.price} onChange={handleEditFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">分類</label>
                <select
                  name="categoryId"
                  value={editFormData.categoryId}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                  required
                >
                  <option value="" disabled>-- 請選擇分類 --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">描述</label>
                <input type="text" name="description" value={editFormData.description} onChange={handleEditFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">客製化選項 (逗號隔開)</label>
                <input type="text" name="optionsStr" value={editFormData.optionsStr} onChange={handleEditFormChange} placeholder="例如: 不要酸黃瓜,不要番茄醬" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button type="button" onClick={handleCancelEdit} className="py-2 px-4 rounded text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                  取消
                </button>
                <button type="submit" className="py-2 px-4 rounded text-sm font-medium text-white bg-blue-500 hover:bg-blue-600">
                  儲存更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMealManager;
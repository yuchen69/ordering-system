import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminMealManager() {
  // 表單狀態
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [optionsStr, setOptionsStr] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // 資料列表狀態
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // 系統訊息
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 編輯模式狀態
  const [editingMeal, setEditingMeal] = useState(null);

  // 初始化：載入分類與餐點
  useEffect(() => {
    fetchCategories();
    fetchMeals();
  }, []);

  const fetchCategories = () => {
    axios.get('http://localhost:3001/api/categories')
      .then(res => setCategories(res.data.data))
      .catch(err => console.error("分類載入失敗", err));
  };

  const fetchMeals = () => {
    setLoading(true);
    axios.get('http://localhost:3001/api/meals')
      .then(res => {
        setMeals(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("餐點載入失敗", err);
        setLoading(false);
      });
  };

  // --- 新增 / 更新邏輯 ---
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!categoryId) {
      setError('請選擇分類');
      return;
    }

    // 將字串 "A, B, C" 轉為陣列 ["A", "B", "C"]
    const optionsArray = optionsStr.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);

    const mealData = {
      name,
      price: parseFloat(price),
      description: description || null,
      options: optionsArray,
      category_id: parseInt(categoryId)
    };

    if (editingMeal) {
      // 更新模式
      axios.put(`http://localhost:3001/api/admin/meals/${editingMeal.id}`, mealData)
        .then(() => {
          setMessage(`餐點 "${name}" 更新成功！`);
          resetForm();
          fetchMeals();
        })
        .catch(err => setError(err.response?.data?.error || '更新失敗'));
    } else {
      // 新增模式
      axios.post('http://localhost:3001/api/admin/meals', mealData)
        .then(() => {
          setMessage('餐點新增成功！');
          resetForm();
          fetchMeals();
        })
        .catch(err => setError(err.response?.data?.error || '新增失敗'));
    }
  };

  // --- 刪除邏輯 ---
  const handleDelete = (id, mealName) => {
    if (window.confirm(`確定要刪除 "${mealName}" 嗎？`)) {
      axios.delete(`http://localhost:3001/api/admin/meals/${id}`)
        .then(() => {
          setMessage('刪除成功');
          fetchMeals();
        })
        .catch(err => setError('刪除失敗'));
    }
  };

  // --- 編輯準備 ---
  const handleEditClick = (meal) => {
    setEditingMeal(meal);
    setName(meal.name);
    setPrice(meal.price);
    setDescription(meal.description || '');
    setCategoryId(meal.category_id);
    // 將陣列轉回逗號分隔字串
    setOptionsStr(meal.options ? meal.options.join(', ') : '');
    
    // 滾動到最上方
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMessage(`正在編輯: ${meal.name}`);
  };

  const resetForm = () => {
    setEditingMeal(null);
    setName('');
    setPrice('');
    setDescription('');
    setOptionsStr('');
    setCategoryId('');
    setError('');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8 text-center">餐點管理後台</h1>

      {/* --- 表單區塊 --- */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-700">
            {editingMeal ? '✏️ 編輯餐點' : '➕ 新增餐點'}
          </h2>
          {editingMeal && (
            <button onClick={resetForm} className="text-sm text-slate-500 hover:text-slate-800 underline">
              取消編輯，改為新增
            </button>
          )}
        </div>

        {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{message}</div>}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">餐點名稱</label>
              <input 
                type="text" required 
                value={name} onChange={e => setName(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                placeholder="例如：大麥克"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">價格</label>
              <input 
                type="number" required 
                value={price} onChange={e => setPrice(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">分類</label>
            <select 
              required 
              value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-slate-500 outline-none"
            >
              <option value="">-- 請選擇分類 --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">描述</label>
            <textarea 
              value={description} onChange={e => setDescription(e.target.value)}
              className="w-full p-2 border rounded-lg h-24 resize-none focus:ring-2 focus:ring-slate-500 outline-none"
              placeholder="簡單介紹這道餐點..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">客製化選項 (用逗號分隔)</label>
            <input 
              type="text" 
              value={optionsStr} onChange={e => setOptionsStr(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
              placeholder="例如: 去冰, 少糖, 加珍珠"
            />
          </div>

          <button 
            type="submit" 
            className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-md ${
              editingMeal ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-900'
            }`}
          >
            {editingMeal ? '確認更新' : '新增餐點'}
          </button>
        </form>
      </div>

      {/* --- 列表區塊 --- */}
      <div>
        <h2 className="text-xl font-bold text-slate-700 mb-4 border-l-4 border-slate-800 pl-3">現有餐點列表</h2>
        {loading ? <p className="text-center text-slate-500">載入中...</p> : (
          <div className="grid gap-4">
            {meals.map(meal => (
              <div key={meal.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center group hover:shadow-md transition-all">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    {meal.name} 
                    <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                      {categories.find(c => c.id === meal.category_id)?.name}
                    </span>
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">{meal.description || '無描述'}</p>
                  <div className="text-slate-400 text-xs mt-2">
                    ${meal.price} | 選項: {meal.options?.join(', ') || '無'}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditClick(meal)}
                    className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 font-medium text-sm transition-colors"
                  >
                    編輯
                  </button>
                  <button 
                    onClick={() => handleDelete(meal.id, meal.name)}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium text-sm transition-colors"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminMealManager;
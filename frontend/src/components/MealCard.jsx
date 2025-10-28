import React, { useState } from 'react';

function MealCard({ meal, onAddToCart }) {
  const { id, name, price, description, options } = meal;

  const [selectedOptions, setSelectedOptions] = useState(() => {
    const initialState = {};
    if (options) {
      options.forEach(option => {
        initialState[option] = false;
      });
    }
    return initialState;
  });

  const handleOptionChange = (optionName) => {
    setSelectedOptions(prevOptions => ({
      ...prevOptions,
      [optionName]: !prevOptions[optionName]
    }));
  };

  const handleAddToCartClick = () => {
    const selectedOptionNames = Object.keys(selectedOptions).filter(
      option => selectedOptions[option]
    );

    let customizedName = name;
    if (selectedOptionNames.length > 0) {
      customizedName = `${name} (${selectedOptionNames.join(', ')})`;
    }

    const customizedMeal = {
      ...meal,
      uniqueCartId: `${id}_${selectedOptionNames.join('_')}`, 
      name: customizedName, 
    };

    onAddToCart(customizedMeal);

    setSelectedOptions(() => {
        const initialState = {};
        if (options) {
            options.forEach(option => {
                initialState[option] = false;
            });
        }
        return initialState;
    });
  };

  return (
    <div className="border-b border-gray-300 p-4 w-full">
      <div className="flex items-center w-full">
        <div>
          <h3 className="text-xl font-semibold">{name}</h3>
        </div>
        <div className="ml-6">
          <p className="text-lg text-gray-700">${price}</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={handleAddToCartClick}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            加入購物車
          </button>
        </div>
      </div>

      <div className="mt-2">
        {options && options.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
            {options.map(option => (
              <label key={option} className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOptions[option]}
                  onChange={() => handleOptionChange(option)}
                  className="form-checkbox h-4 w-4"
                />
                <span className="text-gray-800">{option}</span>
              </label>
            ))}
            {description && (
              <p className="text-sm text-gray-600">
                ({description})
              </p>
            )}
          </div>
        )}
        {description && (!options || options.length === 0) && (
           <p className="text-sm text-gray-600 mt-2">({description})</p>
        )}
      </div>
    </div>
  );
}

export default MealCard;
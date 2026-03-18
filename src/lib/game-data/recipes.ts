// 遊戲靜態數據 - 製作配方
export const recipes = [
  { id: 'recipe_1', resultItemId: 'item_2', resultQuantity: 1, requiredLevel: 3, materials: [{ itemId: 'item_16', quantity: 3 }, { itemId: 'item_15', quantity: 2 }] },
  { id: 'recipe_2', resultItemId: 'item_3', resultQuantity: 1, requiredLevel: 10, materials: [{ itemId: 'item_16', quantity: 5 }, { itemId: 'item_21', quantity: 2 }, { itemId: 'item_20', quantity: 3 }] },
  { id: 'recipe_3', resultItemId: 'item_5', resultQuantity: 1, requiredLevel: 10, materials: [{ itemId: 'item_15', quantity: 3 }, { itemId: 'item_18', quantity: 4 }] },
  { id: 'recipe_4', resultItemId: 'item_7', resultQuantity: 1, requiredLevel: 12, materials: [{ itemId: 'item_15', quantity: 5 }, { itemId: 'item_18', quantity: 2 }, { itemId: 'item_19', quantity: 2 }] },
  { id: 'recipe_5', resultItemId: 'item_9', resultQuantity: 1, requiredLevel: 3, materials: [{ itemId: 'item_19', quantity: 5 }] },
  { id: 'recipe_6', resultItemId: 'item_10', resultQuantity: 1, requiredLevel: 8, materials: [{ itemId: 'item_16', quantity: 8 }, { itemId: 'item_19', quantity: 3 }] },
  { id: 'recipe_7', resultItemId: 'item_11', resultQuantity: 1, requiredLevel: 5, materials: [{ itemId: 'item_17', quantity: 5 }, { itemId: 'item_18', quantity: 2 }] },
  { id: 'recipe_8', resultItemId: 'item_13', resultQuantity: 1, requiredLevel: 5, materials: [{ itemId: 'item_16', quantity: 2 }, { itemId: 'item_20', quantity: 2 }] },
  { id: 'recipe_9', resultItemId: 'item_14', resultQuantity: 1, requiredLevel: 5, materials: [{ itemId: 'item_18', quantity: 2 }, { itemId: 'item_16', quantity: 1 }] },
  { id: 'recipe_10', resultItemId: 'item_23', resultQuantity: 2, requiredLevel: 1, materials: [{ itemId: 'item_17', quantity: 2 }] },
  { id: 'recipe_11', resultItemId: 'item_24', resultQuantity: 1, requiredLevel: 5, materials: [{ itemId: 'item_17', quantity: 4 }, { itemId: 'item_18', quantity: 1 }] },
  { id: 'recipe_12', resultItemId: 'item_25', resultQuantity: 2, requiredLevel: 1, materials: [{ itemId: 'item_18', quantity: 1 }] },
];

export const recipesMap = new Map(recipes.map(r => [r.id, r]));

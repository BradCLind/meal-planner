const {
  initializeDatabase,
  addMeal,
  addIngredient,
  addMealIngredient,
  getAllMeals,
  getMealIngredients
} = require('./database.js');

// Initialize the database
initializeDatabase();

// Add a test meal
console.log('\nAdding spaghetti meal...');
const spaghettiId = addMeal('Spaghetti Bolognese', 'Brown beef, add sauce, cook pasta, combine');

// Add some ingredients
console.log('Adding ingredients...');
const beefId = addIngredient('Ground Beef', 'Fridge', 3);
const pastaId = addIngredient('Spaghetti Noodles', 'Pantry', 730);
const sauceId = addIngredient('Tomato Sauce', 'Pantry', 365);

// Link ingredients to meal
console.log('Linking ingredients to meal...');
addMealIngredient(spaghettiId, beefId, '1 lb');
addMealIngredient(spaghettiId, pastaId, '1 box');
addMealIngredient(spaghettiId, sauceId, '1 jar');

// Retrieve and display
console.log('\n=== All Meals ===');
console.log(getAllMeals());

console.log('\n=== Spaghetti Ingredients ===');
console.log(getMealIngredients(spaghettiId));

console.log('\nTest complete! Check meal-planner.db file was created.');
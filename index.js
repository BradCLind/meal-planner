const {
  initializeDatabase,
  getAllMeals,
  getMealIngredients
} = require('./database.js');

const readline = require('readline');

// Setup for reading user input from command line
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to ask questions and get answers
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// STEP 1: Display all available meals
function displayMeals(meals) {
    console.log('\n=== Available Meals ===');
    meals.forEach(meal => {
        console.log(`${meal.id}. ${meal.name}`)
    });
}

// STEP 2: Get user's meal selections
async function getMealSelections(meals) {
  console.log('\nEnter meal IDs you want this week (comma separated, e.g., 1,3,5):');
  const input = await askQuestion('> ');
  
  // Split by comma and convert to numbers
  const selectedMealIds = input
    .split(',')                    // "1,3,5" becomes ['1', '3', '5']
    .map(id => parseInt(id.trim())) // trim spaces, convert to numbers
    .filter(id => !isNaN(id));     // remove any non-numbers
  
  // Validate that these IDs exist in our meals
  const validIds = selectedMealIds.filter(id => {
    return meals.some(meal => meal.id === id);
  });
  
  // Tell user if any IDs were invalid
  if (validIds.length !== selectedMealIds.length) {
    console.log('Warning: Some meal IDs were not found and were skipped.');
  }
  
  console.log(`Selected ${validIds.length} meals.`);
  
  return validIds;
}

// STEP 3: Generate shopping list from selected meals
function generateShoppingList(selectedMealIds) {
  console.log('\n=== Shopping List ===');
  
  // Object to store ingredients grouped by category
  const shoppingList = {
    Pantry: [],
    Fridge: [],
    Freezer: [],
    Misc: []
  };
  
  // For each selected meal, get its ingredients
  selectedMealIds.forEach(mealId => {
    const ingredients = getMealIngredients(mealId);
    
    // Add each ingredient to the appropriate category
    ingredients.forEach(ingredient => {
      const item = `${ingredient.ingredient_name} (${ingredient.quantity})`;
      shoppingList[ingredient.category].push(item);
    });
  });
  
  // Print each category
  Object.keys(shoppingList).forEach(category => {
    if (shoppingList[category].length > 0) {
      console.log(`\n${category}:`);
      shoppingList[category].forEach(item => {
        console.log(`  - ${item}`);
      });
    }
  });
  
  console.log('\n');
}

// STEP 4: Main program flow
async function main() {
  console.log('Welcome to Meal Planner!\n');
  
  // Initialize database (creates tables if they don't exist)
  initializeDatabase();
  
  // Get all meals from database
  const meals = getAllMeals();
  
  // Check if we have any meals
  if (meals.length === 0) {
    console.log('No meals in database yet. Run test.js to add sample data.');
    rl.close();
    return;
  }
  
  // Display meals to user
  displayMeals(meals);
  
  // Get user's selections
  const selectedMealIds = await getMealSelections(meals);
  
  // Generate shopping list
  generateShoppingList(selectedMealIds);
  
  // Close the input interface
  rl.close();
}

// Run the program
main();
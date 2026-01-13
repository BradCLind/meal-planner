const {
  initializeDatabase,
  getMealsWithRatings,
  getMealIngredients,
  addMealToHistory
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

// Helper to format a person's rating for display
function formatRating(avgRating, count) {
  if (count === 0 || avgRating === null) {
    return 'not rated';
  }
  // Round to 1 decimal place
  const rounded = avgRating.toFixed(1);
  return `⭐ ${rounded} (${count}x)`;
}

// STEP 1: Display meals with ratings
function displayMeals(meals) {
  console.log('\n=== Available Meals ===\n');
  
  meals.forEach(meal => {
    console.log(`${meal.id}. ${meal.name}`);
    
    // Show ratings on a second line, indented
    const bradRating = formatRating(meal.brad_avg_rating, meal.brad_rating_count);
    const kaylaRating = formatRating(meal.kayla_avg_rating, meal.kayla_rating_count);
    const skylarRating = formatRating(meal.skylar_avg_rating, meal.skylar_rating_count);
    const aubreyRating = formatRating(meal.aubrey_avg_rating, meal.aubrey_rating_count);
    
    console.log(`   Brad: ${bradRating}  Kayla: ${kaylaRating}`);
    console.log(`   Skylar: ${skylarRating}  Aubrey: ${aubreyRating}`);
    console.log(''); // Blank line between meals
  });
}

// STEP 2: Apply filters to meal list
function applyFilters(meals, filterType) {
  if (filterType === 'all' || filterType === '') {
    return meals;
  }
  
  // Filter: Show only highly rated meals (4+ average across people who rated)
  if (filterType === '4+') {
    return meals.filter(meal => {
      const ratings = [
        meal.brad_avg_rating,
        meal.kayla_avg_rating,
        meal.skylar_avg_rating,
        meal.aubrey_avg_rating
      ].filter(r => r !== null);
      
      // Need at least one rating
      if (ratings.length === 0) return false;
      
      // Average of all people who rated it
      const overallAvg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      return overallAvg >= 4.0;
    });
  }
  
  // Filter: Show meals Brad rated 4+
  if (filterType === 'brad') {
    return meals.filter(meal => meal.brad_avg_rating !== null && meal.brad_avg_rating >= 4.0);
  }
  
  // Filter: Show meals Kayla rated 4+
  if (filterType === 'kayla') {
    return meals.filter(meal => meal.kayla_avg_rating !== null && meal.kayla_avg_rating >= 4.0);
  }
  
  // Filter: Show meals Skylar rated 4+
  if (filterType === 'skylar') {
    return meals.filter(meal => meal.skylar_avg_rating !== null && meal.skylar_avg_rating >= 4.0);
  }
  
  // Filter: Show meals Aubrey rated 4+
  if (filterType === 'aubrey') {
    return meals.filter(meal => meal.aubrey_avg_rating !== null && meal.aubrey_avg_rating >= 4.0);
  }
  
  // Filter: Show unrated meals (no one has rated them yet)
  if (filterType === 'new') {
    return meals.filter(meal => 
      meal.brad_rating_count === 0 && 
      meal.kayla_rating_count === 0 && 
      meal.skylar_rating_count === 0 && 
      meal.aubrey_rating_count === 0
    );
  }
  
  // Filter: Hide meals where Skylar rated under 3 (avoid things Skylar dislikes)
  if (filterType === 'no-skylar-dislike') {
    return meals.filter(meal => {
      // Include meals Skylar hasn't rated
      if (meal.skylar_rating_count === 0) return true;
      // Include meals Skylar rated 3 or higher
      return meal.skylar_avg_rating >= 3.0;
    });
  }

   // Filter: Hide meals where Aub rated under 3 (avoid things Aubrey dislikes)
  if (filterType === 'no-aub-dislike') {
    return meals.filter(meal => {
      // Include meals Aub hasn't rated
      if (meal.aubrey_rating_count === 0) return true;
      // Include meals Aub rated 3 or higher
      return meal.aub_avg_rating >= 3.0;
    });
  }
  
  // If unknown filter, return all
  return meals;
}

// STEP 3: Ask user for filter preference
async function getFilterChoice() {
  console.log('\n=== Filter Options ===');
  console.log('  all       - Show all meals');
  console.log('  4+        - Show only highly rated meals (4+ stars average)');
  console.log('  brad      - Show meals Brad rated 4+');
  console.log('  kayla     - Show meals Kayla rated 4+');
  console.log('  skylar    - Show meals Skylar rated 4+');
  console.log('  aubrey    - Show meals Aubrey rated 4+');
  console.log('  new       - Show unrated meals only');
  console.log('  no-skylar-dislike - Hide meals Skylar rated under 3');
  console.log('  no-aub-dislike - Hide meals Aub rated under 3\n');

  
  const filter = await askQuestion('Choose filter (or press Enter for all): ');
  return filter.trim().toLowerCase();
}

// STEP 4: Get user's meal selections
async function getMealSelections(meals) {
  console.log('\nEnter meal IDs you want this week (comma separated, e.g., 1,3,5):');
  const input = await askQuestion('> ');
  
  // Split by comma and convert to numbers
  const selectedMealIds = input
    .split(',')
    .map(id => parseInt(id.trim()))
    .filter(id => !isNaN(id));
  
  // Validate that these IDs exist in our filtered meals
  const validIds = selectedMealIds.filter(id => {
    return meals.some(meal => meal.id === id);
  });
  
  // Tell user if any IDs were invalid
  if (validIds.length !== selectedMealIds.length) {
    console.log('Warning: Some meal IDs were not found in the filtered list and were skipped.');
  }
  
  console.log(`Selected ${validIds.length} meals.`);
  
  return validIds;
}

// STEP 5: Generate shopping list from selected meals
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

// STEP 6: Save meal selections to history
function saveMealsToHistory(selectedMealIds) {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Save each selected meal to history
  selectedMealIds.forEach(mealId => {
    addMealToHistory(mealId, today);
  });
  
  console.log(`✅ Saved ${selectedMealIds.length} meals to history for rating later.\n`);
}

// STEP 7: Main program flow
async function main() {
  console.log('Welcome to Meal Planner!\n');
  
  // Initialize database (creates tables if they don't exist)
  initializeDatabase();
  
  // Get all meals with their ratings
  const allMeals = getMealsWithRatings();
  
  // Check if we have any meals
  if (allMeals.length === 0) {
    console.log('No meals in database yet. Run test.js to add sample data.');
    rl.close();
    return;
  }
  
  // Ask user what filter they want
  const filterChoice = await getFilterChoice();
  
  // Apply the filter
  const filteredMeals = applyFilters(allMeals, filterChoice);
  
  if (filteredMeals.length === 0) {
    console.log('\n⚠️  No meals match this filter. Try a different filter.\n');
    rl.close();
    return;
  }
  
  console.log(`\nShowing ${filteredMeals.length} of ${allMeals.length} meals.`);
  
  // Display filtered meals with ratings
  displayMeals(filteredMeals);
  
  // Get user's selections
  const selectedMealIds = await getMealSelections(filteredMeals);
  
  // If user didn't select any meals, exit
  if (selectedMealIds.length === 0) {
    console.log('\nNo meals selected. Exiting.\n');
    rl.close();
    return;
  }
  
  // Generate shopping list
  generateShoppingList(selectedMealIds);
  
  // Save selections to history for later rating
  saveMealsToHistory(selectedMealIds);
  
  // Close the input interface
  rl.close();
}

// Run the program
main();
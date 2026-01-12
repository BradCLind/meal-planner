const {
  initializeDatabase,
  addMeal,
  addIngredient,
  addMealIngredient,
  db
} = require('./database.js');

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Check if ingredient already exists, if not create it
function getOrCreateIngredient(name, category, shelfLifeDays) {
  // Try to find existing ingredient
  const existing = db.prepare('SELECT id FROM ingredients WHERE name = ?').get(name);
  
  if (existing) {
    return existing.id;
  }
  
  // Create new ingredient
  return addIngredient(name, category, shelfLifeDays);
}

async function main() {
  console.log('=== Add New Meal ===\n');
  
  initializeDatabase();
  
  // Get meal details
  const mealName = await askQuestion('Meal name: ');
  const instructions = await askQuestion('Instructions (optional): ');
  
  // Add the meal
  const mealId = addMeal(mealName, instructions || 'No instructions provided');
  console.log(`\n✓ Created meal: ${mealName} (ID: ${mealId})`);
  
  // Add ingredients
  console.log('\nNow add ingredients (press Enter with empty name when done):\n');
  console.log('Valid categories: Pantry, Fridge, Freezer, Misc\n');
  
  while (true) {
    const ingredientName = await askQuestion('  Ingredient name (or press Enter to finish): ');
    
    if (!ingredientName.trim()) {
      break;
    }
    
    const quantity = await askQuestion('  Quantity (e.g., "1 lb", "2 cups"): ');
    
    // Keep asking for category until valid
    let category;
    while (true) {
      category = await askQuestion('  Category (Pantry/Fridge/Freezer/Misc): ');
      
      // Capitalize first letter to be forgiving
      category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      
      if (['Pantry', 'Fridge', 'Freezer', 'Misc'].includes(category)) {
        break;
      }
      
      console.log('  ⚠️  Invalid category. Please use: Pantry, Fridge, Freezer, or Misc');
    }
    
    const shelfLifeInput = await askQuestion('  Shelf life in days (or press Enter to skip): ');
    
    // Convert shelf life input to days (handle "3 months", "2 years", etc.)
    let shelfLifeDays = null;
    if (shelfLifeInput.trim()) {
      const parsed = parseInt(shelfLifeInput);
      if (!isNaN(parsed)) {
        shelfLifeDays = parsed;
      }
    }
    
    try {
      // Get or create the ingredient
      const ingredientId = getOrCreateIngredient(
        ingredientName,
        category,
        shelfLifeDays
      );
      
      // Link ingredient to meal
      addMealIngredient(mealId, ingredientId, quantity);
      
      console.log(`  ✓ Added ${ingredientName}\n`);
    } catch (error) {
      console.log(`  ⚠️  Error adding ingredient: ${error.message}`);
      console.log('  Skipping this ingredient.\n');
    }
  }
  
  console.log(`\n✅ Meal "${mealName}" added successfully!\n`);
  rl.close();
}

main();
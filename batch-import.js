const {
  initializeDatabase,
  addMeal,
  addIngredient,
  addMealIngredient,
  db
} = require('./database.js');

const fs = require('fs');

// Check if ingredient already exists, if not create it
function getOrCreateIngredient(name, category, shelfLifeDays) {
  const existing = db.prepare('SELECT id FROM ingredients WHERE LOWER(name) = LOWER(?)').get(name);
  
  if (existing) {
    return existing.id;
  }
  
  return addIngredient(name, category, shelfLifeDays);
}

// Convert shelf life text to days
function parseShelfLife(shelfText) {
  if (!shelfText || shelfText === 'Indefinite') return null;
  
  shelfText = shelfText.toLowerCase().trim();
  
  // Handle ranges like "1-2 days" - take the upper bound
  const rangeMatch = shelfText.match(/(\d+)-(\d+)/);
  if (rangeMatch) {
    shelfText = rangeMatch[2] + shelfText.replace(/\d+-\d+/, '');
  }
  
  // Extract number
  const num = parseInt(shelfText);
  if (isNaN(num)) return null;
  
  // Convert to days
  if (shelfText.includes('year')) return num * 365;
  if (shelfText.includes('month')) return num * 30;
  if (shelfText.includes('week')) return num * 7;
  if (shelfText.includes('day')) return num;
  
  return num; // assume days if no unit
}

// Map category names to database categories
function mapCategory(category) {
  category = category.toLowerCase().trim();
  
  if (category.includes('meat') || category.includes('dairy')) return 'Fridge';
  if (category.includes('produce')) return 'Fridge';
  if (category.includes('frozen')) return 'Freezer';
  if (category.includes('bread')) return 'Pantry';
  if (category.includes('refrigerated')) return 'Fridge';
  if (category.includes('spice')) return 'Misc';
  if (category.includes('pantry')) return 'Pantry';
  
  return 'Pantry'; // default
}

function parseMealData(text) {
  const meals = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  let currentMeal = null;
  let readingIngredients = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a meal header (starts with number and period)
    if (/^\d+\.\s+/.test(line)) {
      // Save previous meal if exists
      if (currentMeal && currentMeal.ingredients.length > 0) {
        meals.push(currentMeal);
      }
      
      // Start new meal
      const name = line.replace(/^\d+\.\s+/, '');
      currentMeal = {
        name: name,
        instructions: '',
        ingredients: []
      };
      readingIngredients = false;
    }
    // Check for instructions
    else if (line.startsWith('Instructions:')) {
      if (currentMeal) {
        currentMeal.instructions = line.replace('Instructions:', '').trim();
      }
    }
    // Check for ingredients section
    else if (line === 'Ingredients:') {
      readingIngredients = true;
    }
    // Parse ingredient line
    else if (readingIngredients && currentMeal && line.includes('-')) {
      // Format: "Ingredient name - quantity - category - shelf life"
      const parts = line.split('-').map(p => p.trim());
      
      if (parts.length >= 3) {
        currentMeal.ingredients.push({
          name: parts[0],
          quantity: parts[1],
          category: mapCategory(parts[2]),
          shelfLife: parts.length >= 4 ? parseShelfLife(parts[3]) : null
        });
      }
    }
  }
  
  // Don't forget the last meal
  if (currentMeal && currentMeal.ingredients.length > 0) {
    meals.push(currentMeal);
  }
  
  return meals;
}

function importMeals(filePath) {
  initializeDatabase();
  
  console.log('Reading meal data...\n');
  const text = fs.readFileSync(filePath, 'utf-8');
  
  const meals = parseMealData(text);
  
  console.log(`Found ${meals.length} meals to import.\n`);
  
  let imported = 0;
  
  for (const meal of meals) {
    try {
      // Add meal
      const mealId = addMeal(meal.name, meal.instructions);
      
      // Add ingredients
      for (const ing of meal.ingredients) {
        const ingredientId = getOrCreateIngredient(
          ing.name,
          ing.category,
          ing.shelfLife
        );
        
        addMealIngredient(mealId, ingredientId, ing.quantity);
      }
      
      console.log(`✓ Imported: ${meal.name} (${meal.ingredients.length} ingredients)`);
      imported++;
      
    } catch (error) {
      console.log(`✗ Failed to import ${meal.name}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Successfully imported ${imported} of ${meals.length} meals!\n`);
}

// Check if file path was provided
const filePath = process.argv[2];

if (!filePath) {
  console.log('Usage: node batch-import.js <file-path>');
  console.log('Example: node batch-import.js meals.txt');
  process.exit(1);
}

importMeals(filePath);
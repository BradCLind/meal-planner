const { initializeDatabase, db } = require('./database.js');

function resetIds() {
  console.log('\nResetting meal IDs...');
  
  // Temporarily disable foreign keys
  db.pragma('foreign_keys = OFF');
  
  // Clean up any leftover temp tables from previous runs
  try {
    db.exec('DROP TABLE IF EXISTS meals_temp');
    db.exec('DROP TABLE IF EXISTS meal_ingredients_temp');
  } catch (err) {
    // Ignore errors if tables don't exist
  }
  
  // Get all meals ordered by ID
  const meals = db.prepare('SELECT * FROM meals ORDER BY id').all();
  
  if (meals.length === 0) {
    console.log('No meals to reset.');
    db.pragma('foreign_keys = ON');
    return;
  }
  
  // Store the mapping of old ID to new ID
  const idMapping = {};
  
  // Create a temporary table
  db.exec(`
    CREATE TABLE meals_temp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      instructions TEXT,
      brad_liked INTEGER DEFAULT NULL,
      kayla_liked INTEGER DEFAULT NULL,
      skylar_liked INTEGER DEFAULT NULL,
      aubrey_liked INTEGER DEFAULT NULL
    )
  `);
  
  // Copy meals to temp table (will get new sequential IDs)
  for (const meal of meals) {
    const newId = db.prepare(`
      INSERT INTO meals_temp (name, instructions, brad_liked, kayla_liked, skylar_liked, aubrey_liked)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      meal.name,
      meal.instructions,
      meal.brad_liked,
      meal.kayla_liked,
      meal.skylar_liked,
      meal.aubrey_liked
    ).lastInsertRowid;
    
    idMapping[meal.id] = newId;
    console.log(`${meal.id} → ${newId}: ${meal.name}`);
  }
  
  // Create temporary meal_ingredients table
  db.exec(`
    CREATE TABLE meal_ingredients_temp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      quantity TEXT NOT NULL
    )
  `);
  
  // Copy meal_ingredients with updated meal_ids
  const mealIngredients = db.prepare('SELECT * FROM meal_ingredients').all();
  for (const mi of mealIngredients) {
    const newMealId = idMapping[mi.meal_id];
    if (newMealId) {
      db.prepare(`
        INSERT INTO meal_ingredients_temp (meal_id, ingredient_id, quantity)
        VALUES (?, ?, ?)
      `).run(newMealId, mi.ingredient_id, mi.quantity);
    }
  }
  
  // Drop old tables and rename temp tables
  db.exec('DROP TABLE meal_ingredients');
  db.exec('DROP TABLE meals');
  db.exec('ALTER TABLE meals_temp RENAME TO meals');
  db.exec('ALTER TABLE meal_ingredients_temp RENAME TO meal_ingredients');
  
  // Reset the autoincrement counter
  db.exec(`DELETE FROM sqlite_sequence WHERE name='meals'`);
  db.exec(`DELETE FROM sqlite_sequence WHERE name='meal_ingredients'`);
  
  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');
  
  console.log('\n✅ Meal IDs reset to start from 1!\n');
}

// Export the function
module.exports = { resetIds };

// Only run directly if this file is executed (not imported)
if (require.main === module) {
  initializeDatabase();
  resetIds();
}
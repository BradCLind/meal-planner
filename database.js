const Database = require('better-sqlite3');
const db = new Database('meal-planner.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
function initializeDatabase() {
  // Meals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      instructions TEXT,
      brad_liked INTEGER DEFAULT NULL,
      kayla_liked INTEGER DEFAULT NULL,
      skylar_liked INTEGER DEFAULT NULL,
      aubrey_liked INTEGER DEFAULT NULL
    )
  `);

  // Ingredients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Pantry', 'Fridge', 'Freezer', 'Misc')),
      shelf_life_days INTEGER
    )
  `);

  // Meal ingredients junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS meal_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      quantity TEXT NOT NULL,
      FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
    )
  `);

  // Pantry items table (optional for MVP but sets up future features)
  db.exec(`
    CREATE TABLE IF NOT EXISTS pantry_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ingredient_id INTEGER NOT NULL,
      quantity_remaining TEXT,
      date_purchased DATE,
      expiry_date DATE,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized successfully!');
}

// Helper function to add a meal
function addMeal(name, instructions) {
  const stmt = db.prepare('INSERT INTO meals (name, instructions) VALUES (?, ?)');
  const result = stmt.run(name, instructions);
  return result.lastInsertRowid;
}

// Helper function to add an ingredient
function addIngredient(name, category, shelfLifeDays = null) {
  const stmt = db.prepare('INSERT INTO ingredients (name, category, shelf_life_days) VALUES (?, ?, ?)');
  const result = stmt.run(name, category, shelfLifeDays);
  return result.lastInsertRowid;
}

// Helper function to link ingredient to meal
function addMealIngredient(mealId, ingredientId, quantity) {
  const stmt = db.prepare('INSERT INTO meal_ingredients (meal_id, ingredient_id, quantity) VALUES (?, ?, ?)');
  const result = stmt.run(mealId, ingredientId, quantity);
  return result.lastInsertRowid;
}

// Helper function to get all meals
function getAllMeals() {
  const stmt = db.prepare('SELECT * FROM meals');
  return stmt.all();
}

// Helper function to get ingredients for a specific meal
function getMealIngredients(mealId) {
  const stmt = db.prepare(`
    SELECT 
      i.name as ingredient_name,
      mi.quantity,
      i.category
    FROM meal_ingredients mi
    JOIN ingredients i ON mi.ingredient_id = i.id
    WHERE mi.meal_id = ?
  `);
  return stmt.all(mealId);
}

// Helper function to update meal preferences
function updateMealPreference(mealId, person, liked) {
  const column = `${person.toLowerCase()}_liked`;
  const stmt = db.prepare(`UPDATE meals SET ${column} = ? WHERE id = ?`);
  stmt.run(liked ? 1 : 0, mealId);
}

// Export everything
module.exports = {
  db,
  initializeDatabase,
  addMeal,
  addIngredient,
  addMealIngredient,
  getAllMeals,
  getMealIngredients,
  updateMealPreference
};
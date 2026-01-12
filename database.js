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

  // Meal history table (tracks each time a meal is planned/cooked)
  db.exec(`
    CREATE TABLE IF NOT EXISTS meal_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL,
      date_planned TEXT NOT NULL,
      date_cooked TEXT,
      status TEXT NOT NULL CHECK(status IN ('unrated', 'rated')) DEFAULT 'unrated',
      brad_rating INTEGER CHECK(brad_rating BETWEEN 1 AND 5),
      kayla_rating INTEGER CHECK(kayla_rating BETWEEN 1 AND 5),
      skylar_rating INTEGER CHECK(skylar_rating BETWEEN 1 AND 5),
      aubrey_rating INTEGER CHECK(aubrey_rating BETWEEN 1 AND 5),
      comments TEXT,
      FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
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

// Helper function to add a meal to history
function addMealToHistory(mealId, datePlanned) {
  const stmt = db.prepare('INSERT INTO meal_history (meal_id, date_planned, status) VALUES (?, ?, ?)');
  const result = stmt.run(mealId, datePlanned, 'unrated');
  return result.lastInsertRowid;
}

// Helper function to get all unrated meals from history
function getUnratedMeals() {
  const stmt = db.prepare(`
    SELECT 
      mh.id as history_id,
      mh.meal_id,
      m.name as meal_name,
      mh.date_planned,
      mh.date_cooked
    FROM meal_history mh
    JOIN meals m ON mh.meal_id = m.id
    WHERE mh.status = 'unrated'
    ORDER BY mh.date_planned DESC
  `);
  return stmt.all();
}

// Helper function to update meal rating in history
function updateMealRating(historyId, bradRating, kaylaRating, skylarRating, aubreyRating, comments, dateCooked) {
  const stmt = db.prepare(`
    UPDATE meal_history 
    SET brad_rating = ?, 
        kayla_rating = ?, 
        skylar_rating = ?, 
        aubrey_rating = ?,
        comments = ?,
        date_cooked = ?,
        status = 'rated'
    WHERE id = ?
  `);
  stmt.run(bradRating, kaylaRating, skylarRating, aubreyRating, comments, dateCooked, historyId);
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
  updateMealPreference,
  addMealToHistory,
  getUnratedMeals,
  updateMealRating
};
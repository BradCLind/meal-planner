const {
  initializeDatabase,
  db
} = require('./database.js');

function displayRatings() {
  console.log('\n=== Meal Rating History ===\n');
  
  // Get all rated meals from history
  const ratedMeals = db.prepare(`
    SELECT 
      mh.id as history_id,
      m.name as meal_name,
      mh.date_planned,
      mh.date_cooked,
      mh.brad_rating,
      mh.kayla_rating,
      mh.skylar_rating,
      mh.aubrey_rating,
      mh.comments
    FROM meal_history mh
    JOIN meals m ON mh.meal_id = m.id
    WHERE mh.status = 'rated'
    ORDER BY mh.date_cooked DESC, mh.date_planned DESC
  `).all();
  
  if (ratedMeals.length === 0) {
    console.log('No rated meals yet! Use rate-meals.js to rate your meals.\n');
    return;
  }
  
  console.log(`Found ${ratedMeals.length} rated meal(s):\n`);
  
  // Display each rated meal
  ratedMeals.forEach((meal, index) => {
    console.log(`${index + 1}. ${meal.meal_name}`);
    console.log(`   Planned: ${meal.date_planned} | Cooked: ${meal.date_cooked || 'Not specified'}`);
    
    // Show ratings
    const ratings = [];
    if (meal.brad_rating) ratings.push(`Brad: ${meal.brad_rating}`);
    if (meal.kayla_rating) ratings.push(`Kayla: ${meal.kayla_rating}`);
    if (meal.skylar_rating) ratings.push(`Skylar: ${meal.skylar_rating}`);
    if (meal.aubrey_rating) ratings.push(`Aubrey: ${meal.aubrey_rating}`);
    
    if (ratings.length > 0) {
      console.log(`   Ratings: ${ratings.join(', ')}`);
      
      // Calculate and show average
      const allRatings = [
        meal.brad_rating,
        meal.kayla_rating,
        meal.skylar_rating,
        meal.aubrey_rating
      ].filter(r => r !== null);
      
      if (allRatings.length > 0) {
        const avg = (allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1);
        console.log(`   Average: ${avg}/5`);
      }
    }
    
    // Show comments if present
    if (meal.comments) {
      console.log(`   Comments: "${meal.comments}"`);
    }
    
    console.log('');
  });
}

function displayUnratedMeals() {
  console.log('=== Unrated Meals ===\n');
  
  const unratedMeals = db.prepare(`
    SELECT 
      m.name as meal_name,
      mh.date_planned
    FROM meal_history mh
    JOIN meals m ON mh.meal_id = m.id
    WHERE mh.status = 'unrated'
    ORDER BY mh.date_planned DESC
  `).all();
  
  if (unratedMeals.length === 0) {
    console.log('No unrated meals. Great job keeping up!\n');
    return;
  }
  
  console.log(`${unratedMeals.length} meal(s) waiting to be rated:\n`);
  unratedMeals.forEach((meal, index) => {
    console.log(`  ${index + 1}. ${meal.meal_name} (planned ${meal.date_planned})`);
  });
  console.log('\nRun "node rate-meals.js" to rate them.\n');
}

function main() {
  initializeDatabase();
  
  displayRatings();
  displayUnratedMeals();
}

main();
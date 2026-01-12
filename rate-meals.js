const {
  initializeDatabase,
  getUnratedMeals,
  updateMealRating
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

// Helper to get a rating (1-5) with validation
async function getRating(personName) {
  while (true) {
    const input = await askQuestion(`  ${personName}'s rating (1-5, or press Enter to skip): `);
    
    // Allow skipping
    if (input.trim() === '') {
      return null;
    }
    
    const rating = parseInt(input);
    
    // Validate it's a number between 1-5
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      return rating;
    }
    
    console.log('  ⚠️  Please enter a number between 1 and 5, or press Enter to skip.');
  }
}

async function rateMeal(meal) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Rating: ${meal.meal_name}`);
  console.log(`Planned on: ${meal.date_planned}`);
  console.log(`${'='.repeat(50)}\n`);
  
  // Get ratings for each family member
  const bradRating = await getRating('Brad');
  const kaylaRating = await getRating('Kayla');
  const skylarRating = await getRating('Skylar');
  const aubreyRating = await getRating('Aubrey');
  
  // Get optional comments
  const comments = await askQuestion('\n  Any comments about this meal? (optional): ');
  
  // Get the date it was cooked
  const dateCooked = await askQuestion('  When did you cook this? (YYYY-MM-DD, or press Enter for today): ');
  const finalDateCooked = dateCooked.trim() || new Date().toISOString().split('T')[0];
  
  // Save the rating
  updateMealRating(
    meal.history_id,
    bradRating,
    kaylaRating,
    skylarRating,
    aubreyRating,
    comments.trim() || null,
    finalDateCooked
  );
  
  console.log('\n  ✅ Rating saved!\n');
}

async function main() {
  console.log('\n=== Rate Your Meals ===\n');
  
  initializeDatabase();
  
  // Get all unrated meals
  const unratedMeals = getUnratedMeals();
  
  if (unratedMeals.length === 0) {
    console.log('No unrated meals found! Run index.js to plan some meals first.\n');
    rl.close();
    return;
  }
  
  console.log(`Found ${unratedMeals.length} unrated meal(s).\n`);
  
  // Show list of unrated meals
  console.log('Unrated meals:');
  unratedMeals.forEach((meal, index) => {
    console.log(`  ${index + 1}. ${meal.meal_name} (planned ${meal.date_planned})`);
  });
  
  console.log('\nLet\'s rate them!\n');
  
  // Rate each meal
  for (const meal of unratedMeals) {
    await rateMeal(meal);
    
    // Ask if they want to continue (if there are more meals)
    if (unratedMeals.indexOf(meal) < unratedMeals.length - 1) {
      const continueRating = await askQuestion('Continue to next meal? (y/n): ');
      if (continueRating.toLowerCase() !== 'y') {
        console.log('\nStopping here. You can run this script again to rate the remaining meals.\n');
        break;
      }
    }
  }
  
  console.log('🎉 All done! Great job rating your meals.\n');
  rl.close();
}

main();
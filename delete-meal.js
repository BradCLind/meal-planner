const { initializeDatabase, db } = require('./database.js');

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

async function main() {
  initializeDatabase();
  
  // Show all meals
  const meals = db.prepare('SELECT * FROM meals').all();
  
  console.log('\n=== Current Meals ===');
  meals.forEach(meal => {
    console.log(`${meal.id}. ${meal.name}`);
  });
  
  const mealId = await askQuestion('\nEnter meal ID to delete: ');
  
  // Delete the meal (cascade will delete ingredients too)
  db.prepare('DELETE FROM meals WHERE id = ?').run(parseInt(mealId));
  
  console.log(`\n✓ Meal ${mealId} deleted.\n`);
  rl.close();
}

main();
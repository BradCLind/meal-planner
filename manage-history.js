const {
  initializeDatabase,
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

async function main() {
  console.log('\n=== Manage Meal History ===\n');
  
  initializeDatabase();
  
  // Get all unrated meals
  const unratedMeals = db.prepare(`
    SELECT 
      mh.id as history_id,
      m.name as meal_name,
      mh.date_planned
    FROM meal_history mh
    JOIN meals m ON mh.meal_id = m.id
    WHERE mh.status = 'unrated'
    ORDER BY mh.date_planned DESC
  `).all();
  
  if (unratedMeals.length === 0) {
    console.log('No unrated meals in history.\n');
    rl.close();
    return;
  }
  
  console.log('Unrated meals in history:\n');
  unratedMeals.forEach((meal, index) => {
    console.log(`  ${index + 1}. ${meal.meal_name} (planned ${meal.date_planned}) [ID: ${meal.history_id}]`);
  });
  
  console.log('\nOptions:');
  console.log('  - Enter a number to remove that meal from history');
  console.log('  - Enter "clear" to remove ALL unrated meals');
  console.log('  - Press Enter to cancel\n');
  
  const choice = await askQuestion('Your choice: ');
  
  if (choice.trim() === '') {
    console.log('\nCancelled.\n');
    rl.close();
    return;
  }
  
  if (choice.toLowerCase() === 'clear') {
    const confirm = await askQuestion(`\nAre you sure you want to remove ALL ${unratedMeals.length} unrated meals? (yes/no): `);
    
    if (confirm.toLowerCase() === 'yes') {
      db.prepare('DELETE FROM meal_history WHERE status = ?').run('unrated');
      console.log(`\n Removed all ${unratedMeals.length} unrated meals from history.\n`);
    } else {
      console.log('\nCancelled.\n');
    }
    
    rl.close();
    return;
  }
  
  // Try to parse as a number
  const index = parseInt(choice) - 1;
  
  if (isNaN(index) || index < 0 || index >= unratedMeals.length) {
    console.log('\n  Invalid choice.\n');
    rl.close();
    return;
  }
  
  const mealToRemove = unratedMeals[index];
  
  const confirm = await askQuestion(`\nRemove "${mealToRemove.meal_name}" from history? (y/n): `);
  
  if (confirm.toLowerCase() === 'y') {
    db.prepare('DELETE FROM meal_history WHERE id = ?').run(mealToRemove.history_id);
    console.log(`\n Removed "${mealToRemove.meal_name}" from history.\n`);
  } else {
    console.log('\nCancelled.\n');
  }
  
  rl.close();
}

main();
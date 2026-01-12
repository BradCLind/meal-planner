const { initializeDatabase, db } = require('./database.js');

function removeDuplicates() {
  console.log('\nFinding duplicate meals...');
  
  // Find meals with the same name
  const duplicates = db.prepare(`
    SELECT name, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM meals
    GROUP BY name
    HAVING count > 1
  `).all();
  
  if (duplicates.length === 0) {
    console.log('No duplicates found!');
    return 0;
  }
  
  console.log('Found duplicates:\n');
  
  let totalRemoved = 0;
  
  for (const dup of duplicates) {
    const ids = dup.ids.split(',').map(id => parseInt(id));
    const keepId = ids[0];
    const removeIds = ids.slice(1);
    
    console.log(`"${dup.name}" appears ${dup.count} times (IDs: ${dup.ids})`);
    console.log(`  Keeping ID ${keepId}, removing IDs: ${removeIds.join(', ')}`);
    
    for (const removeId of removeIds) {
      db.prepare('DELETE FROM meals WHERE id = ?').run(removeId);
      totalRemoved++;
    }
    
    console.log('');
  }
  
  console.log(`✅ Removed ${totalRemoved} duplicate meals!\n`);
  return totalRemoved;
}

// Export the function
module.exports = { removeDuplicates };

// Only run directly if this file is executed (not imported)
if (require.main === module) {
  initializeDatabase();
  removeDuplicates();
  console.log('Run "node reset-ids.js" to renumber meals starting from 1.\n');
}
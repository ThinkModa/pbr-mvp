const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function testDbConnection() {
  try {
    await client.connect();
    console.log('✅ Database connection successful!');

    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📋 Tables in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Test query to check if we have any data
    try {
      const userCount = await client.query('SELECT COUNT(*) FROM users;');
      console.log(`👥 Users in database: ${userCount.rows[0].count}`);
    } catch (error) {
      console.log('ℹ️  Users table does not exist yet');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

testDbConnection();

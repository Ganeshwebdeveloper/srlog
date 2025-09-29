import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const setupDatabase = async () => {
  // Create a new PostgreSQL client with the DATABASE_URL
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read and execute the SQL setup file
    const sqlContent = fs.readFileSync('setup-supabase.sql', 'utf8');
    
    console.log('Executing schema creation...');
    await client.query(sqlContent);
    console.log('Schema created successfully!');

    console.log('Database setup completed!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

setupDatabase();
const { Client } = require('pg');
const fs = require('fs');

const runSQL = async () => {
    const client = new Client({
        connectionString: 'postgresql://postgres:Rohitpayment@db.oaxvsxaxndpefwazynnr.supabase.co:5432/postgres'
    });

    try {
        await client.connect();
        console.log('Connected to database.');
        
        const sql = fs.readFileSync('supabase_schema.sql', 'utf8');
        console.log('Executing SQL script...');
        
        await client.query(sql);
        console.log('SQL script executed successfully!');
    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        await client.end();
    }
};

runSQL();

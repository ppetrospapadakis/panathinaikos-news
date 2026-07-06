/**
 * Supabase Schema Deployment Script
 * 
 * Dependencies: pg
 * Execution: node backend/deploy.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deploy() {
    const connectionString = process.env.DATABASE_URL || process.argv[2];
    
    if (!connectionString) {
        console.error('[ERROR] Missing connection string.');
        console.log('Please define DATABASE_URL in a .env file, or pass it as an argument:');
        console.log('node backend/deploy.js "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"');
        process.exit(1);
    }

    console.log('[DEPLOY] Connecting to Supabase PostgreSQL database...');
    // Support SSL (required by Supabase)
    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('[DEPLOY] Connected. Reading schema.sql...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('[DEPLOY] Executing SQL script...');
        await client.query(sql);
        console.log('[SUCCESS] Supabase database schema deployed successfully! Table "articles", indexes, and RLS policies are live.');
    } catch (error) {
        console.error('[ERROR] Database deployment failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

deploy();

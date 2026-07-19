const handler = require('../api/sys/social-sync.js');
require('dotenv').config();

async function runTest() {
    console.log('Starting local end-to-end integration test for social-sync...');
    
    // Mock Vercel req/res
    const req = {
        query: {
            secret: process.env.SYS_SECRET
        },
        body: {}
    };

    let statusVal = 200;
    let jsonVal = null;
    let sentVal = null;

    const res = {
        setHeader: (name, value) => {
            console.log(`[res.setHeader] ${name}: ${value}`);
        },
        status: (code) => {
            statusVal = code;
            return res;
        },
        json: (data) => {
            jsonVal = data;
            console.log(`[res.json] Status: ${statusVal}`, JSON.stringify(data, null, 2));
            return res;
        },
        send: (data) => {
            sentVal = data;
            console.log(`[res.send] Status: ${statusVal}`, data);
            return res;
        }
    };

    await handler(req, res);
}

runTest();

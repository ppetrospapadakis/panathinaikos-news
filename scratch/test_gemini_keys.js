/**
 * Diagnostic script: Test all 3 Gemini API keys directly
 * Verifies that each key is active, not quota-limited, and returns results
 */

require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// Accept keys from command line: node test_gemini_keys.js KEY1 KEY2 KEY3
// Or from env vars: GEMINI_API_KEY and GEMINI_API_KEY_2
const cliKeys = process.argv.slice(2).filter(a => a.startsWith('AIza') || a.startsWith('AQ.'));

async function testKey(keyStr, keyLabel) {
    if (!keyStr) {
        console.log(`[${keyLabel}] ❌ MISSING — env var not set`);
        return { label: keyLabel, ok: false, reason: 'missing' };
    }
    const masked = keyStr.slice(0, 8) + '...' + keyStr.slice(-4);
    console.log(`\n[${keyLabel}] Testing key ${masked}...`);
    try {
        const ai = new GoogleGenAI({ apiKey: keyStr });
        const start = Date.now();
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: 'Απάντησε με ακριβώς 3 λέξεις: Τι είναι ο Παναθηναϊκός;',
            config: { temperature: 0.1, maxOutputTokens: 20 }
        });
        const elapsed = Date.now() - start;
        const text = response.text?.trim() || '';
        console.log(`[${keyLabel}] ✅ ACTIVE — Response in ${elapsed}ms: "${text}"`);
        return { label: keyLabel, masked, ok: true, elapsed, text };
    } catch (err) {
        const msg = err.message || '';
        const isQuota = msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('per_day') || msg.toLowerCase().includes('exhausted');
        const isRPM = msg.toLowerCase().includes('rate') || err.status === 429;
        let reason = isQuota ? 'DAILY QUOTA EXHAUSTED' : isRPM ? 'RPM THROTTLED' : `ERROR: ${msg.substring(0, 100)}`;
        console.log(`[${keyLabel}] ❌ FAILED — ${reason}`);
        return { label: keyLabel, masked: keyStr.slice(0,8)+'...'+keyStr.slice(-4), ok: false, reason };
    }
}

async function main() {
    console.log('=== Gemini API Key Diagnostic ===\n');

    const rawKey1 = process.env.GEMINI_API_KEY || '';
    const rawKey2 = process.env.GEMINI_API_KEY_2 || '';

    // Parse all keys — prefer env vars, fall back to CLI args
    let keys = rawKey1.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (rawKey2) keys.push(...rawKey2.split(',').map(k => k.trim()).filter(k => k.length > 0));
    if (keys.length === 0 && cliKeys.length > 0) {
        keys = cliKeys;
        console.log(`(Using ${keys.length} key(s) from command line arguments)\n`);
    }

    if (keys.length === 0) {
        console.log('❌ No API keys found!');
        console.log('Usage: node scratch/test_gemini_keys.js YOUR_KEY_1 YOUR_KEY_2 YOUR_KEY_3');
        process.exit(1);
    }

    console.log(`Found ${keys.length} key(s) to test.\n`);

    const results = [];
    for (let i = 0; i < keys.length; i++) {
        const result = await testKey(keys[i], `Key #${i + 1}`);
        results.push(result);
        // Small pause between tests
        if (i < keys.length - 1) {
            console.log('  Waiting 3s before next key test...');
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    console.log('\n=== SUMMARY ===');
    let allOk = true;
    results.forEach(r => {
        const status = r.ok ? '✅ ACTIVE' : '❌ FAILED';
        console.log(`  ${r.label} (${r.masked || 'N/A'}): ${status}${r.ok ? ` (${r.elapsed}ms)` : ` — ${r.reason}`}`);
        if (!r.ok) allOk = false;
    });

    console.log('\n=== KEY ROTATION CODE CHECK ===');
    const scraperPath = './backend/scraper.js';
    const fs = require('fs');
    const code = fs.readFileSync(scraperPath, 'utf8');
    
    const checks = [
        { label: 'Rate limiter (throttleIfNeeded)', pass: code.includes('throttleIfNeeded()') },
        { label: 'Key rotation (rotateAiClient)', pass: code.includes('rotateAiClient()') },
        { label: 'Daily limit detection (per_day)', pass: code.includes('per_day') },
        { label: 'Retryable failure tracking', pass: code.includes('lastAiFailureWasRetryable') },
        { label: 'GEMINI_API_KEY_2 parsing', pass: code.includes('GEMINI_API_KEY_2') },
        { label: 'RPM limit constant (AI_RPM_LIMIT)', pass: code.includes('AI_RPM_LIMIT') },
        { label: 'keys_status stored in run stats', pass: code.includes('keys_status') },
        { label: 'Per-article sleep/delay', pass: code.includes('sleep(2000)') },
    ];
    
    checks.forEach(c => {
        console.log(`  ${c.pass ? '✅' : '❌'} ${c.label}`);
    });

    const allCodeOk = checks.every(c => c.pass);
    console.log(`\n${allOk && allCodeOk ? '🟢 All checks passed!' : '🔴 Issues detected — see above.'}`);
}

main().catch(e => console.error('Diagnostic failed:', e));

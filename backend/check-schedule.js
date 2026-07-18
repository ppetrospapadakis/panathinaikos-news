const fs = require('fs');

const now = new Date();
const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Athens',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
});

const parts = formatter.formatToParts(now);
const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);

let shouldRun = false;

// 1. 08:00 - 01:00: every 15 minutes (run always)
if (hour >= 8 || hour === 0) {
    shouldRun = true;
}
// 2. 01:00 - 02:00: every 30 minutes (run at :00 and :30)
// 3. 06:00 - 08:00: every 30 minutes (run at :00 and :30)
else if (hour === 1 || hour === 6 || hour === 7) {
    if (minute >= 0 && minute < 15) {
        shouldRun = true;
    } else if (minute >= 30 && minute < 45) {
        shouldRun = true;
    }
}
// 4. 02:00 - 06:00: every 2 hours (run at 02:00 and 04:00)
else if (hour >= 2 && hour < 6) {
    if ((hour === 2 || hour === 4) && (minute >= 0 && minute < 15)) {
        shouldRun = true;
    }
}

console.log(`[Scheduler] Athens Time: ${hour}:${minute} -> shouldRun: ${shouldRun}`);

if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `should_run=${shouldRun}\n`);
} else {
    console.log(`GITHUB_OUTPUT not set. Exiting.`);
}

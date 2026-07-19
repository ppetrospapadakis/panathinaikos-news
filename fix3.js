const fs = require('fs');
let r = fs.readFileSync('roster.html', 'utf8');
r = r.replace('await fetchMoreRosterNews();', 'fetchMoreRosterNews();');
fs.writeFileSync('roster.html', r);

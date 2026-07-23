const fs = require('fs');
const path = require('path');

const fixturesPath = path.join(__dirname, '..', 'fixtures.html');
let content = fs.readFileSync(fixturesPath, 'utf8');

const mapStart = content.indexOf('const html = matches.map(m => {');
const mapEnd = content.indexOf('}).join(\'\');', mapStart);

const cleanMapBlock = `const html = matches.map(m => {
                    const compBadge = getCompetitionLogoHtml(m.competition);
                    const formattedDate = formatMatchDate(m.match_date);
                    const homeScoreDisplay = m.home_score !== null && m.home_score !== undefined ? m.home_score : '-';
                    const awayScoreDisplay = m.away_score !== null && m.away_score !== undefined ? m.away_score : '-';
                    const isCurrent = !!m.is_current;
                    const rowId = isCurrent ? 'current-match-row' : \`match-\${m.id}\`;

                    if (isCurrent) currentMatchElId = rowId;

                    return \`
                    <div id="\${rowId}" class="group relative flex items-center justify-between p-2.5 sm:p-4 rounded-xl border \${isCurrent ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5 scroll-mt-40' : 'border-outline-variant/20 bg-surface-container-low hover:bg-surface-container-high/60'} transition-all duration-300 gap-2 sm:gap-4">
                        \${isCurrent ? '<div class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-primary rounded-r-full"></div>' : ''}
                        
                        <!-- Left: Date & Competition Badge -->
                        <div class="flex flex-col gap-1 min-w-[85px] sm:min-w-[120px] shrink-0">
                            <span class="font-label text-[11px] sm:text-xs font-semibold \${isCurrent ? 'text-primary' : 'text-on-surface-variant'}">\${formattedDate}</span>
                            <div>\${compBadge}</div>
                        </div>

                        <!-- Middle: Teams -->
                        <div class="flex flex-col justify-center gap-1 flex-1 min-w-0 px-1 sm:px-2">
                            \${renderTeamName(m.home_team_name)}
                            \${renderTeamName(m.away_team_name)}
                        </div>

                        <!-- Right: Scores -->
                        <div class="flex flex-col items-center justify-center min-w-[32px] sm:min-w-[44px] shrink-0 gap-1 font-h4 font-bold text-sm sm:text-base md:text-lg border-l border-outline-variant/20 pl-2 sm:pl-4">
                            <span class="\${m.home_score !== null ? 'text-on-surface' : 'text-on-surface-variant/40'}">\${homeScoreDisplay}</span>
                            <span class="\${m.away_score !== null ? 'text-on-surface' : 'text-on-surface-variant/40'}">\${awayScoreDisplay}</span>
                        </div>
                    </div>\`;
                }).join('');`;

content = content.substring(0, mapStart) + cleanMapBlock + content.substring(mapEnd + '}).join(\'\');'.length);

fs.writeFileSync(fixturesPath, content, 'utf8');
console.log('✅ Cleaned up fixtures.html matches.map block.');

const fs = require('fs');
const path = require('path');

const fixturesPath = path.join(__dirname, '..', 'fixtures.html');
let content = fs.readFileSync(fixturesPath, 'utf8');

// 1. Insert Global Window Functions for Filter Dropdown in <head>
const globalDropdownScript = `
    <!-- Global Filter Dropdown Handlers -->
    <script>
        window.toggleFilterDropdown = function(e) {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            const menu = document.getElementById('filter-dropdown-menu');
            const chevron = document.getElementById('filter-chevron');
            if (!menu) return;
            const isHidden = menu.classList.contains('hidden');
            if (isHidden) {
                menu.classList.remove('hidden');
                requestAnimationFrame(() => {
                    menu.classList.remove('opacity-0', 'scale-95');
                    menu.classList.add('opacity-100', 'scale-100');
                });
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            } else {
                window.closeFilterDropdown();
            }
        };

        window.closeFilterDropdown = function() {
            const menu = document.getElementById('filter-dropdown-menu');
            const chevron = document.getElementById('filter-chevron');
            if (!menu || menu.classList.contains('hidden')) return;
            menu.classList.remove('opacity-100', 'scale-100');
            menu.classList.add('opacity-0', 'scale-95');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
            setTimeout(() => {
                menu.classList.add('hidden');
            }, 150);
        };

        window.selectFilter = function(category, label) {
            const labelEl = document.getElementById('filter-selected-label');
            if (labelEl) {
                labelEl.textContent = category === 'all' ? 'Φίλτρα Αγώνων' : \`Φίλτρο: \${label}\`;
            }

            ['all', 'football', 'basketball', 'amateur'].forEach(cat => {
                const check = document.getElementById(\`check-\${cat}\`);
                if (check) {
                    if (cat === category) check.classList.remove('hidden');
                    else check.classList.add('hidden');
                }
            });

            window.closeFilterDropdown();
            if (typeof window.fetchFixtures === 'function') {
                window.fetchFixtures(category);
            }
        };

        document.addEventListener('click', (e) => {
            const wrapper = document.getElementById('filter-dropdown-wrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                window.closeFilterDropdown();
            }
        });
    </script>
`;

// Remove previous dropdown script if present inside body to avoid duplication
const oldDropdownJsRegex = /\/\/ Dropdown Menu Functions[\s\S]*?window\.toggleFilterDropdown = toggleFilterDropdown;/g;
content = content.replace(oldDropdownJsRegex, '');

// Insert globalDropdownScript in <head>
if (!content.includes('window.toggleFilterDropdown = function')) {
    content = content.replace('</head>', `${globalDropdownScript}\n</head>`);
}

// Make sure fetchFixtures is assigned to window.fetchFixtures
content = content.replace(/async function fetchFixtures\(category = 'all'\) \{/g, 'window.fetchFixtures = async function(category = \'all\') {');

fs.writeFileSync(fixturesPath, content, 'utf8');
console.log('✅ Attached toggleFilterDropdown, closeFilterDropdown, selectFilter, and fetchFixtures globally to window in fixtures.html head.');

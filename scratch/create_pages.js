const fs = require('fs');
const path = require('path');

// Read the index.html to extract the boilerplate and the new footer
let indexHtml = fs.readFileSync('index.html', 'utf8');

// Replace footer in index.html and all other html files first
let newFooter = `<footer class="w-full py-16 bg-surface-container-lowest border-t border-outline-variant">
        <div class="max-w-[1440px] mx-auto px-8 flex flex-col items-center gap-8">
            <div class="font-h4 text-h4 text-primary font-bold tracking-tighter">PanathinaikosNews Editorial</div>
            <div class="flex flex-wrap justify-center gap-x-8 gap-y-4">
                <a class="font-caption text-caption text-on-surface-variant hover:text-primary transition-colors" href="/privacy-policy">Privacy Policy</a>
                <a class="font-caption text-caption text-on-surface-variant hover:text-primary transition-colors" href="/terms-of-service">Terms of Service</a>
                <a class="font-caption text-caption text-on-surface-variant hover:text-primary transition-colors" href="/contact">Contact</a>
            </div>
            <p class="font-caption text-caption text-on-surface-variant/40">© 2026 PanathinaikosNews. All rights reserved.</p>
        </div>
    </footer>`;

const footerRegex = /<footer class="w-full py-16 bg-surface-container-lowest border-t border-outline-variant">[\s\S]*?<\/footer>/g;

const htmlFiles = ['index.html', 'article.html', 'login.html', 'roster.html', 'matches.html', 'test.html'];
for (const file of htmlFiles) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(footerRegex, newFooter);
        // also fix old footer versions if any
        const oldFooterRegex2 = /<footer class="w-full py-12 bg-surface-container-lowest border-t border-outline-variant mt-16">[\s\S]*?<\/footer>/g;
        content = content.replace(oldFooterRegex2, newFooter);
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated footer in ${file}`);
    }
}

// Re-read index.html to use as a base
indexHtml = fs.readFileSync('index.html', 'utf8');

// Extract head and top header
const headMatch = indexHtml.match(/<head>[\s\S]*?<\/head>/);
const head = headMatch ? headMatch[0] : '';

const headerMatch = indexHtml.match(/<header class="fixed top-0 left-0 w-full z-50 h-\[80px\] bg-background border-b border-outline-variant">[\s\S]*?<\/header>/);
const header = headerMatch ? headerMatch[0] : '';

const drawerMatch = indexHtml.match(/<aside id="nav-drawer"[\s\S]*?<\/aside>/);
const drawer = drawerMatch ? drawerMatch[0] : '';

const overlayMatch = indexHtml.match(/<div id="drawer-overlay"[\s\S]*?<\/div>/);
const overlay = overlayMatch ? overlayMatch[0] : '';

// Helper to create page
function createPage(filename, title, contentText) {
    const pageHtml = `<!DOCTYPE html>
<html class="dark" lang="el">
${head.replace(/<title>.*?<\/title>/, `<title>${title} - PanathinaikosNews</title>`)}
<body class="bg-background text-on-surface font-body overflow-x-hidden selection:bg-primary/30 selection:text-primary">

<!-- ═══ TOP HEADER ═══ -->
${header.replace('onclick="toggleSearch()" aria-label="Search">', 'aria-hidden="true" style="visibility:hidden">').replace('<span class="material-symbols-outlined text-primary">search</span>', '')}

<!-- ═══ NAVIGATION DRAWER ═══ -->
${drawer}
${overlay}

<!-- ═══ MAIN CONTENT ═══ -->
<main class="mt-[80px] min-h-screen py-20 px-8">
    <div class="max-w-[800px] mx-auto bg-surface-container-low rounded-3xl p-8 md:p-12 border border-outline-variant/30 shadow-2xl">
        <h1 class="font-display-l text-display-l text-primary mb-8">${title}</h1>
        <p class="text-on-surface-variant text-[1.1rem] leading-relaxed">${contentText}</p>
    </div>
</main>

<!-- Footer -->
${newFooter}

<script>
    function toggleDrawer() {
        const d = document.getElementById('nav-drawer');
        const o = document.getElementById('drawer-overlay');
        if (d && o) {
            d.classList.toggle('-translate-x-full');
            o.classList.toggle('opacity-0');
            o.classList.toggle('pointer-events-none');
        }
    }
</script>
</body>
</html>`;
    
    fs.writeFileSync(filename, pageHtml, 'utf8');
    console.log(`Created ${filename}`);
}

// 1. Contact
createPage('contact.html', 'Επικοινωνία', 'Για οποιαδήποτε απορία, προτάσεις συνεργασίας, ή υποδείξεις σχετικά με το περιεχόμενο, μπορείτε να επικοινωνήσετε μαζί μας άμεσα μέσω ηλεκτρονικού ταχυδρομείου στο: <a href="mailto:contact@panathinaikosnews.gr" class="text-primary hover:underline font-bold">contact@panathinaikosnews.gr</a>. Θα χαρούμε να σας ακούσουμε!');

// 2. Privacy Policy
createPage('privacy-policy.html', 'Πολιτική Απορρήτου', 'Στο PanathinaikosNews σεβόμαστε τα προσωπικά σας δεδομένα. Η ιστοσελίδα μας δεν πραγματοποιεί εγγραφές χρηστών και δεν συλλέγει ευαίσθητα προσωπικά δεδομένα. Χρησιμοποιούμε μόνο βασικά, ανώνυμα cookies (όπως Google Analytics) για τη στατιστική ανάλυση της επισκεψιμότητας και την αποθήκευση των προτιμήσεών σας (π.χ. Dark Mode). Η πλοήγησή σας στο site είναι 100% ασφαλής.');

// 3. Terms of Service
createPage('terms-of-service.html', 'Όροι Χρήσης & Αποποίηση Ευθύνης', 'Το PanathinaikosNews λειτουργεί ως news aggregator (συλλέκτης ειδήσεων) με αποκλειστικό σκοπό την άμεση ενημέρωση των φιλάθλων. Κάθε άρθρο που αναπαράγεται περιέχει ρητή αναφορά, ονοματοδοσία και άμεσο σύνδεσμο (link) προς την αρχική πηγή (π.χ. SDNA, Gazzetta, Sport24). Τα πνευματικά δικαιώματα των πρωτότυπων κειμένων ανήκουν αποκλειστικά στις πηγές αυτές. Η χρήση του site συνεπάγεται την αποδοχή των παραπάνω.');

const fs = require('fs');

// Read the index.html to extract the boilerplate and the new footer
let indexHtml = fs.readFileSync('index.html', 'utf8');

// Extract head and top header
const headMatch = indexHtml.match(/<head>[\s\S]*?<\/head>/);
const head = headMatch ? headMatch[0] : '';

const headerMatch = indexHtml.match(/<header class="fixed top-0 left-0 w-full z-50 h-\[80px\] bg-background border-b border-outline-variant">[\s\S]*?<\/header>/);
const header = headerMatch ? headerMatch[0] : '';

const drawerMatch = indexHtml.match(/<aside id="nav-drawer"[\s\S]*?<\/aside>/);
const drawer = drawerMatch ? drawerMatch[0] : '';

const overlayMatch = indexHtml.match(/<div id="drawer-overlay"[\s\S]*?<\/div>/);
const overlay = overlayMatch ? overlayMatch[0] : '';

const footerMatch = indexHtml.match(/<footer class="w-full py-16 bg-surface-container-lowest border-t border-outline-variant">[\s\S]*?<\/footer>/);
const footer = footerMatch ? footerMatch[0] : '';

// Helper to create page with multiple paragraphs
function createPage(filename, title, paragraphs) {
    const contentText = paragraphs.map(p => `<p class="text-on-surface-variant text-[1.1rem] leading-relaxed mb-6 last:mb-0">${p}</p>`).join('\n');
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
        <div class="space-y-4">
            ${contentText}
        </div>
    </div>
</main>

<!-- Footer -->
${footer}

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
createPage('contact.html', 'Επικοινωνία', [
    'Το PanathinaikosNews δημιουργήθηκε με σκοπό να προσφέρει την ταχύτερη και πληρέστερη ενημέρωση στους φίλους του Παναθηναϊκού, συγκεντρώνοντας τα κορυφαία αθλητικά νέα της ομάδας μας. Η γνώμη σας είναι σημαντική για εμάς και μας βοηθά να γινόμαστε συνεχώς καλύτεροι.',
    'Για οποιαδήποτε απορία, προτάσεις συνεργασίας, τεχνικά ζητήματα ή υποδείξεις σχετικά με το περιεχόμενο, μπορείτε να επικοινωνήσετε μαζί μας άμεσα.',
    'Στείλτε μας το μήνυμά σας στο ηλεκτρονικό ταχυδρομείο: <a href="mailto:contact@panathinaikosnews.gr" class="text-primary hover:underline font-bold">contact@panathinaikosnews.gr</a>.',
    'Η ομάδα μας ελέγχει τα μηνύματα καθημερινά και θα φροντίσουμε να σας απαντήσουμε το συντομότερο δυνατό. Θα χαρούμε να σας ακούσουμε!'
]);

// 2. Privacy Policy
createPage('privacy-policy.html', 'Πολιτική Απορρήτου', [
    'Στο PanathinaikosNews δίνουμε προτεραιότητα στην ασφάλεια και τον σεβασμό των προσωπικών σας δεδομένων. Θέλουμε η πλοήγησή σας στην ιστοσελίδα μας να είναι ξέγνοιαστη, διαφανής και απολύτως ασφαλής.',
    'Η ιστοσελίδα μας έχει αμιγώς ενημερωτικό χαρακτήρα. Δεν απαιτεί δημιουργία λογαριασμού, δεν πραγματοποιεί εγγραφές χρηστών, δεν ζητά συνδρομές και δεν συλλέγει σε καμία περίπτωση ευαίσθητα προσωπικά δεδομένα (όπως ονόματα, διευθύνσεις, e-mail ή κωδικούς πρόσβασης).',
    'Χρησιμοποιούμε μόνο βασικά και αυστηρά ανώνυμα cookies. Αυτά περιλαμβάνουν τεχνικά cookies, τα οποία είναι απαραίτητα για την αποθήκευση των προτιμήσεών σας στη συσκευή σας (όπως για παράδειγμα η επιλογή του Dark Mode, ώστε να μην χρειάζεται να την αλλάζετε κάθε φορά).',
    'Επιπρόσθετα, χρησιμοποιούμε cookies τρίτων υπηρεσιών (όπως το Google Analytics) αποκλειστικά και μόνο για τη στατιστική ανάλυση της επισκεψιμότητας, η οποία μας βοηθά να βελτιώνουμε τη δομή και την εμπειρία χρήσης της πλατφόρμας. Τα στατιστικά αυτά δεδομένα παραμένουν αυστηρά ανώνυμα και δεν συνδέονται με μεμονωμένους χρήστες.',
    'Χρησιμοποιώντας το PanathinaikosNews, αποδέχεστε τη χρήση αυτών των βασικών cookies. Εάν έχετε οποιαδήποτε περαιτέρω απορία ή διευκρίνιση σχετικά με τα δεδομένα σας, μην διστάσετε να επικοινωνήσετε μαζί μας.'
]);

// 3. Terms of Service
createPage('terms-of-service.html', 'Όροι Χρήσης & Αποποίηση Ευθύνης', [
    'Το PanathinaikosNews αποτελεί έναν σύγχρονο και αυτοματοποιημένο κόμβο συγκέντρωσης αθλητικών ειδήσεων (news aggregator), σχεδιασμένο με αποκλειστικό σκοπό την άμεση και σφαιρική ενημέρωση των φιλάθλων του Παναθηναϊκού από πολλαπλές αξιόπιστες πηγές σε πραγματικό χρόνο.',
    'Διευκρινίζεται ρητά ότι η ιστοσελίδα μας δεν συντάσσει πρωτογενές δημοσιογραφικό περιεχόμενο και δεν διαθέτει δικό της δημοσιογραφικό τμήμα. Κάθε άρθρο που παρουσιάζεται στην πλατφόρμα μας αποτελεί αναπαραγωγή. Με σεβασμό στη δημοσιογραφική δεοντολογία, κάθε αναδημοσίευση συνοδεύεται πάντοτε από ρητή αναφορά, ονοματοδοσία και ευδιάκριτο, άμεσο σύνδεσμο (link) προς την αρχική πηγή δημοσίευσης.',
    'Όλα τα πνευματικά δικαιώματα (copyright) των πρωτότυπων κειμένων, των φωτογραφιών, των λογότυπων και του οπτικοακουστικού υλικού που εμφανίζονται, ανήκουν αποκλειστικά και μόνο στους εκάστοτε δημιουργούς και στις αντίστοιχες ειδησεογραφικές πηγές. Το PanathinaikosNews δεν διεκδικεί καμία απολύτως κυριότητα ή δικαίωμα επί αυτών.',
    'Η χρήση της ιστοσελίδας, η ανάγνωση των άρθρων και η πλοήγηση στην πλατφόρμα μας είναι εντελώς δωρεάν και υποδηλώνει την πλήρη κατανόηση και ανεπιφύλακτη αποδοχή των παραπάνω όρων.'
]);

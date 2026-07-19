const fs = require('fs');
let art = fs.readFileSync('article.html', 'utf8');

// Title padding
art = art.replace(/<!-- ① TITLE \+ CATEGORY HEADER -->\r?\n\s*<div>/, '<!-- ① TITLE + CATEGORY HEADER -->\n                <div class="px-4 md:px-0">');

// Desktop font size tweak (from text-h1 to text-[2rem] or something smaller like text-4xl)
// User asked: "μικρυνεις ελαχιστα τη γραμματοσειρα των τιτλων... για desktop συσκευες"
// text-display is 3.5rem. We can change md:text-display to md:text-[2.75rem] inline!
// But it's easier to add a CSS rule in the style block we created earlier.
const cssTweak = `
      @media (min-width: 768px) {
          #article-title {
              font-size: 2.75rem !important;
              line-height: 3.25rem !important;
          }
      }`;

art = art.replace('</style>', cssTweak + '\n    </style>');

fs.writeFileSync('article.html', art);

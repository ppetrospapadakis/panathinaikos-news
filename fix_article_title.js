const fs = require('fs');
let art = fs.readFileSync('article.html', 'utf8');

// Revert text-h2 back to text-h1
art = art.replace(/<h1 id="article-title" class="font-display text-h2 md:text-display/, '<h1 id="article-title" class="font-display text-h1 md:text-display');

// Add inline style block to head to forcefully make it smaller on mobile
if (!art.includes('/* mobile title resize */')) {
    const styleBlock = `
    <style>
      /* mobile title resize */
      @media (max-width: 768px) {
          #article-title {
              font-size: 1.75rem !important;
              line-height: 2.25rem !important;
          }
      }
    </style>
</head>`;
    art = art.replace('</head>', styleBlock);
}

fs.writeFileSync('article.html', art);
console.log('Fixed article.html text size');

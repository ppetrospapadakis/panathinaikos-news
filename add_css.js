const fs = require('fs');
let art = fs.readFileSync('article.html', 'utf8');

const cssBlock = `    <style>
      /* Article title responsive sizing */
      @media (max-width: 768px) {
          #article-title {
              font-size: 1.75rem !important;
              line-height: 2.25rem !important;
          }
      }
      @media (min-width: 769px) {
          #article-title {
              font-size: 2.75rem !important;
              line-height: 3.25rem !important;
          }
      }
    </style>
</head>`;

if(!art.includes('/* Article title responsive sizing */')) {
    art = art.replace('</head>', cssBlock);
    fs.writeFileSync('article.html', art);
    console.log('CSS block added!');
}

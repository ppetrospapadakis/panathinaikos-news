const sharp = require('sharp');
const fs = require('fs');

sharp('logo.png')
  .resize(840) // Resize to 840px width, keeping aspect ratio
  .png({ quality: 80, compressionLevel: 9 })
  .toFile('logo_compressed.png')
  .then(info => {
    console.log('Compressed logo size:', info.size);
    // Replace original
    fs.renameSync('logo_compressed.png', 'logo.png');
  })
  .catch(err => {
    console.error('Error:', err);
  });

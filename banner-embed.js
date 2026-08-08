(function() {
    var a = document.createElement('a');
    a.href = 'https://www.panathinaikosnews.gr';
    a.target = '_blank';
    a.rel = 'noopener';
    
    var img = document.createElement('img');
    img.src = 'https://www.panathinaikosnews.gr/images/banner.jpg';
    img.alt = 'Panathinaikos News - Όλα τα νέα του Παναθηναϊκού';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '12px';
    img.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    img.style.display = 'block';
    
    a.appendChild(img);
    var scripts = document.getElementsByTagName('script');
    var currentScript = scripts[scripts.length - 1];
    if (currentScript && currentScript.parentNode) {
        currentScript.parentNode.insertBefore(a, currentScript);
    } else {
        document.body.appendChild(a);
    }
})();

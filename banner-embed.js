(function() {
    var a = document.createElement('a');
    a.href = 'https://www.panathinaikosnews.gr';
    a.target = '_blank';
    a.rel = 'noopener';
    a.style.display = 'inline-block';
    a.style.width = '300px';
    a.style.height = '250px';
    a.style.overflow = 'hidden';
    a.style.borderRadius = '12px';
    a.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    a.style.textDecoration = 'none';
    
    var img = document.createElement('img');
    img.src = 'https://www.panathinaikosnews.gr/images/banner.jpg';
    img.alt = 'Panathinaikos News - Όλα τα νέα του Παναθηναϊκού';
    img.style.width = '300px';
    img.style.height = '250px';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    img.style.border = 'none';
    
    a.appendChild(img);
    var scripts = document.getElementsByTagName('script');
    var currentScript = scripts[scripts.length - 1];
    if (currentScript && currentScript.parentNode) {
        currentScript.parentNode.insertBefore(a, currentScript);
    } else {
        document.body.appendChild(a);
    }
})();

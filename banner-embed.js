(function() {
    // 1. Accurately find the script tag executing this script
    var currentScript = document.currentScript;
    if (!currentScript) {
        var scripts = document.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; i--) {
            if (scripts[i].src && scripts[i].src.indexOf('banner-embed.js') !== -1) {
                currentScript = scripts[i];
                break;
            }
        }
    }

    // 2. Check for explicit target container specified via attribute or URL param
    var targetContainer = null;
    var containerId = null;

    if (currentScript) {
        containerId = currentScript.getAttribute('data-container') || currentScript.getAttribute('data-id');
        if (!containerId && currentScript.src && currentScript.src.indexOf('?') !== -1) {
            var match = currentScript.src.match(/[?&](?:container|id)=([^&]+)/);
            if (match) containerId = decodeURIComponent(match[1]);
        }
    }

    if (containerId) {
        targetContainer = document.getElementById(containerId);
    }

    // Standard container IDs fallback
    if (!targetContainer) {
        targetContainer = document.getElementById('pao-banner') || 
                          document.getElementById('pao-banner-slot') || 
                          document.getElementById('panathinaikos-banner') ||
                          document.getElementById('panathinaikos-banner-container');
    }

    // 3. Create Banner container element
    var a = document.createElement('a');
    a.href = 'https://www.panathinaikosnews.gr';
    a.target = '_blank';
    a.rel = 'noopener';
    a.style.display = 'block';
    a.style.width = '300px';
    a.style.height = '250px';
    a.style.margin = '0 auto';
    a.style.overflow = 'hidden';
    a.style.borderRadius = '12px';
    a.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    a.style.textDecoration = 'none';
    a.style.position = 'relative';
    a.style.zIndex = '99999';

    var img = document.createElement('img');
    img.src = 'https://www.panathinaikosnews.gr/images/banner.jpg';
    img.alt = 'Panathinaikos News - Όλα τα νέα του Παναθηναϊκού';
    img.style.width = '300px';
    img.style.height = '250px';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    img.style.border = 'none';

    a.appendChild(img);

    // 4. Insert banner directly into target container or at script location
    if (targetContainer) {
        targetContainer.appendChild(a);
    } else if (currentScript && currentScript.parentNode && currentScript.parentNode !== document.body && currentScript.parentNode !== document.documentElement) {
        currentScript.parentNode.insertBefore(a, currentScript);
    } else if (currentScript && currentScript.parentNode) {
        currentScript.parentNode.insertBefore(a, currentScript);
    } else {
        document.body.appendChild(a);
    }
})();

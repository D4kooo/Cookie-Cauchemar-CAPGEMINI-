let cookies = 0;
let multiplier = 1;
let multiplierPrice = 10;
let nb_scroll_auto_click = 0;

const cookieElement = document.getElementById('cookie');
const cookieCountElement = document.getElementById('cookieCount');
const multiplierElement = document.getElementById('multiplierValue');
const multiplierPriceElement = document.getElementById('multiplierPrice');
const buyMultiplierButton = document.getElementById('buyMultiplier');

cookieElement.addEventListener('click', () => {
    if (Math.random() < 0.5) {  // Changé de 0.1 à 0.5 pour 50% de chance
        const popup = document.getElementById('customPopup');
        const overlay = document.getElementById('overlay');
        popup.style.display = 'block';
        overlay.style.display = 'block';
        
        document.getElementById('popupYes').onclick = () => {
            cookies += multiplier;
            updateDisplay();
            popup.style.display = 'none';
            overlay.style.display = 'none';
        };
        
        document.getElementById('popupNo').onclick = () => {
            popup.style.display = 'none';
            overlay.style.display = 'none';
        };
    } else {
        cookies += multiplier;
        updateDisplay();
    }
});

cookieElement.addEventListener("wheel", () => {
    if (nb_scroll_auto_click >= 3) {
        event.preventDefault();
        cookies += multiplier;
        nb_scroll_auto_click = 0;
        updateDisplay();
    } else {
        nb_scroll_auto_click += 1;
    }
});

buyMultiplierButton.addEventListener('click', () => {
    if (cookies >= multiplierPrice) {
        cookies -= multiplierPrice;
        multiplier++;
        multiplierPrice = Math.floor(multiplierPrice * 1.5);
        updateDisplay();
        moveShopButton(); // Ajout de l'appel pour déplacer le bouton
    }
});

function updateDisplay() {
    cookieCountElement.textContent = Math.floor(cookies);
    multiplierElement.textContent = multiplier;
    multiplierPriceElement.textContent = multiplierPrice;
}

function moveShopButton() {
    const shop = document.querySelector('.shop');
    // Limiter à 60% de la largeur et hauteur de l'écran
    const maxX = Math.min(window.innerWidth * 0.6, window.innerWidth - shop.offsetWidth);
    const maxY = Math.min(window.innerHeight * 0.6, window.innerHeight - shop.offsetHeight);
    
    // Ajouter un décalage de 20% depuis les bords
    const minX = window.innerWidth * 0.2;
    const minY = window.innerHeight * 0.2;
    
    const randomX = Math.floor(minX + (Math.random() * (maxX - minX)));
    const randomY = Math.floor(minY + (Math.random() * (maxY - minY)));
    
    shop.style.left = randomX + 'px';
    shop.style.top = randomY + 'px';
}

const flashlight = document.getElementById('flashlight');

document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    flashlight.style.setProperty('--x', x + '%');
    flashlight.style.setProperty('--y', y + '%');
});
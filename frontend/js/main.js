let cookies = 0;
let multiplier = 1;
let multiplierPrice = 10;
let scrollPrice = 50;
let nb_scroll_auto_click = 0;
let scrollEnabled = false;
const wheelPrice = 500;
let wheelEnabled = false;

const cookieElement = document.getElementById('cookie');
const cookieCountElement = document.getElementById('cookieCount');
const multiplierElement = document.getElementById('multiplierValue');
const multiplierPriceElement = document.getElementById('multiplierPrice');
const buyMultiplierButton = document.getElementById('buyMultiplier');

function movePopup() {
    const popup = document.getElementById('customPopup');
    const maxX = Math.min(window.innerWidth * 0.6, window.innerWidth - popup.offsetWidth);
    const maxY = Math.min(window.innerHeight * 0.6, window.innerHeight - popup.offsetHeight);
    
    const minX = window.innerWidth * 0.2;
    const minY = window.innerHeight * 0.2;
    
    const randomX = Math.floor(minX + (Math.random() * (maxX - minX)));
    const randomY = Math.floor(minY + (Math.random() * (maxY - minY)));
    
    popup.style.left = randomX + 'px';
    popup.style.top = randomY + 'px';
    popup.style.transform = 'none'; // Supprimer le transform initial
}

cookieElement.addEventListener('click', () => {
    if (Math.random() < 0.5) {  // Changé de 0.1 à 0.5 pour 50% de chance
        const popup = document.getElementById('customPopup');
        const overlay = document.getElementById('overlay');
        popup.style.display = 'block';
        overlay.style.display = 'block';
        movePopup(); // Positionner le popup aléatoirement
        
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

cookieElement.addEventListener("wheel", (event) => {
    if (!scrollEnabled) return;
    
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

const buyScrollButton = document.getElementById('buyScroll');
const buyWheelButton = document.getElementById('buyWheel');
const wheelContainer = document.querySelector('.wheel-container');

buyScrollButton.addEventListener('mouseover', () => {
    // 70% de chance que le bouton fuie
    if (!scrollEnabled && Math.random() < 0.7) {
        const maxX = window.innerWidth - buyScrollButton.offsetWidth;
        const maxY = window.innerHeight - buyScrollButton.offsetHeight;
        
        const randomX = Math.floor(Math.random() * maxX);
        const randomY = Math.floor(Math.random() * maxY);
        
        buyScrollButton.style.position = 'fixed';
        buyScrollButton.style.left = randomX + 'px';
        buyScrollButton.style.top = randomY + 'px';
        buyScrollButton.style.transition = 'none'; // Désactive l'animation pour un déplacement instantané
    }
});

buyScrollButton.addEventListener('click', () => {
    if (cookies >= scrollPrice && !scrollEnabled) {
        cookies -= scrollPrice;
        scrollEnabled = true;
        updateDisplay();
        buyScrollButton.style.display = 'none';
        // Réinitialiser la position du bouton
        buyScrollButton.style.position = '';
        buyScrollButton.style.left = '';
        buyScrollButton.style.top = '';
    }
});

buyWheelButton.addEventListener('click', () => {
    if (!wheelEnabled && cookies >= wheelPrice) {
        cookies -= wheelPrice;
        wheelEnabled = true;
        updateDisplay();
        buyWheelButton.style.display = 'none';
        wheel.style.display = 'block';
        spinButton.style.display = 'block';
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

const wheel = document.getElementById('wheel');
const ctx = wheel.getContext('2d');
const spinButton = document.getElementById('spinWheel');
const wheelCost = 1;

const rewards = [
    { text: "2x Cookies", color: "#FF0000", action: () => cookies *= 2 },
    { text: "+5 Multi", color: "#00FF00", action: () => multiplier += 5 },
    { text: "Perdu!", color: "#0000FF", action: () => {} },
    { text: "+100 Cookies", color: "#FFFF00", action: () => cookies += 100 },
    { text: "+1 Multi", color: "#FF00FF", action: () => multiplier += 1 },
    { text: "-50 Cookies", color: "#00FFFF", action: () => cookies = Math.max(0, cookies - 50) },
];

function drawWheel() {
    const segments = rewards.length;
    const arc = Math.PI * 2 / segments;
    
    for(let i = 0; i < segments; i++) {
        ctx.beginPath();
        ctx.fillStyle = rewards[i].color;
        ctx.moveTo(150, 150);
        ctx.arc(150, 150, 140, i * arc, (i + 1) * arc);
        ctx.lineTo(150, 150);
        ctx.fill();
        
        ctx.save();
        ctx.translate(150, 150);
        ctx.rotate(i * arc + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Arial";
        ctx.fillText(rewards[i].text, 130, 0);
        ctx.restore();
    }
}

let isSpinning = false;

spinButton.addEventListener('click', () => {
    if (!wheelEnabled || isSpinning || cookies < wheelCost) return;
    
    cookies -= wheelCost;
    isSpinning = true;
    const spins = 5 + Math.random() * 5;
    const duration = 5000;
    const startTime = Date.now();
    let currentRotation = 0;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            currentRotation = (spins * Math.PI * 2) * (1 - Math.pow(1 - progress, 3));
            ctx.save();
            ctx.clearRect(0, 0, 300, 300);
            ctx.translate(150, 150);
            ctx.rotate(currentRotation);
            ctx.translate(-150, -150);
            drawWheel();
            ctx.restore();
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            const segment = Math.floor(((currentRotation % (Math.PI * 2)) / (Math.PI * 2)) * rewards.length);
            rewards[segment].action();
            showRewardNotification(rewards[segment].text);
            updateDisplay();
        }
    }
    
    animate();
});

function showRewardNotification(reward) {
    const notification = document.createElement('div');
    notification.className = 'reward-notification';
    notification.textContent = `Vous avez gagné : ${reward}`;
    document.body.appendChild(notification);
    
    // Supprime la notification après 3 secondes
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

drawWheel();
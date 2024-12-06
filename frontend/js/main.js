// ============================================================
// Variables globales et état du jeu
// ============================================================
let cookies = parseInt(localStorage.getItem('cookies')) || 0;
let mic_multiplier = parseInt(localStorage.getItem('mic_multiplier')) || 1;
let multiplier_upgrade = parseInt(localStorage.getItem('multiplier_upgrade')) || 1;
let multiplier = multiplier_upgrade * mic_multiplier;
let multiplierPrice = parseInt(localStorage.getItem('multiplierPrice')) || 10;
let scrollEnabled = localStorage.getItem('scrollEnabled') === 'true';
let nb_scroll_auto_click = 0;

const scrollPrice = 50;
const wheelPrice = 500;

// Supprimer toutes les variables des producteurs

// Eléments DOM
const cookieElement = document.getElementById('cookie');
const cookieCountElement = document.getElementById('cookieCount');
const multiplierElement = document.getElementById('multiplierValue');
const multiplierPriceElement = document.getElementById('multiplierPrice');
const buyMultiplierButton = document.getElementById('buyMultiplier');
const buyScrollButton = document.getElementById('buyScroll');
const spinButton = document.getElementById('spinWheel');
const wheel = document.getElementById('wheel');
const ctx = wheel.getContext('2d');

const overlay = document.getElementById('overlay');
const customPopup = document.getElementById('customPopup');
const popupYes = document.getElementById('popupYes');
const popupNo = document.getElementById('popupNo');
const shop = document.querySelector('.shop');
const flashlight = document.getElementById('flashlight');

// Supprimer les éléments DOM des producteurs

// Ajouter variable globale pour suivre l'état d'inversion
let isMouseInverted = false;

// Ajouter après les variables globales
let isInterfaceChaos = false;
let chaosInterval;

// Récompenses de la roue
const rewards = [
    { text: "2x Cookies", color: "#FF0000", action: () => { cookies *= 2; } },
    { text: "+5 Multi", color: "#00FF00", action: () => { multiplier += 5; } },
    { text: "Axes inversés!", color: "#0000FF", action: () => { 
        isMouseInverted = !isMouseInverted; 
        setTimeout(() => { isMouseInverted = false; }, 10000); // Durée de 10 secondes
    }},
    { text: "Chaos UI!", color: "#FF00FF", action: () => {
        startInterfaceChaos();
        setTimeout(() => stopInterfaceChaos(), 15000); // Dure 15 secondes
    }},
    { text: "+1 Multi", color: "#FF00FF", action: () => { multiplier += 1; } },
    { text: "-50 Cookies", color: "#00FFFF", action: () => { cookies = Math.max(0, cookies - 50); } },
];

// ============================================================
// Fonctions utilitaires
// ============================================================

// Met à jour l'affichage du score, multipliateurs, etc.
function updateDisplay() {
    cookieCountElement.textContent = Math.floor(cookies);
    multiplierElement.textContent = multiplier;
    multiplierPriceElement.textContent = multiplierPrice;

    // Couleur du bouton spin selon le score
    spinButton.style.backgroundColor = (cookies > wheelPrice) ? "#4CAF50" : "#8B0000";
    // Couleur du bouton multiplicateur selon le score
    buyMultiplierButton.style.backgroundColor = (cookies > multiplierPrice) ? "#4CAF50" : "#8B0000";

    saveGame();
}

// Sauvegarde dans localStorage
function saveGame() {
    localStorage.setItem('cookies', Math.floor(cookies));
    localStorage.setItem('multiplier_upgrade', multiplier_upgrade);
    localStorage.setItem('mic_multiplier', mic_multiplier);
    localStorage.setItem('multiplierPrice', multiplierPrice);
    localStorage.setItem('scrollEnabled', scrollEnabled);
}

// Déplace la boutique aléatoirement sur l'écran
function moveShop() {
    const maxX = Math.min(window.innerWidth * 0.6, window.innerWidth - shop.offsetWidth);
    const maxY = Math.min(window.innerHeight * 0.6, window.innerHeight - shop.offsetHeight);

    const minX = window.innerWidth * 0.2;
    const minY = window.innerHeight * 0.2;

    const randomX = Math.floor(minX + (Math.random() * (maxX - minX)));
    const randomY = Math.floor(minY + (Math.random() * (maxY - minY)));

    shop.style.left = randomX + 'px';
    shop.style.top = randomY + 'px';
}

// Déplace le popup de confirmation du clic cookie
function movePopupRandom() {
    const maxX = Math.min(window.innerWidth * 0.6, window.innerWidth - customPopup.offsetWidth);
    const maxY = Math.min(window.innerHeight * 0.6, window.innerHeight - customPopup.offsetHeight);

    const minX = window.innerWidth * 0.2;
    const minY = window.innerHeight * 0.2;

    const randomX = Math.floor(minX + (Math.random() * (maxX - minX)));
    const randomY = Math.floor(minY + (Math.random() * (maxY - minY)));

    customPopup.style.left = randomX + 'px';
    customPopup.style.top = randomY + 'px';
}

// Affiche une notification de récompense
function showRewardNotification(rewardText) {
    const notification = document.createElement('div');
    notification.className = 'reward-notification';
    notification.textContent = `Vous avez gagné : ${rewardText}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Dessine la roue
function drawWheel() {
    const segments = rewards.length;
    const arc = Math.PI * 2 / segments;

    for (let i = 0; i < segments; i++) {
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

// Analyse du volume micro pour ajuster le multiplicateur
async function mesurerHauteurMicro() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function analyserVolume() {
            analyser.getByteTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                const amplitude = (dataArray[i] - 128) / 128;
                sum += amplitude * amplitude;
            }
            const rms = Math.sqrt(sum / bufferLength);
            const volume = Math.round(rms * 100);
            mic_multiplier = Math.round(volume / 5) + 1;
            multiplier = multiplier_upgrade * mic_multiplier;
            updateDisplay();
        }

        setInterval(analyserVolume, 500);
    } catch (err) {
        console.error("Erreur lors de l'accès au micro : ", err);
    }
}

// ============================================================
// Evénements
// ============================================================

// Clic sur le cookie
cookieElement.addEventListener('click', () => {
    // 50% de chance d'afficher le popup
    if (Math.random() < 0.5) {
        customPopup.style.display = 'block';
        overlay.style.display = 'block';
        movePopupRandom();
    } else {
        cookies += multiplier;
        updateDisplay();
    }
});

// Réponse au popup
popupYes.addEventListener('click', () => {
    cookies += multiplier;
    updateDisplay();
    customPopup.style.display = 'none';
    overlay.style.display = 'none';
});

popupNo.addEventListener('click', () => {
    customPopup.style.display = 'none';
    overlay.style.display = 'none';
});

// Scroll sur le cookie (si débloqué)
cookieElement.addEventListener("wheel", (event) => {
    if (!scrollEnabled) return;
    // Au bout de 3 scrolls, un clic est simulé
    if (nb_scroll_auto_click >= 3) {
        event.preventDefault();
        cookies += multiplier;
        nb_scroll_auto_click = 0;
        updateDisplay();
    } else {
        nb_scroll_auto_click++;
    }
});

// Achat du multiplicateur
buyMultiplierButton.addEventListener('click', () => {
    if (cookies >= multiplierPrice) {
        cookies -= multiplierPrice;
        multiplier_upgrade++;
        multiplier = multiplier_upgrade * mic_multiplier;
        multiplierPrice = Math.floor(multiplierPrice * 1.5);
        updateDisplay();
        moveShop();
        
        // Déplacer le bouton aléatoirement
        const shopItem = buyMultiplierButton.closest('.shop-item');
        shopItem.style.position = 'fixed';
        const maxX = window.innerWidth - shopItem.offsetWidth;
        const maxY = window.innerHeight - shopItem.offsetHeight;
        shopItem.style.left = Math.floor(Math.random() * maxX) + 'px';
        shopItem.style.top = Math.floor(Math.random() * maxY) + 'px';
    }
});

// Ajout du comportement fuyant pour le bouton de la roue avec probabilité
spinButton.addEventListener('mouseover', () => {
    if (Math.random() < 0.7) { // 70% de chance de fuir
        const shopItem = spinButton.closest('.shop-item');
        moveToSafePosition(shopItem);
        
        if (!moveInterval) {
            moveInterval = setInterval(() => {
                moveToSafePosition(shopItem);
            }, 800);
        }
    }
});

// Fonction pour déplacer le bouton à une position sûre
function moveToSafePosition(element) {
    let newPos;
    let attempts = 0;
    const maxAttempts = 50;

    do {
        newPos = {
            x: Math.floor(Math.random() * (window.innerWidth - element.offsetWidth)),
            y: Math.floor(Math.random() * (window.innerHeight - element.offsetHeight))
        };
        attempts++;
        // On continue tant qu'on est proche du cookie ET qu'on n'a pas dépassé le nombre max de tentatives
    } while (isNearCookie(newPos.x + element.offsetWidth/2, newPos.y + element.offsetHeight/2) && attempts < maxAttempts);

    // Si on n'a pas trouvé de position valide, on force une position éloignée
    if (attempts >= maxAttempts) {
        const cookie = document.getElementById('cookie');
        const cookieRect = cookie.getBoundingClientRect();
        newPos.x = cookieRect.left < window.innerWidth/2 ? 
                   window.innerWidth - element.offsetWidth - 50 : 
                   50;
        newPos.y = cookieRect.top < window.innerHeight/2 ? 
                   window.innerHeight - element.offsetHeight - 50 : 
                   50;
    }

    element.style.transition = 'all 0.5s ease-out';
    element.style.position = 'fixed';
    element.style.left = newPos.x + 'px';
    element.style.top = newPos.y + 'px';
}

// Modification de l'événement mouseenter pour ne pas démarrer automatiquement le mouvement
spinButton.addEventListener('mouseenter', () => {
    // Le mouvement continu est maintenant géré dans le mouseover
});

spinButton.addEventListener('mouseleave', () => {
    clearInterval(moveInterval);
    moveInterval = null;
});

// Fonction pour vérifier si une position est trop proche du cookie
function isNearCookie(x, y) {
    const cookie = document.getElementById('cookie');
    const cookieRect = cookie.getBoundingClientRect();
    const safeDistance = 200; // Augmenté pour plus de sécurité

    const centerX = cookieRect.left + cookieRect.width / 2;
    const centerY = cookieRect.top + cookieRect.height / 2;

    const distance = Math.sqrt(
        Math.pow(x - centerX, 2) + 
        Math.pow(y - centerY, 2)
    );

    return distance < safeDistance;
}

// Fonction pour obtenir une position valide pour le bouton fuyant
function getValidButtonPosition(buttonWidth, buttonHeight) {
    let x, y;
    do {
        x = Math.floor(Math.random() * (window.innerWidth - buttonWidth));
        y = Math.floor(Math.random() * (window.innerHeight - buttonHeight));
    } while (isNearCookie(x, y));
    return { x, y };
}

// Bouton scroll (fuite aléatoire)
buyScrollButton.addEventListener('mouseover', () => {
    if (!scrollEnabled && Math.random() < 0.7) {
        const maxX = window.innerWidth - buyScrollButton.offsetWidth;
        const maxY = window.innerHeight - buyScrollButton.offsetHeight;
        buyScrollButton.style.position = 'fixed';
        buyScrollButton.style.left = Math.floor(Math.random() * maxX) + 'px';
        buyScrollButton.style.top = Math.floor(Math.random() * maxY) + 'px';
        buyScrollButton.style.transition = 'none';
    }
});

// Achat scroll
buyScrollButton.addEventListener('click', () => {
    if (cookies >= scrollPrice && !scrollEnabled) {
        cookies -= scrollPrice;
        scrollEnabled = true;
        updateDisplay();
        buyScrollButton.style.display = 'none';
        // Restaure la position
        buyScrollButton.style.position = '';
        buyScrollButton.style.left = '';
        buyScrollButton.style.top = '';
    }
});

// Spin de la roue
let isSpinning = false;
spinButton.addEventListener('click', () => {
    if (isSpinning || cookies < wheelPrice) return;

    cookies -= wheelPrice;
    isSpinning = true;
    wheel.style.display = 'block';
    overlay.style.display = 'block'; // Ajouter un overlay pendant l'animation
    
    const spins = 5 + Math.random() * 5;
    const duration = 5000;
    const startTime = Date.now();
    let currentRotation = 0;

    function animateWheel() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;

        if (progress < 1) {
            // Courbe d’accélération/décélération
            currentRotation = (spins * Math.PI * 2) * (1 - Math.pow(1 - progress, 3));
            ctx.save();
            ctx.clearRect(0, 0, 300, 300);
            ctx.translate(150, 150);
            ctx.rotate(currentRotation);
            ctx.translate(-150, -150);
            drawWheel();
            ctx.restore();
            requestAnimationFrame(animateWheel);
        } else {
            isSpinning = false;
            const segment = Math.floor(((currentRotation % (Math.PI * 2)) / (Math.PI * 2)) * rewards.length);
            rewards[segment].action();
            showRewardNotification(rewards[segment].text);
            wheel.style.display = 'none';
            overlay.style.display = 'none'; // Cacher l'overlay à la fin
            updateDisplay();
        }
    }
    animateWheel();
});

// Suivi de la souris pour l'effet lampe de poche
document.addEventListener('mousemove', (e) => {
    let x, y;
    if (isMouseInverted) {
        x = 100 - ((e.clientX / window.innerWidth) * 100);
        y = 100 - ((e.clientY / window.innerHeight) * 100);
    } else {
        x = (e.clientX / window.innerWidth) * 100;
        y = (e.clientY / window.innerHeight) * 100;
    }
    flashlight.style.setProperty('--x', x + '%');
    flashlight.style.setProperty('--y', y + '%');
});

// Supprimer la production automatique et les événements d'achat des producteurs

// Ajouter ces nouvelles fonctions
function startInterfaceChaos() {
    isInterfaceChaos = true;
    const elements = document.querySelectorAll('button, .shop-item, #score, #multiplier');
    
    chaosInterval = setInterval(() => {
        elements.forEach(el => {
            // Random transforms
            const rotate = Math.random() * 20 - 10; // -10 to 10 degrees
            const translateX = Math.random() * 40 - 20; // -20 to 20px
            const translateY = Math.random() * 40 - 20; // -20 to 20px
            const scale = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
            
            el.style.transform = `rotate(${rotate}deg) translate(${translateX}px, ${translateY}px) scale(${scale})`;
            
            // Random opacity
            if (Math.random() < 0.3) {
                el.style.opacity = 0.3 + Math.random() * 0.7;
            }
            
            // Random color changes
            if (Math.random() < 0.2) {
                el.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
            }
        });
    }, 500);
}

function stopInterfaceChaos() {
    isInterfaceChaos = false;
    clearInterval(chaosInterval);
    
    // Reset all elements
    const elements = document.querySelectorAll('button, .shop-item, #score, #multiplier');
    elements.forEach(el => {
        el.style.transform = '';
        el.style.opacity = '';
        el.style.filter = '';
    });
}

// ============================================================
// Initialisation
// ============================================================
drawWheel();
mesurerHauteurMicro();
if (scrollEnabled) buyScrollButton.style.display = 'none';
updateDisplay();

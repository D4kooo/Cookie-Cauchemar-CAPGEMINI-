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
const flashlight = document.getElementById('flashlight');

// Supprimer les éléments DOM des producteurs

// Ajouter variable globale pour suivre l'état d'inversion
let isMouseInverted = false;

// Ajouter après les variables globales
let isInterfaceChaos = false;
let chaosInterval;

// Ajouter aux variables globales
let isCursorChaos = false;
let cursorInterval;
let fakeCursor = null;

// Ajouter après les variables globales
let audioContext;
let oscillator;
let gainNode;

// Ajouter après les variables globales
let permanentChaosInterval;
const CHAOS_INTENSITY_LEVELS = [
    { cookies: 0, intensity: 0.2 },
    { cookies: 100, intensity: 0.4 },
    { cookies: 500, intensity: 0.6 },
    { cookies: 1000, intensity: 0.8 },
    { cookies: 2000, intensity: 1.0 }
];

// Ajouter aux variables globales
let isAdminPanelOpen = false;

// Récompenses de la roue
const rewards = [
    { text: "2x Cookies", color: "#FF0000", action: () => { cookies *= 2; } },
    { text: "+5 Multi", color: "#00FF00", action: () => { multiplier += 5; } },
    { text: "Curseur fou!", color: "#800080", action: () => { 
        startCursorChaos();
        setTimeout(() => stopCursorChaos(), 12000); // Dure 12 secondes
    }},
    { text: "Chaos UI!", color: "#FF00FF", action: () => {
        startInterfaceChaos();
        setTimeout(() => stopInterfaceChaos(), 15000); // Dure 15 secondes
    }},
    { text: "Axes inversés!", color: "#0000FF", action: () => { 
        isMouseInverted = !isMouseInverted; 
        setTimeout(() => { isMouseInverted = false; }, 10000); // Durée de 10 secondes
    }},
    { text: "+1 Multi", color: "#FF00FF", action: () => { multiplier += 1; } },
    { text: "Cookies /2", color: "#00FFFF", action: () => { cookies = cookies/2; } },
    {   text: "Bruits inconfortables", color: "#FFFF00", action: ()=>{
        startDiscomfortNoise();
        setTimeout(() => stopDiscomfortNoise(), 12000);
    }}
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
    updateChaosIntensity();
}

// Sauvegarde dans localStorage
function saveGame() {
    localStorage.setItem('cookies', Math.floor(cookies));
    localStorage.setItem('multiplier_upgrade', multiplier_upgrade);
    localStorage.setItem('mic_multiplier', mic_multiplier);
    localStorage.setItem('multiplierPrice', multiplierPrice);
    localStorage.setItem('scrollEnabled', scrollEnabled);
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
            mic_multiplier = Math.round(volume / 5);
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
            // Rotations et translations beaucoup plus importantes
            const rotate = Math.random() * 360 - 180;      // -180 à 180 degrés (rotation complète)
            const translateX = Math.random() * window.innerWidth - (window.innerWidth/2);  // Translation sur toute la largeur
            const translateY = Math.random() * window.innerHeight - (window.innerHeight/2); // Translation sur toute la hauteur
            const scale = 2 + Math.random() * 3;           // 2x à 5x la taille normale
            
            el.style.transform = `rotate(${rotate}deg) translate(${translateX}px, ${translateY}px) scale(${scale})`;
            el.style.transition = 'transform 0.15s ease-out'; // Animation plus rapide
            
            // Opacité plus variée
            if (Math.random() < 0.4) {
                el.style.opacity = 0.4 + Math.random() * 0.6;
            }
            
            // Plus de variations de couleur
            if (Math.random() < 0.3) {
                el.style.filter = `hue-rotate(${Math.random() * 360}deg) saturate(${100 + Math.random() * 200}%)`;
            }
        });
    }, 150); // Encore plus rapide (150ms au lieu de 250ms)
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

function startCursorChaos() {
    isCursorChaos = true;
    document.body.style.cursor = 'none'; // Cache le vrai curseur
    
    // Créer le faux curseur
    fakeCursor = document.createElement('div');
    fakeCursor.className = 'fake-cursor';
    document.body.appendChild(fakeCursor);
    
    let lastX = 0, lastY = 0;
    
    cursorInterval = setInterval(() => {
        if (lastX && lastY) {
            // Ajouter un tremblement aléatoire
            const shake = {
                x: Math.random() * 20 - 10,
                y: Math.random() * 20 - 10
            };
            
            fakeCursor.style.left = (lastX + shake.x) + 'px';
            fakeCursor.style.top = (lastY + shake.y) + 'px';
        }
    }, 50);
    
    // Suivre la position réelle de la souris
    document.addEventListener('mousemove', updateFakeCursor);
}

function updateFakeCursor(e) {
    if (!isCursorChaos) return;
    lastX = e.clientX;
    lastY = e.clientY;
}

function stopCursorChaos() {
    isCursorChaos = false;
    document.body.style.cursor = 'auto';
    if (fakeCursor) {
        fakeCursor.remove();
        fakeCursor = null;
    }
    clearInterval(cursorInterval);
    document.removeEventListener('mousemove', updateFakeCursor);
}

// Ajouter cette nouvelle fonction
function startDiscomfortNoise() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Volume très faible pour ne pas être trop agressif
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    
    // Alterner les fréquences toutes les 200-800ms
    function updateFrequency() {
        const frequencies = [
            60,    // Très grave
            150,   // Grave
            2000,  // Aigu
            4000,  // Très aigu
            8000   // Extrêmement aigu
        ];
        
        oscillator.frequency.value = frequencies[Math.floor(Math.random() * frequencies.length)];
    }

    // Mettre à jour la fréquence en boucle
    setInterval(updateFrequency, 200 + Math.random() * 600);
    
    // Première mise à jour immédiate
    updateFrequency();
}

function stopDiscomfortNoise(){
    audioContext.close();
    audioContext = null;
}

// Ajouter ces nouvelles fonctions
function startPermanentChaos() {
    const elements = document.querySelectorAll('button, .shop-item, #score, #multiplier, #cookie, .cookie-container, .container > *');
    
    permanentChaosInterval = setInterval(() => {
        const intensity = getCurrentChaosIntensity();
        
        elements.forEach(el => {
            // Rotations et mouvements plus doux
            const rotate = Math.random() * 180 - 90;  // Rotation réduite à ±90 degrés
            const translateX = (Math.random() * window.innerWidth * 0.6) - (window.innerWidth * 0.3); // Réduit à 60% de la largeur
            const translateY = (Math.random() * window.innerHeight * 0.6) - (window.innerHeight * 0.3); // Réduit à 60% de la hauteur
            const scale = 0.8 + (Math.random() * 0.4) * intensity; // Échelle réduite entre 0.8 et 1.2
            
            // Position absolue et transformation avec transition plus lente
            el.style.position = 'fixed';
            el.style.transform = `rotate(${rotate}deg) translate(${translateX}px, ${translateY}px) scale(${scale})`;
            el.style.transition = 'transform 1s ease-in-out'; // Transition plus lente (1s)
            
            // Opacité moins variable
            if (Math.random() < 0.2) {
                el.style.opacity = 0.7 + Math.random() * 0.3;
            }
            
            // Moins d'effets visuels
            if (Math.random() < 0.1) {
                el.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
            }
        });
    }, 2000); // Intervalle beaucoup plus lent (2 secondes)
}

function getCurrentChaosIntensity() {
    const level = CHAOS_INTENSITY_LEVELS
        .slice()
        .reverse()
        .find(level => cookies >= level.cookies);
    return level ? level.intensity : 0.3;
}

function updateChaosIntensity() {
    // Le chaos s'adapte automatiquement car l'intensité est recalculée 
    // à chaque iteration dans startPermanentChaos
}

// Ajouter après les event listeners existants
document.addEventListener('keydown', (e) => {
    // Ctrl + Alt + A pour ouvrir/fermer le panneau admin
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
        toggleAdminPanel();
    }
});

function toggleAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    isAdminPanelOpen = !isAdminPanelOpen;
    adminPanel.style.display = isAdminPanelOpen ? 'block' : 'none';

    // Initialiser l'état des checkboxes
    if (isAdminPanelOpen) {
        document.getElementById('toggleCursor').checked = isCursorChaos;
        document.getElementById('toggleInterface').checked = isInterfaceChaos;
        document.getElementById('toggleInvert').checked = isMouseInverted;
        document.getElementById('toggleNoise').checked = !!audioContext;
        document.getElementById('togglePermanentChaos').checked = !!permanentChaosInterval;
    }
}

// Gestionnaires d'événements pour les contrôles admin
document.getElementById('toggleCursor').addEventListener('change', (e) => {
    if (e.target.checked) {
        startCursorChaos();
    } else {
        stopCursorChaos();
    }
});

document.getElementById('toggleInterface').addEventListener('change', (e) => {
    if (e.target.checked) {
        startInterfaceChaos();
    } else {
        stopInterfaceChaos();
    }
});

document.getElementById('toggleInvert').addEventListener('change', (e) => {
    isMouseInverted = e.target.checked;
});

document.getElementById('toggleNoise').addEventListener('change', (e) => {
    if (e.target.checked && !audioContext) {
        startDiscomfortNoise();
    } else if (!e.target.checked && audioContext) {
        audioContext.close();
        audioContext = null;
    }
});

document.getElementById('togglePermanentChaos').addEventListener('change', (e) => {
    if (e.target.checked) {
        startPermanentChaos();
    } else {
        clearInterval(permanentChaosInterval);
        permanentChaosInterval = null;
        // Reset des éléments
        const elements = document.querySelectorAll('button, .shop-item, #score, #multiplier, #cookie, .cookie-container, .container > *');
        elements.forEach(el => {
            el.style.transform = '';
            el.style.opacity = '';
            el.style.filter = '';
        });
    }
});

document.getElementById('closeAdmin').addEventListener('click', () => {
    toggleAdminPanel();
});

// ============================================================
// Initialisation
// ============================================================
drawWheel();
mesurerHauteurMicro();
if (scrollEnabled) buyScrollButton.style.display = 'none';
updateDisplay();

// // Démarrer le son au premier clic
// document.addEventListener('click', () => {
//     startDiscomfortNoise();
// }, { once: true });

// La ligne startPermanentChaos() a été retirée d'ici

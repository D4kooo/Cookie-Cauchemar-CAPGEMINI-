let cookies = parseInt(localStorage.getItem('cookies')) || 0;
let mic_multiplier = parseInt(localStorage.getItem('mic_multiplier')) || 1;
let multiplier_upgrade = parseInt(localStorage.getItem('multiplier_upgrade')) || 1;
let multiplier = 0;
let multiplierPrice = parseInt(localStorage.getItem('multiplierPrice')) || 10;
let scrollPrice = 50;
let nb_scroll_auto_click = 0;
let scrollEnabled = localStorage.getItem('scrollEnabled') === 'true';
const wheelPrice = 500;

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
        multiplier_upgrade++;
        multiplier = multiplier_upgrade * mic_multiplier;
        multiplierPrice = Math.floor(multiplierPrice * 1.5);
        updateDisplay();
        moveShopButton(); // Ajout de l'appel pour déplacer le bouton
    }
});

const buyScrollButton = document.getElementById('buyScroll');
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

function updateDisplay() {
    cookieCountElement.textContent = Math.floor(cookies);
    multiplierElement.textContent = multiplier;
    multiplierPriceElement.textContent = multiplierPrice;
    if (cookies > wheelPrice) {
        spinButton.style.backgroundColor = "#4CAF50"
    } else {
        spinButton.style.backgroundColor = "#8B0000"
    }
    if (cookies > multiplierPrice) {
        buyMultiplierButton.style.backgroundColor = "#4CAF50"
    } else {
        buyMultiplierButton.style.backgroundColor = "#8B0000"
    }
    
    saveGame();
}

function saveGame() {
    localStorage.setItem('cookies', Math.floor(cookies));
    localStorage.setItem('multiplier_upgrade', multiplier_upgrade);
    localStorage.setItem('mic_multiplier', mic_multiplier);
    localStorage.setItem('multiplierPrice', multiplierPrice);
    localStorage.setItem('scrollEnabled', scrollEnabled);
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
    if (isSpinning || cookies < wheelPrice) return;
    
    cookies -= wheelPrice;
    isSpinning = true;
    const spins = 5 + Math.random() * 5;
    const duration = 5000;
    const startTime = Date.now();
    let currentRotation = 0;
    wheel.style.display = 'block';
    
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
            wheel.style.display = 'none';
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

async function mesurerHauteurMicro() {
    try {
        // Demander l'accès au microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Accès au micro accordé");

        // Création d'un contexte audio pour analyser le flux
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        // Connecter la source audio à l'analyseur
        source.connect(analyser);

        // Paramètres pour analyser le signal
        analyser.fftSize = 256; // Taille de la Fast Fourier Transform
        const bufferLength = analyser.frequencyBinCount; // Nombre de points de données
        const dataArray = new Uint8Array(bufferLength); // Tableau pour stocker les données

        // Fonction pour analyser le volume en continu
        function analyserVolume() {
            analyser.getByteTimeDomainData(dataArray); // Récupère les données temporelles

            // Calculer l'amplitude moyenne
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                const amplitude = (dataArray[i] - 128) / 128; // Normaliser autour de 0
                sum += amplitude * amplitude; // Ajouter au carré
            }
            const rms = Math.sqrt(sum / bufferLength); // Calculer la racine carrée moyenne (RMS)
            const volume = Math.round(rms * 100); // Convertir en pourcentage et arrondir

            // Appliquer l'arrondi et actualiser moins fréquemment
            mic_multiplier = Math.round(volume / 5)+1; // Ajuster le multiplicateur
            multiplier = multiplier_upgrade * mic_multiplier;
            updateDisplay();
        }

        // Appeler la fonction à des intervalles spécifiques (exemple : toutes les 500 ms)
        setInterval(analyserVolume, 500);
    } catch (err) {
        console.error("Erreur lors de l'accès au micro : ", err);
    }
}

// Appeler la fonction
mesurerHauteurMicro();
drawWheel();

if (scrollEnabled) {
    buyScrollButton.style.display = 'none';
}

updateDisplay();
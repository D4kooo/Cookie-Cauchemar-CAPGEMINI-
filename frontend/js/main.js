let cookies = 0;
let multiplier = 1;
let multiplierPrice = 10;

const cookieElement = document.getElementById('cookie');
const cookieCountElement = document.getElementById('cookieCount');
const multiplierElement = document.getElementById('multiplierValue');
const multiplierPriceElement = document.getElementById('multiplierPrice');
const buyMultiplierButton = document.getElementById('buyMultiplier');

cookieElement.addEventListener('click', () => {
    cookies += multiplier;
    updateDisplay();
});

buyMultiplierButton.addEventListener('click', () => {
    if (cookies >= multiplierPrice) {
        cookies -= multiplierPrice;
        multiplier++;
        multiplierPrice = Math.floor(multiplierPrice * 1.5);
        updateDisplay();
    }
});

function updateDisplay() {
    cookieCountElement.textContent = Math.floor(cookies);
    multiplierElement.textContent = multiplier;
    multiplierPriceElement.textContent = multiplierPrice;
}
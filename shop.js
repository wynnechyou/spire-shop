// Shop UI Controller

class ShopController {
    constructor() {
        this.currentShopItems = [];
        this.purchaseCounts = {}; // Track purchases per item index
        this.playerGems = 191;
        this.playerGold = 765;
    }

    async initialize() {
        // Load shop data from Google Sheets
        // Edit the Google Sheet to update tuning: https://docs.google.com/spreadsheets/d/1jX9hiYLuL-BFTspOHJIGBuFZYowXW7uKtOnrlkeu6fw
        const loaded = await window.shopDataManager.loadFromGoogleSheets(
            GOOGLE_SHEETS_CONFIG.SHEET_ID,
            GOOGLE_SHEETS_CONFIG.TABS.SHOP_TUNING,
            'Daily Shop Tuning'
        );

        if (!loaded) {
            alert('Failed to load shop data from Google Sheets. Please check the console for errors.');
            return;
        }

        // Generate initial shop
        this.generateShop();
    }

    generateShop() {
        const castleLevel = parseInt(document.getElementById('castle-level').value) || 1;
        this.currentShopItems = window.shopDataManager.getShopForCastleLevel(castleLevel);
        this.purchaseCounts = {};

        this.renderShop();
        this.updateDebugInfo();
    }

    randomizeShop() {
        // Same as generate shop - it already uses weighted random
        this.generateShop();
    }

    resetPurchases() {
        this.purchaseCounts = {};
        this.renderShop();
    }

    renderShop() {
        const container = document.getElementById('shop-items');
        container.innerHTML = '';

        this.currentShopItems.forEach((item, index) => {
            const card = this.createShopCard(item, index);
            container.appendChild(card);
        });

        this.updatePurchaseProgress();

        // Update scroll arrow visibility after rendering
        setTimeout(() => {
            const wrapper = document.getElementById('shop-items-wrapper');
            if (wrapper) {
                wrapper.dispatchEvent(new Event('scroll'));
            }
        }, 100);
    }

    createShopCard(item, index) {
        const card = document.createElement('div');
        card.className = 'shop-card';

        if (item.cost === 0) {
            card.classList.add('free');
        }

        const purchaseCount = this.purchaseCounts[index] || 0;
        const remainingQuantity = item.available - purchaseCount;

        if (remainingQuantity <= 0) {
            card.classList.add('purchased');
        }

        const displayName = window.shopDataManager.getItemDisplayName(item.id);
        const icon = window.shopDataManager.getItemIcon(item.id);
        const description = window.shopDataManager.getItemDescription(item);

        // Quantity badge
        const quantityBadge = document.createElement('div');
        quantityBadge.className = 'quantity-badge';
        quantityBadge.textContent = `${remainingQuantity} LEFT!`;

        // Item icon
        const itemIcon = document.createElement('div');
        itemIcon.className = 'item-icon';
        itemIcon.textContent = icon;

        // Item name
        const itemName = document.createElement('div');
        itemName.className = 'item-name';
        itemName.textContent = displayName;

        // Item level
        const itemLevel = document.createElement('div');
        itemLevel.className = 'item-level';
        itemLevel.textContent = `Level ${item.level}`;

        // Item description
        const itemDesc = document.createElement('div');
        itemDesc.className = 'item-description';
        itemDesc.textContent = description;

        // Price button
        const priceBtn = document.createElement('button');
        priceBtn.className = 'price-btn';

        if (item.cost === 0) {
            priceBtn.classList.add('free');
            priceBtn.innerHTML = `<span class="currency-icon">🎁</span><span>FREE</span>`;
        } else if (item.currency === 'Diamonds') {
            priceBtn.classList.add('gems');
            priceBtn.innerHTML = `<span class="currency-icon">💎</span><span>${item.cost}</span>`;
        } else {
            priceBtn.classList.add('gold');
            priceBtn.innerHTML = `<span class="currency-icon">🪙</span><span>${item.cost}</span>`;
        }

        // Disable if sold out
        if (remainingQuantity <= 0) {
            priceBtn.disabled = true;
            priceBtn.textContent = 'SOLD OUT';
        }

        // Purchase handler
        priceBtn.addEventListener('click', () => {
            this.purchaseItem(item, index);
        });

        // Assemble card
        card.appendChild(quantityBadge);
        card.appendChild(itemIcon);
        card.appendChild(itemName);
        card.appendChild(itemLevel);
        card.appendChild(itemDesc);
        card.appendChild(priceBtn);

        return card;
    }

    purchaseItem(item, index) {
        const purchaseCount = this.purchaseCounts[index] || 0;
        const remainingQuantity = item.available - purchaseCount;

        // Check if sold out
        if (remainingQuantity <= 0) {
            alert('Sold out!');
            return;
        }

        // Check if player has enough currency
        if (item.currency === 'Diamonds' && this.playerGems < item.cost) {
            alert(`Not enough gems! Need ${item.cost}, have ${this.playerGems}`);
            return;
        }

        if (item.currency === 'Gold' && this.playerGold < item.cost) {
            alert(`Not enough gold! Need ${item.cost}, have ${this.playerGold}`);
            return;
        }

        // Process purchase
        if (item.cost > 0) {
            if (item.currency === 'Diamonds') {
                this.playerGems -= item.cost;
            } else {
                this.playerGold -= item.cost;
            }
        }

        // Increment purchase count
        this.purchaseCounts[index] = purchaseCount + 1;

        // Update UI
        this.updateCurrencyDisplay();
        this.renderShop();

        // Show purchase confirmation
        const displayName = window.shopDataManager.getItemDisplayName(item.id);
        const newRemaining = remainingQuantity - 1;
        console.log(`✅ Purchased: ${displayName} (Level ${item.level}) for ${item.cost} ${item.currency} | ${newRemaining} remaining`);
    }

    updateCurrencyDisplay() {
        document.getElementById('gems-amount').textContent = this.playerGems;
        document.getElementById('gold-amount').textContent = this.playerGold;
    }

    updatePurchaseProgress() {
        // Count how many items are completely sold out
        let soldOutCount = 0;
        this.currentShopItems.forEach((item, index) => {
            const purchaseCount = this.purchaseCounts[index] || 0;
            const remainingQuantity = item.available - purchaseCount;
            if (remainingQuantity <= 0) {
                soldOutCount++;
            }
        });

        const totalItems = this.currentShopItems.length;

        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.textContent = `${soldOutCount}/${totalItems} Items`;
        }
    }

    updateDebugInfo() {
        const castleLevel = document.getElementById('castle-level').value;
        const debugInfo = document.getElementById('debug-info');

        const gemSlots = this.currentShopItems.filter(i => i.currency === 'Diamonds').length;
        const goldSlots = this.currentShopItems.filter(i => i.currency === 'Gold').length;
        const freeSlots = this.currentShopItems.filter(i => i.cost === 0).length;

        debugInfo.textContent = `Castle ${castleLevel} | Total Slots: ${this.currentShopItems.length} | Gem: ${gemSlots} | Gold: ${goldSlots} | Free: ${freeSlots}`;
    }
}

// Initialize shop on page load
let shopController;

window.addEventListener('DOMContentLoaded', async () => {
    shopController = new ShopController();
    await shopController.initialize();
    initializeScrollButtons();
    initializeDragScroll();
    initializePagination();
});

// Scroll button functionality
function initializeScrollButtons() {
    const wrapper = document.getElementById('shop-items-wrapper');
    const leftBtn = document.getElementById('scroll-left');
    const rightBtn = document.getElementById('scroll-right');

    if (!wrapper || !leftBtn || !rightBtn) {
        console.error('❌ Scroll buttons not found!', { wrapper, leftBtn, rightBtn });
        return;
    }

    console.log('✅ Scroll buttons initialized', { wrapper, leftBtn, rightBtn });

    // Scroll amount (width of one card + gap)
    const scrollAmount = 238; // 224px card + 14px gap

    leftBtn.addEventListener('click', () => {
        wrapper.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    rightBtn.addEventListener('click', () => {
        wrapper.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    // Update button visibility based on scroll position
    function updateArrowVisibility() {
        const { scrollLeft, scrollWidth, clientWidth } = wrapper;

        // Show/hide left arrow
        if (scrollLeft <= 5) {
            leftBtn.classList.add('hidden');
        } else {
            leftBtn.classList.remove('hidden');
        }

        // Show/hide right arrow
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
            rightBtn.classList.add('hidden');
        } else {
            rightBtn.classList.remove('hidden');
        }
    }

    // Initial check (with delay to ensure content is rendered)
    setTimeout(() => {
        updateArrowVisibility();
    }, 200);

    // Update on scroll
    wrapper.addEventListener('scroll', updateArrowVisibility);

    // Update when window resizes
    window.addEventListener('resize', updateArrowVisibility);

    // Update when shop items change
    const observer = new MutationObserver(updateArrowVisibility);
    observer.observe(document.getElementById('shop-items'), {
        childList: true
    });
}

// Click-and-Drag Scrolling
function initializeDragScroll() {
    const wrapper = document.getElementById('shop-items-wrapper');
    if (!wrapper) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    wrapper.addEventListener('mousedown', (e) => {
        isDown = true;
        wrapper.style.cursor = 'grabbing';
        startX = e.pageX - wrapper.offsetLeft;
        scrollLeft = wrapper.scrollLeft;
    });

    wrapper.addEventListener('mouseleave', () => {
        isDown = false;
        wrapper.style.cursor = 'grab';
    });

    wrapper.addEventListener('mouseup', () => {
        isDown = false;
        wrapper.style.cursor = 'grab';
    });

    wrapper.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - wrapper.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed multiplier
        wrapper.scrollLeft = scrollLeft - walk;
    });

    // Set initial cursor
    wrapper.style.cursor = 'grab';

    console.log('✅ Drag scroll initialized');
}

// Pagination
function initializePagination() {
    const wrapper = document.getElementById('shop-items-wrapper');
    const pageInfo = document.createElement('div');
    pageInfo.id = 'page-info';
    pageInfo.style.cssText = 'color: white; font-weight: bold; font-size: 14px;';

    const debugInfo = document.getElementById('debug-info');
    if (debugInfo && debugInfo.parentNode) {
        debugInfo.parentNode.insertBefore(pageInfo, debugInfo);
    }

    const cardsPerPage = 8; // Show 8 cards per page
    const cardWidth = 238; // 224px card + 14px gap

    function updatePageInfo() {
        const totalCards = shopController?.currentShopItems?.length || 0;
        const totalPages = Math.ceil(totalCards / cardsPerPage);
        const currentPage = Math.floor(wrapper.scrollLeft / (cardWidth * cardsPerPage)) + 1;

        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    // Page navigation buttons
    const prevPageBtn = document.createElement('button');
    prevPageBtn.textContent = '◀ Prev Page';
    prevPageBtn.style.cssText = 'padding: 8px 15px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; transition: all 0.2s;';
    prevPageBtn.addEventListener('click', () => {
        const pageWidth = cardWidth * cardsPerPage;
        wrapper.scrollBy({ left: -pageWidth, behavior: 'smooth' });
    });
    prevPageBtn.addEventListener('mouseenter', () => {
        prevPageBtn.style.background = '#2980b9';
        prevPageBtn.style.transform = 'scale(1.05)';
    });
    prevPageBtn.addEventListener('mouseleave', () => {
        prevPageBtn.style.background = '#3498db';
        prevPageBtn.style.transform = 'scale(1)';
    });

    const nextPageBtn = document.createElement('button');
    nextPageBtn.textContent = 'Next Page ▶';
    nextPageBtn.style.cssText = 'padding: 8px 15px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; transition: all 0.2s;';
    nextPageBtn.addEventListener('click', () => {
        const pageWidth = cardWidth * cardsPerPage;
        wrapper.scrollBy({ left: pageWidth, behavior: 'smooth' });
    });
    nextPageBtn.addEventListener('mouseenter', () => {
        nextPageBtn.style.background = '#2980b9';
        nextPageBtn.style.transform = 'scale(1.05)';
    });
    nextPageBtn.addEventListener('mouseleave', () => {
        nextPageBtn.style.background = '#3498db';
        nextPageBtn.style.transform = 'scale(1)';
    });

    // Add to control panel
    const controlPanel = document.querySelector('.controls-panel');
    const paginationGroup = document.createElement('div');
    paginationGroup.className = 'control-group';
    paginationGroup.style.cssText = 'display: flex; gap: 10px; align-items: center;';
    paginationGroup.appendChild(prevPageBtn);
    paginationGroup.appendChild(pageInfo);
    paginationGroup.appendChild(nextPageBtn);

    if (controlPanel) {
        controlPanel.insertBefore(paginationGroup, controlPanel.firstChild);
    }

    // Update page info on scroll
    wrapper.addEventListener('scroll', updatePageInfo);

    // Initial update
    setTimeout(updatePageInfo, 300);

    console.log('✅ Pagination initialized');
}

// Global functions for UI controls
function generateShop() {
    shopController.generateShop();
}

function randomizeShop() {
    shopController.randomizeShop();
}

function resetPurchases() {
    shopController.resetPurchases();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // R = Refresh shop
    if (e.key === 'r' || e.key === 'R') {
        randomizeShop();
    }

    // P = Reset purchases
    if (e.key === 'p' || e.key === 'P') {
        resetPurchases();
    }

    // Arrow keys to change castle level
    if (e.key === 'ArrowUp') {
        const input = document.getElementById('castle-level');
        const newValue = Math.min(20, parseInt(input.value) + 1);
        input.value = newValue;
        generateShop();
    }

    if (e.key === 'ArrowDown') {
        const input = document.getElementById('castle-level');
        const newValue = Math.max(1, parseInt(input.value) - 1);
        input.value = newValue;
        generateShop();
    }
});

// Auto-refresh on castle level change
document.addEventListener('DOMContentLoaded', () => {
    const castleLevelInput = document.getElementById('castle-level');
    if (castleLevelInput) {
        castleLevelInput.addEventListener('change', () => {
            generateShop();
        });
    }
});

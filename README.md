# Daily Shop Playtesting Tool

A web-based interface for testing and tuning the Daily Shop system for your tower defense + merge game.

## 🌐 Live Demo

**https://wynnechyou.github.io/spire-shop/**

Share this URL with coworkers to playtest the shop without any setup!

---

## Features

✅ **Visual Shop Interface** - Matches your game's UI design  
✅ **Dynamic Pricing System** - Castle-level adjusted costs  
✅ **Progression-Based Gating** - Only shows unlocked items  
✅ **3-Tier Probability System** - Category → Outcome → Type  
✅ **Purchase Limits** - Configurable max quantities  
✅ **Castle Level Testing** - Test all 20 castle levels  
✅ **Live Tuning Preview** - See changes immediately  
✅ **Scrollable Shop** - Horizontal scroll with arrow buttons  

---

## System Overview

The Daily Shop uses **Excel files as live data sources** - the browser downloads and parses them in real-time:

1. **Daily Shop Tuning v3.xlsx** - Primary data file loaded by browser
2. **Item Pricing.xlsx** - Base prices & castle-level dynamic pricing
3. **Progression Map.xlsx** - Player unlock progression (what they have at each level)
4. **Item Selection.xlsx** - Probability weights & purchase limits

**Architecture:** Browser downloads Excel → JavaScript parses with xlsx.js library → Shop displays data

This means you can update tuning by simply editing the Excel file and pushing to Git - no code changes needed!

See **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** for calculation formulas and examples.

---

## Quick Start

### Option 1: Use the Live Demo (Easiest)

Just visit **https://wynnechyou.github.io/spire-shop/** - no setup required!

### Option 2: Run Locally

Clone the repository and open in a browser:

```bash
git clone https://github.com/wynnechyou/spire-shop.git
cd spire-shop

# Using a simple HTTP server (recommended)
npx serve .

# Or with Python
python -m http.server 8000

# Then open: http://localhost:8000
```

**Note**: Opening `index.html` directly (file://) may cause CORS issues with loading the Excel file. Use a local server.

---

## How to Use

### Controls

**Castle Level Selector**
- Change the dropdown to test different castle levels (1-20)
- Shop automatically refreshes when you change levels

**Buttons**
- **Refresh Shop** - Generate new shop items (weighted random)
- **Random Shop** - Same as Refresh (each refresh is already random)
- **Reset Purchases** - Clear all purchased items

**Keyboard Shortcuts**
- `R` - Refresh/randomize shop
- `P` - Reset purchases
- `↑` - Increase castle level
- `↓` - Decrease castle level

### Shop Cards

Each card shows:
- **Item Icon** - Visual representation (emoji)
- **Quantity Badge** - "X LEFT!" indicator (top-right)
- **Item Name** - Display name (e.g., "Crystal Tower")
- **Level** - Item level/tier
- **Description** - Item stats and abilities
- **Price Button** - Cost with currency icon (💎 or 🪙)

### Currency System

- **Gems (💎)**: Premium currency (starts at 191)
- **Gold (🪙)**: Soft currency (starts at 765)
- Purchasing items deducts from your balance
- Insufficient funds displays an alert

### Purchase Flow

1. Click a price button to purchase
2. Currency is deducted if sufficient
3. Card becomes grayed out and marked "PURCHASED"
4. Progress counter updates (e.g., "2/6 Items")
5. Cannot purchase same item twice

---

## Understanding the Data

### Shop Structure

**Castle 1-3**: 5 slots (3 Gem + 2 Gold)  
**Castle 4-20**: 6 slots (1 Free + 3 Gem + 2 Gold)

### Shop Generation System

The shop uses a **3-tier probability system**:

**Tier 1: Category Selection**
- Basic Tower (40% Gems, 55% Gold at Castle 10)
- Harvester (20% Gems, 0% Gold)
- Hero XP (10% Gems, 30% Gold)
- Runes (30% Gems, 15% Gold)

**Tier 2: Outcome Selection**
- Basic Towers/Harvesters: Level offset (-4 to 0 relative to player)
- Hero XP: Fixed levels (1-5)

**Tier 3: Type Selection** (Towers/Harvesters only)
- Equal probability among all unlocked types
- Example: Castle 10 has 6 towers → 16.67% each

### Dynamic Pricing

Items have **castle-level adjusted prices**:
- Castle 1 player: Bell Tower Lv5 = 152 gems
- Castle 10 player: Bell Tower Lv5 = 57 gems (cheaper!)
- Castle 20 player: Bell Tower Lv5 = 3 gems (very cheap!)

**Gold Conversion:** `ceil(gems × 1000/133)`
- 57 gems → 429 gold
- Always rounds UP

### Progression Gating

Players only see items they've unlocked:
- Castle 1: Only Spell Cannon & Bell Tower
- Castle 10: All 6 towers, 4/6 harvesters
- Castle 20: Everything unlocked

**Rule:** If player's item level = 0, it's locked and won't appear in shop.

---

## Playtesting Tips

### What to Test

1. **Progression Curve**
   - Does item value feel appropriate for each castle level?
   - Are prices balanced between Gem and Gold options?

2. **Item Variety**
   - Do you see enough different items?
   - Are certain items appearing too often or too rarely?

3. **Currency Balance**
   - Can you afford interesting items at your level?
   - Is the Gem-to-Gold value ratio fair?

4. **Early vs Late Game**
   - Castle 1-5: Enough accessible options?
   - Castle 15-20: High-value items feel rewarding?

### Testing Workflow

```
1. Set Castle Level → 4
2. Click "Refresh Shop" 10 times
3. Note which items appear most/least
4. Check if prices feel balanced
5. Repeat for levels 10, 15, 20
```

---

## Modifying Tuning

### Adjust Prices
**File:** `Item Pricing.xlsx`
1. Find the item row (e.g., "Bell Tower Lv5")
2. Edit dynamic prices (Columns N-AG for Castle 1-20)
3. OR edit base price (Column G)
4. **Save the Excel file**
5. If testing locally: Refresh browser to see changes
6. If updating live demo: See "Deploying Changes" section below

### Change Probability Weights
**File:** `Item Selection.xlsx`
1. **Category weights:** Edit Rows 3-13
2. **Outcome weights:** Edit Rows 16+
3. Refresh browser to see changes

**Example:** Make Harvesters more common at Castle 10
- Change "Gems, Harvester" from 20% → 30%
- Change "Gems, Basic Tower" from 40% → 30%

### Adjust Purchase Limits
**File:** `Item Selection.xlsx`
1. Find the outcome row (e.g., "Gems, Basic Tower (Level -2)")
2. Edit Column C value
3. Refresh browser

### Change Unlock Progression
**File:** `Progression Map.xlsx`
1. Find the castle level row
2. Edit tower/harvester level columns (D-O)
3. Set to 0 to lock, > 0 to unlock
4. Refresh browser

**Example:** Unlock Skyshot at Castle 5 instead of 7
- Change Castle 5, Column H from 0 → 5

---

## Deploying Changes

### Update the Live Demo

When you modify Excel files or code, push changes to update the live site:

```bash
# 1. Check what you changed
git status

# 2. Stage your changes
git add "Daily Shop Tuning v3.xlsx"  # Or whatever files you changed
# Or stage everything: git add .

# 3. Commit with a descriptive message
git commit -m "Adjust tower prices for castle levels 10-15"

# 4. Push to GitHub (live site updates in ~1 minute)
git push
```

### Verify Deployment

1. Visit https://github.com/wynnechyou/spire-shop/actions
2. Wait for green checkmark (build complete)
3. Visit https://wynnechyou.github.io/spire-shop/
4. Hard refresh (Ctrl+Shift+R) to clear cache

### Common Git Commands

| Task | Command |
|------|---------|
| Check status | `git status` |
| View changes | `git diff` |
| See history | `git log --oneline -10` |
| Undo last commit (keep changes) | `git reset --soft HEAD~1` |
| Discard all local changes | `git reset --hard HEAD` ⚠️ |

---

## Debug Information

Bottom bar shows:
```
Castle 4 | Total Slots: 6 | Gem: 3 | Gold: 2 | Free: 1
```

- **Total Slots**: Number of items in shop
- **Gem/Gold/Free**: Breakdown by currency type

**Console Logs:**
- Open browser DevTools (F12)
- Check Console for detailed item selection logs
- Purchase confirmations logged with details

---

## Known Limitations

1. **Static Images** - Uses game screenshots, not actual game assets
2. **Shopkeeper Position** - Cropped from screenshot, may need adjustment
3. **DailyChest Contents** - Rarity shown, but no definition of chest contents
4. **Item Icons** - Uses emojis instead of game art

---

## File Structure

```
Spire_Shop/
├── index.html                    # Main HTML structure
├── styles.css                    # UI styling
├── shop-data.js                  # Data parsing logic (Excel reader)
├── shop.js                       # Shop controller & UI
├── Daily Shop Tuning v3.xlsx     # Live tuning data (loaded by browser)
├── Item Pricing.xlsx             # Pricing tables
├── Item Selection.xlsx           # Probability weights
├── Progression Map.xlsx          # Player unlock progression
├── asset_upload/                 # Game assets
│   ├── gem.png                   # Gem currency icon
│   └── gold.png                  # Gold currency icon
├── README.md                     # This file
├── PROJECT_CONTEXT.md            # Full project documentation
├── QUICK_REFERENCE.md            # Quick lookup guide
└── SHOP_GENERATION_SPEC.md       # Technical specification
```

**Deployed to:** https://wynnechyou.github.io/spire-shop/  
**Repository:** https://github.com/wynnechyou/spire-shop

---

## Troubleshooting

**Shop doesn't load:**
- Check browser console for errors
- Ensure Excel file is in same directory
- Use a local server (not file://)

**Items not appearing:**
- Verify Castle Level has data in Excel (Rows 4-23)
- Check if loot tables exist for that level
- Look for console warnings

**Prices seem wrong:**
- Verify `{Cost=X}` values in Excel
- Check `{Currency=Diamonds}` or `{Currency=Gold}`

**Purchases not working:**
- Ensure you have enough currency
- Check if item already purchased
- Reset purchases and try again

---

## Documentation

### Quick Reference
**[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Fast lookup for common calculations
- Price lookups
- Probability calculations
- UID mappings
- Purchase limits
- Common tuning tasks

### Full Context
**[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)** - Complete project documentation
- Economy overview
- All data file specifications
- Design decisions
- Known issues
- Changelog

### Technical Specification
**[SHOP_GENERATION_SPEC.md](SHOP_GENERATION_SPEC.md)** - Implementation guide
- Complete algorithm walkthrough
- Code examples
- Edge cases
- Testing checklist
- Performance optimization

---

## Next Steps

### Immediate
- [ ] Implement new shop generation algorithm using Item Selection
- [ ] Integrate dynamic pricing from Item Pricing
- [ ] Add progression gating from Progression Map
- [ ] Update UI to show purchase limits

### Future Enhancements
- [ ] Add visual item icons (replace emojis with game art)
- [ ] Implement actual DailyChest opening animation
- [ ] Export purchase analytics/heatmaps
- [ ] A/B testing variant comparison
- [ ] Auto-generate balance reports
- [ ] Probability visualization (show % chance in debug mode)

---

## Support

Questions or issues? Check the `PROJECT_CONTEXT.md` for design context.

**Keyboard Shortcuts Quick Reference:**
- `R` = Refresh Shop
- `P` = Reset Purchases  
- `↑/↓` = Adjust Castle Level

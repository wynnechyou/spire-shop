# Daily Shop Project - File Summary

**Last Updated**: 2026-04-09  
**Live Demo**: https://wynnechyou.github.io/spire-shop/  
**Repository**: https://github.com/wynnechyou/spire-shop

---

## 📊 Data Files (Excel)

### Item Pricing.xlsx
**Purpose:** Item costs and dynamic pricing by castle level

**Key Columns:**
- **B**: Category (ignore)
- **C**: Item UID (e.g., "Spell Tower", "Hero XP")
- **G**: Base gem price
- **N-AG**: Dynamic prices for Castle 1-20

**Used For:**
- Getting item costs
- Castle-level price adjustments
- Gold conversion calculations

**Example:**
- Bell Tower Lv5 base price: 262 gems
- Bell Tower Lv5 @ Castle 10: 57 gems (dynamic)

---

### Progression Map.xlsx
**Purpose:** Player unlock progression and expected item levels

**Key Columns:**
- **A**: Castle Level (1-20)
- **D-I**: Tower levels (Spell Cannon, Bell, Crystal, Catapult, Skyshot, Spinshot)
- **J-O**: Harvester levels (same order)
- **P**: Hero level
- **Q**: XP per level

**Used For:**
- Determining what items player has unlocked
- Filtering shop offers (Level 0 = locked)
- Calculating level offsets

**Example:**
- Castle 10: Crystal Tower = 6 (unlocked)
- Castle 1: Crystal Tower = 0 (locked, don't show in shop)

---

### Item Selection.xlsx
**Purpose:** Probability weights and purchase limits

**Structure:**
- **Rows 3-13**: Category probabilities (Basic Tower, Harvester, Hero XP, Runes)
- **Rows 16+**: Outcome probabilities (level offsets, fixed levels)
- **Column C**: Purchase limits

**Used For:**
- Rolling random shop offers
- Determining item appearance rates
- Setting max purchase quantities

**Example:**
- Castle 10, Gems, Basic Tower: 40% chance
- Castle 10, Gems, Basic Tower Level -2: 35% chance
- Purchase limit for Level -2: 3 copies

---

### Daily Shop Tuning (04-08-26).xlsx
**Purpose:** Legacy slot template system

**Status:** Being phased out in favor of Item Selection system

**Still Used For:**
- Reference for original shop structure
- Daily Chest loot tables

---

## 📝 Documentation Files

### PROJECT_CONTEXT.md
**Purpose:** Master project documentation

**Contains:**
- Game economy overview (currencies, exchange rates)
- All data file specifications
- Shop structure (slots, currencies)
- UID mapping table
- Item Selection 3-tier system
- Dynamic pricing rules
- Progression gating rules
- Complete examples with calculations
- Changelog

**When to Read:**
- Need full context on the project
- Understanding design decisions
- Looking up data file structures

---

### SHOP_GENERATION_SPEC.md
**Purpose:** Technical implementation guide

**Contains:**
- Complete algorithm walkthrough
- Step-by-step generation process
- Code examples in JavaScript
- Utility functions
- Edge cases and validation rules
- Complete example execution
- Testing checklist
- Performance optimization notes

**When to Read:**
- Implementing the shop system
- Understanding the generation algorithm
- Need code examples
- Debugging shop generation

---

### QUICK_REFERENCE.md
**Purpose:** Fast lookup guide

**Contains:**
- Common calculations (pricing, probability)
- UID mapping table
- Progression quick lookup
- Purchase limits cheat sheet
- Category probabilities by castle level
- Common tuning tasks
- Testing scenarios
- Troubleshooting tips

**When to Read:**
- Need quick answer to common question
- Doing routine tuning adjustments
- Looking up specific values
- Testing specific scenarios

---

### README.md
**Purpose:** Playtesting tool user guide

**Contains:**
- Tool features overview
- How to run the tool
- Understanding the shop system
- Playtesting tips
- Modifying tuning files
- Debug information
- Troubleshooting

**When to Read:**
- First time using the tool
- Learning how to playtest
- Need to modify tuning
- Tool not working as expected

---

### FILES_SUMMARY.md
**Purpose:** This file - directory of all project files

**Contains:**
- List of all data files
- List of all documentation
- List of all code files
- Brief description of each
- When to use each file

---

## 💻 Code Files

### index.html
**Purpose:** Main HTML structure

**Contains:**
- Page layout
- Shop interface structure
- Currency display
- Sidebar navigation
- Shop items container
- Control panel

**When to Edit:**
- Changing UI layout
- Adding new UI elements
- Modifying structure

---

### styles.css
**Purpose:** Visual styling

**Contains:**
- Shop card styles
- Color schemes
- Layout positioning
- Animations and transitions
- Responsive design
- Scroll controls

**When to Edit:**
- Changing colors/fonts
- Adjusting layout
- Visual improvements
- Matching game art style

---

### shop-data.js
**Purpose:** Data loading and parsing

**Contains:**
- Excel file reader
- Data parser for Daily Shop Tuning
- Loot table builder
- Weighted random selection
- Item definition parser
- Display name mapping
- Icon mapping

**When to Edit:**
- Adding new data sources
- Changing data format
- Adding new item types
- Updating UID mappings

**Current Status:** Uses legacy Daily Shop Tuning format

**Next Steps:** Update to use Item Pricing + Item Selection + Progression Map

---

### shop.js
**Purpose:** Shop controller and UI logic

**Contains:**
- Shop generation function
- Purchase handling
- Currency tracking
- UI rendering
- Purchase progress tracking
- Keyboard shortcuts
- Scroll controls

**When to Edit:**
- Changing shop generation logic
- Modifying purchase behavior
- Adding new features
- UI interactions

**Current Status:** Uses legacy loot table system

**Next Steps:** Implement 3-tier probability system from Item Selection

---

## 🖼️ Asset Files

### asset_upload/gem.png
**Purpose:** Gem currency icon

**Used In:**
- Top-left currency display
- Price buttons for gem offers

**Status:** ✅ Active (replaces placeholder images)

---

### asset_upload/gold.png
**Purpose:** Gold currency icon

**Used In:**
- Top-left currency display
- Price buttons for gold offers

**Status:** ✅ Active (replaces placeholder images)

---

### IMG_3228.PNG & IMG_3229.PNG
**Purpose:** Legacy game UI reference screenshots

**Status:** Deprecated (kept for reference, not used in live site)

---

## 📦 Node Modules

### node_modules/
**Purpose:** npm package dependencies

**Contains:**
- `xlsx` - Excel file parser
- `serve` - Local web server

**When to Update:**
```bash
npm install
```

---

## 🗂️ Project Structure

```
Spire_Shop/
│
├── 📊 Data Files (loaded by browser)
│   ├── Daily Shop Tuning v3.xlsx  ← Primary data file
│   ├── Item Pricing.xlsx
│   ├── Progression Map.xlsx
│   └── Item Selection.xlsx
│
├── 📝 Documentation
│   ├── PROJECT_CONTEXT.md
│   ├── SHOP_GENERATION_SPEC.md
│   ├── QUICK_REFERENCE.md
│   ├── README.md
│   └── FILES_SUMMARY.md (this file)
│
├── 💻 Code (deployed to GitHub Pages)
│   ├── index.html
│   ├── styles.css
│   ├── shop-data.js
│   └── shop.js
│
├── 🖼️ Assets (deployed to GitHub Pages)
│   ├── asset_upload/
│   │   ├── gem.png      ← Active currency icon
│   │   └── gold.png     ← Active currency icon
│   ├── IMG_3228.PNG     (deprecated)
│   └── IMG_3229.PNG     (deprecated)
│
├── 🔧 Version Control
│   ├── .git/            (Git repository)
│   └── .gitignore       (Excludes node_modules, etc.)
│
└── 📦 Dependencies (not deployed)
    ├── package.json
    ├── package-lock.json
    └── node_modules/
```

**Live Site**: https://wynnechyou.github.io/spire-shop/  
**GitHub**: https://github.com/wynnechyou/spire-shop

---

## 🔄 Workflow Guide

### For Tuning/Balancing (Local Testing)
1. Open relevant Excel file (Item Pricing, Item Selection, Progression Map)
2. Make changes
3. Save file
4. Refresh browser (Ctrl+R)
5. Test in playtesting tool

### For Updating Live Demo
1. Edit Excel files or code
2. Save changes
3. Commit to Git:
   ```bash
   git add .
   git commit -m "Update tower prices"
   git push
   ```
4. Wait ~1 minute for deployment
5. Visit https://wynnechyou.github.io/spire-shop/ (hard refresh: Ctrl+Shift+R)

### For Understanding System
1. Start with **README.md** for overview
2. Use **QUICK_REFERENCE.md** for specific lookups
3. Read **PROJECT_CONTEXT.md** for full details
4. Check **SHOP_GENERATION_SPEC.md** for implementation

### For Implementing Features
1. Read **SHOP_GENERATION_SPEC.md** for algorithm
2. Edit **shop-data.js** for data handling
3. Edit **shop.js** for UI/logic
4. Edit **styles.css** for visual changes
5. Test in browser

### For Debugging
1. Check browser console (F12)
2. Look at **README.md** troubleshooting section
3. Verify Excel files have correct format
4. Check **QUICK_REFERENCE.md** for validation rules

---

## 📋 Current Status

### ✅ Completed
- [x] Web-based playtesting tool
- [x] Visual shop interface
- [x] Purchase simulation
- [x] Castle level testing
- [x] Item Pricing data integration
- [x] Progression Map data integration
- [x] Item Selection data integration
- [x] Complete documentation
- [x] **GitHub Pages deployment** (https://wynnechyou.github.io/spire-shop/)
- [x] **Git version control** (https://github.com/wynnechyou/spire-shop)
- [x] **Game assets integration** (gem/gold icons)
- [x] **Excel-as-data-source architecture**

### 🚧 In Progress
- [ ] Implement 3-tier probability system in code
- [ ] Add dynamic pricing to shop generation
- [ ] Add progression gating to shop filtering
- [ ] Update shop-data.js to use new Excel files
- [ ] Update shop.js to use new algorithm

### 📅 Planned
- [ ] Real item icons (replace emojis)
- [ ] Daily Chest opening animation
- [ ] Purchase analytics export
- [ ] A/B testing framework
- [ ] Automated balance reporting

---

## 🎯 Next Actions

**For User:**
1. Review documentation to ensure everything is captured
2. Test calculations in QUICK_REFERENCE.md
3. Identify any missing information
4. Decide on next implementation priority

**For Implementation:**
1. Create new data loader for Item Pricing, Progression Map, Item Selection
2. Implement 3-tier probability algorithm from SHOP_GENERATION_SPEC.md
3. Add dynamic pricing calculator
4. Add progression gating filter
5. Update UI to show purchase limits and probabilities

---

**End of File Summary**

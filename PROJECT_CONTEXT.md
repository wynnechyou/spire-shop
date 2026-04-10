# Daily Shop - Project Context

**Last Updated**: 2026-04-08  
**Game**: Tower Defense + Merge Game  
**Focus**: Daily Shop Design & Tuning

---

## Game Economy Overview

### Core Progression
- **Castle Level**: Primary progression metric
- **Total Castle Levels**: 20

### Currencies
- **Gems** (Premium Currency)
  - Exchange rate: **32 Gems = $1 USD**
  - Used for: Premium shop items, faster progression
  
- **Gold** (Soft Currency)
  - Conversion reference: **1000 Gold = 133 Gems**
  - Implied USD value: **1000 Gold ≈ $4.16**

---

## Daily Shop Structure

### Slot Configuration

**Castle Levels 1-3:**
```
3 Gem slots + 2 Gold slots = 5 total slots
```

**Castle Levels 4-20:**
```
1 DailyChest slot (free) + 3 Gem slots + 2 Gold slots = 6 total slots
```

### Shop Refresh
- Frequency: Daily
- Each slot pulls from a **weighted loot table** based on Castle Level

---

## Tuning File Format

**Source**: `Daily Shop Tuning (04-08-26).xlsx`

### Key Sections

#### 1. Slot Configuration (Rows 4-23)
- **Column A**: Node names (`Items_1` through `Items_20`)
- **Column E**: Slot template format

Example (Castle Level 4):
```
<DailyChest>,<Dia_$CastleLevel$>,<Dia_$CastleLevel$>,<Dia_$CastleLevel$>,<Gold_$CastleLevel$>,<Gold_$CastleLevel$>
```

#### 2. Loot Tables (Rows 27+)
- **Node**: Loot table identifier (e.g., `Dia_4`, `Gold_4`, `DailyChest`)
- **[Index]**: Row number within that loot table
- **Weight**: Probability weight for item selection
- **Result**: Item definition string

#### 3. Item Definition Format
```
{ItemID}{Level={N}}{Cost={N}}{Currency={Gold|Diamonds}}{Available={N}}
```

Example:
```
SniperTower{Level=2}{Cost=36}{Currency=Diamonds}{Available=3}
```

**Fields:**
- `ItemID`: Tower/resource type (e.g., SniperTower, Ballista, Tree, WildHeroXp)
- `Level`: Item level/tier
- `Cost`: Price in specified currency
- `Currency`: `Diamonds` (Gems) or `Gold`
- `Available`: Maximum purchase quantity per refresh

---

## Item Types

### Tower Types
- **Ballista** (Spell Cannon)
- **DartTower** (Bell Tower)
- **SniperTower** (Crystal Tower)
- **NeedleTower** (Spinshot Turret)
- **SkyshotTower** (Skyshot Tower)
- **VoidTower** (Catapult Tower) - *Introduced at Castle Level 5*

### Resources
- **Tree** (Ash Tree)
- **WildHeroXp** (Hero XP)
- **Mana**

### Special
- **DailyChest** (Free daily reward, Castle Level 4+)

---

## Progression Curves

### Gold Slot Evolution

**Early Game (Castle 1-4):**
- 6 item types in pool
- Costs: 66-576 Gold
- Focus: Trees (Weight=3), basic towers

**Mid Game (Castle 5-8):**
- Adds WildHeroXp (990 Gold) and Mana (699 Gold)
- 6-7 item types
- Still includes cheap Level 1 towers (80 Gold)

**Late Game (Castle 9-20):**
- Consistent 7-item rotation
- Tower levels scale with Castle Level
- Cost range: 96 Gold (Level 2) → 3,200 Gold (Level 10)
- WildHeroXp/Mana costs remain static (990/699 Gold)

### Gem Slot Evolution

**Early Game (Castle 1-4):**
- 3 tower types only (Sniper, Dart, Needle)
- Fixed: 36 Gems per item (~$1.12 USD)
- Equal weight (Weight=1)

**Transition (Castle 5-10):**
- VoidTower introduced
- 3-12 item types
- Costs: 12-22 Gems ($0.38-$0.69 USD)
- Mix of common/rare items

**Mid Game (Castle 11-14):**
- 12-item loot tables
- Common tier: Weight=60 (Levels 5-9)
- Rare tier: Weight=12/24 (higher levels)
- Costs: 17-200 Gems ($0.53-$6.25 USD)

**Late Game (Castle 15-20):**
- Level 9-12 towers
- Common: 200-500 Gems ($6.25-$15.63 USD)
- Rare: 400-1,300 Gems ($12.50-$40.63 USD)

### DailyChest Rarity (Castle 4+)
Weighted drop rates:
- **Level 1**: 64% (64/100)
- **Level 2**: 25% (25/100)
- **Level 3**: 10% (10/100)
- **Level 4**: 1% (1/100)

---

## Known Issues & Questions

### 🔴 Data Issues

1. **Bonus Item Corruption** (Rows 31-50)
   - Malformed data in Bonus loot tables
   - Format: `{Available=1},,ItemID,Level=1},Available=1}`
   - Needs cleanup

2. **Tower Level Cap Inconsistency**
   - Gem tables (Castle 17-20) offer Level 11-12 towers
   - Context suggests max tower level is 10
   - **Question**: Are these correct or typos?

3. **DailyChest Contents Undefined**
   - Rarity weights exist (Level 1-4)
   - No loot table defines what's INSIDE each chest level
   - **Question**: Where is chest contents definition?

### 🟡 Balance Concerns

1. **Gold Value Decline (Late Game)**
   - WildHeroXp/Mana prices don't scale after Castle 5
   - At Castle 17: 3,200 Gold tower vs 990 Gold XP
   - Gold becomes less scarce but items don't reflect this

2. **Gem Cost Spike (Castle 16→17)**
   - Max item cost jumps from 400 Gems → 1,300 Gems (3.25x)
   - Could feel punishing at transition

3. **Gem-to-Gold Conversion Value**
   - Example (Castle 9): Level 3 tower
     - Gem: 14 Gems (~$0.44)
     - Gold: 112 Gold (~15 Gems if converted)
   - Gem purchases ~10% cheaper
   - **Question**: Is this intentional margin?

---

## Technical Notes

### File Format
- **Type**: `.xlsx` (Excel)
- **Sheets**: Single sheet ("Sheet1")
- **Encoding**: CSV columns with comma separation
- **Parser**: Node.js + xlsx library

### Parsing Strategy
1. Read slot templates (Rows 4-23)
2. Extract loot table references (e.g., `<Dia_4>`, `<Gold_4>`)
3. Build loot pools by matching Node names
4. Calculate probabilities from Weight columns
5. Parse item definitions from Result column

---

## Next Steps / Roadmap

### Immediate Tasks
- [ ] Define DailyChest contents (what's inside Level 1-4 chests?)
- [ ] Clean up Bonus loot table data
- [ ] Clarify tower level cap (10 vs 12)

### Development Tasks
- [ ] Create shop generator (parse tuning → generate offers)
- [ ] Build probability calculator (weighted random selection)
- [ ] Implement daily rotation logic
- [ ] Add purchase tracking (Available counts)

### Analysis Tasks
- [ ] Visualize cost curves (Gold/Gem progression)
- [ ] Calculate expected value per Castle Level
- [ ] Model player spending patterns
- [ ] Compare Gem/Gold value propositions

### Tuning Tasks
- [ ] Recommend balance adjustments
- [ ] Create alternative progression curves
- [ ] Design A/B test variants

---

## Design Goals (To Be Defined)

**Questions to answer:**
1. What's the primary monetization goal?
   - Drive Gem purchases?
   - Balance free vs paid progression?
   - Retention through daily login?

2. What's the target spending per Castle Level?
   - Early game: $?
   - Mid game: $?
   - Late game: $?

3. How should Gold/Gem value balance?
   - Should Gems always be better value?
   - How much better (% discount)?

4. What's the target daily engagement?
   - Check shop only?
   - Make purchases daily?
   - Strategic waiting for specific items?

---

## Tools & Deliverables

### Web Playtesting Tool
**Status**: ✅ Complete (v1.0)  
**Files**: `index.html`, `styles.css`, `shop-data.js`, `shop.js`

**Features:**
- Visual shop interface matching game UI
- Horizontal scrollable shop cards
- Castle Level testing (1-20)
- Weighted random loot table selection
- Purchase simulation with currency tracking
- Keyboard shortcuts (R=refresh, P=reset, ↑↓=change level)

**Usage:**
```bash
npx serve .
# Open http://localhost:8000
```

**Documentation**: See `README.md` for full instructions

---

---

## Item Pricing System

**Source File**: `Item Pricing.xlsx`

### Column Structure
- **Column B**: Category (largely ignore)
- **Column C**: Primary identifier (UID) - e.g., "Spell Tower", "Bell Tower"
- **Column G**: Base gem valuation (internal pricing)
- **Columns N-AG**: Dynamic prices for Castle Levels 1-20

### UID Mapping (Internal → Display Name)
```
Ballista       → Spell Cannon
DartTower      → Bell Tower
SniperTower    → Crystal Tower
NeedleTower    → Spinshot Turret
SkyshotTower   → Skyshot Tower
VoidTower      → Catapult Tower
Tree           → Ash Tree
WildHeroXp     → Hero XP
Mana           → Mana
```

### Dynamic Pricing Rules

**Applies to:** Basic Towers & Harvestables (Harvesters)

**Priority:**
1. Use **dynamic price** when available (Columns N-AG)
2. Fall back to **base price** (Column G) if no dynamic price

**Examples:**
- Spell Tower Lv10 @ Castle 20: **68 gems** (not 3,967 base)
- Bell Tower Lv5 @ Castle 10: **57 gems** (not 262 base)

### Gold Conversion Formula

```javascript
goldCost = Math.ceil(gemCost * (1000 / 133))
// Always round UP to nearest integer
```

**Examples:**
- 57 gems → 429 Gold
- 155 gems → 1,166 Gold

---

## Player Progression System

**Source File**: `Progression Map.xlsx`

### Column Structure
- **Column A**: Castle Level (1-20)
- **Column B**: DSI (Days Since Install) - not relevant for shop
- **Columns D-I**: Expected Tower Levels
  - D: Spell Cannon
  - E: Bell Tower
  - F: Crystal Tower
  - G: Catapult (VoidTower)
  - H: Skyshot
  - I: Spinshot
- **Columns J-O**: Expected Harvester Levels (same order)
- **Column P**: Hero Level
- **Column Q**: XP per level up

### Progression Gating Rule

**Level 0 = Not Unlocked** → Do NOT sell in shop

**Examples:**
- Castle 1: Crystal Tower = 0 → Cannot sell Crystal items
- Castle 10: Spinshot Harvester = 0 → Cannot sell Spinshot Harvester
- Castle 20: All items unlocked

### Castle 10 Player Progression
```
Towers:     Spell=7, Bell=7, Crystal=6, Catapult=6, Skyshot=7, Spinshot=7
Harvesters: Spell=3, Bell=3, Crystal=3, Catapult=3, Skyshot=0, Spinshot=0
Hero:       Level 7, 430 XP/level
```

---

## Item Selection & Probability System

**Source File**: `Item Selection.xlsx`

### File Structure

**Section 1 (Rows 3-13)**: Category probability weights
- Determines: What TYPE of item (Basic Tower, Harvester, Hero XP, Runes)
- Split by: Gem vs Gold currency

**Section 2 (Rows 16+)**: Outcome probability weights
- Determines: Specific level/item within category
- Includes: Purchase limits (Column C)

### Three-Tier Roll System

**Tier 1: Category Selection**
```
Castle 10, Gem Slot:
- Basic Tower:  40%
- Harvester:    20%
- Hero XP:      10%
- Runes:        30%
```

**Tier 2: Level/Outcome Selection**

For **Basic Towers & Harvesters** (relative to player's current level):
```
Castle 10, Gem, Basic Tower:
- Level -4:  10%
- Level -3:  15%
- Level -2:  35%
- Level -1:  30%
- Level 0:   10%
```

For **Hero XP** (fixed levels):
```
Castle 20, Gem, Hero XP:
- Level 1:   0%
- Level 2:   0%
- Level 3:   0%
- Level 4:   20%
- Level 5:   80%
```

**Tier 3: Type Selection** (Basic Towers & Harvesters only)
- Equal probability among all **unlocked** types
- Castle 1: 2 towers unlocked → 50% each (Spell, Bell)
- Castle 10: 6 towers unlocked → 16.67% each

### Purchase Limits (Column C)

**Gem Offers:**
```
Basic Tower (Level -4): 5
Basic Tower (Level -3): 5
Basic Tower (Level -2): 3
Basic Tower (Level -1): 2
Basic Tower (Level 0):  1
Harvester (all):        1
Hero XP (all):          3
```

**Gold Offers:**
```
Basic Tower (Level -4): 5
Basic Tower (Level -3): 3
Basic Tower (Level -2): 2
Basic Tower (Level -1): 1
Harvester (all):        1
Hero XP (all):          3
```

### Verified Examples

**Example 1: Castle 10, Gem, Level 6 Crystal Tower**
```
P(Basic Tower) = 40%
P(Level 0) = 10%           (Player has Crystal 6, offer is also 6)
P(Crystal | unlocked) = 16.67%  (6 tower types unlocked)
Total: 40% × 10% × 16.67% = 0.667%
Price: 113 gems (dynamic)
Limit: 1 purchase
```

**Example 2: Castle 20, Gem, Hero XP L5**
```
P(Hero XP) = 10%
P(Level 5) = 80%
Total: 10% × 80% = 8%
Price: 155 gems (base, no dynamic for Hero XP)
Limit: 3 purchases
```

**Example 3: Castle 10, Gold, Bell Tower L5**
```
P(Basic Tower) = 55%
P(Level -2) = 35%          (Player has Bell 7, offer is 5)
P(Bell | unlocked) = 16.67%
Total: 55% × 35% × 16.67% = 3.21%
Price: 429 Gold (57 gems × 1000/133, rounded up)
Limit: 2 purchases
```

---

## Shop Generation Algorithm

### Step-by-Step Process

**For each shop slot:**

1. **Determine Currency** (Gem or Gold) from slot template
2. **Roll Category** using castle-specific weights
3. **Roll Outcome** (level offset or fixed level)
4. **Roll Type** (if Basic Tower/Harvester, equal probability among unlocked)
5. **Calculate Level**:
   - Towers/Harvesters: `playerLevel + offset` (min -1)
   - Hero XP: Fixed level from outcome
6. **Get Price**:
   - Check dynamic pricing table (if Basic Tower/Harvester)
   - Apply gold conversion if needed (round up)
7. **Get Purchase Limit** from Item Selection
8. **Validate**: Skip if player hasn't unlocked this item type (Level 0)

### Special Cases

**Minimum Level Floor:**
- If calculated level < -1, set to -1
- Example: Castle 1 player rolls "Level -4" → actual level = -1

**Gold Harvesters:**
- All Gold Harvester outcomes = 0% (never offered)
- Only Gem slots can offer Harvesters

**Runes:**
- No level-based system defined yet
- Appears in both Gem and Gold pools

---

## Changelog

### 2026-04-08
- Initial context document created
- Analyzed tuning spreadsheet structure
- Identified data issues and balance concerns
- Documented item types, progression curves, and loot table format
- **Created web-based playtesting tool** with live shop preview
- **Integrated Item Pricing system** with dynamic pricing and UID mapping
- **Integrated Progression Map** for player unlock gating
- **Integrated Item Selection** with 3-tier probability system and purchase limits
- Verified calculations with multiple examples across different castle levels

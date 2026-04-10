# Daily Shop Generation - Technical Specification

**Last Updated**: 2026-04-09  
**Purpose**: Technical specification for implementing the Daily Shop generation system

---

## Overview

The Daily Shop generates personalized offers for each player based on:
1. **Castle Level** (1-20) - Player's progression
2. **Item Unlocks** - What items they have access to
3. **Probability Weights** - Category and level distributions
4. **Dynamic Pricing** - Castle-level adjusted costs

---

## Data Sources

### Primary Files

| File | Purpose | Key Columns |
|------|---------|-------------|
| `Item Pricing.xlsx` | Base prices & dynamic pricing | C=UID, G=BasePrice, N-AG=Castle1-20 |
| `Progression Map.xlsx` | Player unlock progression | D-I=Towers, J-O=Harvesters, P=Hero |
| `Item Selection.xlsx` | Probability weights & limits | Rows 3-13=Category, 16+=Outcomes, C=Limits |
| `Daily Shop Tuning (04-08-26).xlsx` | Slot templates (legacy) | Currently being replaced |

---

## Shop Generation Algorithm

### Input Parameters
```javascript
{
  castleLevel: number,      // 1-20
  slotCount: {
    gems: number,          // Number of gem-currency slots
    gold: number,          // Number of gold-currency slots
    free: number           // Number of free slots (Daily Chest)
  }
}
```

### Output Format
```javascript
{
  offers: [
    {
      uid: string,           // "Spell Tower", "Hero XP", etc.
      displayName: string,   // "Spell Cannon", "Hero XP"
      level: number,         // -1 to 20
      currency: string,      // "Gems" or "Gold"
      price: number,         // Final calculated price
      available: number,     // Purchase limit (1-5)
      category: string,      // "Basic Tower", "Harvester", "Hero XP", "Runes"
      probability: number    // For debugging/analytics
    }
  ]
}
```

---

## Step-by-Step Generation

### Step 1: Load Player Progression

```javascript
function getPlayerProgression(castleLevel) {
  // Read from Progression Map.xlsx, row matching castleLevel
  return {
    towers: {
      spellCannon: number,   // Column D
      bellTower: number,     // Column E
      crystalTower: number,  // Column F
      catapult: number,      // Column G (VoidTower)
      skyshot: number,       // Column H
      spinshot: number       // Column I
    },
    harvesters: {
      spellHarvester: number,   // Column J
      bellHarvester: number,    // Column K
      crystalHarvester: number, // Column L
      catapultHarvester: number,// Column M
      skyshotHarvester: number, // Column N
      spinshotHarvester: number // Column O
    },
    heroLevel: number,       // Column P
    heroXpPerLevel: number   // Column Q
  };
}
```

**Rule:** Any level = 0 means **not unlocked**

---

### Step 2: Generate Each Slot

For each slot (Gem or Gold currency):

#### 2A: Roll Category

```javascript
function rollCategory(castleLevel, currency) {
  // Read from Item Selection, rows 3-13
  const weights = {
    "Basic Tower": getCategoryWeight(castleLevel, currency, "Basic Tower"),
    "Harvester": getCategoryWeight(castleLevel, currency, "Harvester"),
    "Hero XP": getCategoryWeight(castleLevel, currency, "Hero XP"),
    "Runes": getCategoryWeight(castleLevel, currency, "Runes")
  };
  
  return weightedRandom(weights);
}
```

**Example (Castle 10, Gems):**
```javascript
{
  "Basic Tower": 0.40,  // 40%
  "Harvester": 0.20,    // 20%
  "Hero XP": 0.10,      // 10%
  "Runes": 0.30         // 30%
}
```

---

#### 2B: Roll Outcome (Level/Type)

**For Basic Towers & Harvesters:**

```javascript
function rollLevelOffset(castleLevel, currency, category) {
  // Read from Item Selection, rows 16+
  const weights = {
    "-4": getOutcomeWeight(castleLevel, currency, category, "Level -4"),
    "-3": getOutcomeWeight(castleLevel, currency, category, "Level -3"),
    "-2": getOutcomeWeight(castleLevel, currency, category, "Level -2"),
    "-1": getOutcomeWeight(castleLevel, currency, category, "Level -1"),
    "0": getOutcomeWeight(castleLevel, currency, category, "Level 0")
  };
  
  return weightedRandom(weights);
}
```

**Example (Castle 10, Gems, Basic Tower):**
```javascript
{
  "-4": 0.10,  // 10% - 4 levels below player
  "-3": 0.15,  // 15%
  "-2": 0.35,  // 35%
  "-1": 0.30,  // 30%
  "0": 0.10    // 10% - same level as player
}
```

**For Hero XP:**

```javascript
function rollHeroXpLevel(castleLevel, currency) {
  // Read from Item Selection, "Hero XP L1" through "Hero XP L5"
  const weights = {
    "1": getOutcomeWeight(castleLevel, currency, "Hero XP", "L1"),
    "2": getOutcomeWeight(castleLevel, currency, "Hero XP", "L2"),
    "3": getOutcomeWeight(castleLevel, currency, "Hero XP", "L3"),
    "4": getOutcomeWeight(castleLevel, currency, "Hero XP", "L4"),
    "5": getOutcomeWeight(castleLevel, currency, "Hero XP", "L5")
  };
  
  return weightedRandom(weights);
}
```

**Example (Castle 20, Gems, Hero XP):**
```javascript
{
  "1": 0.00,   // 0%
  "2": 0.00,   // 0%
  "3": 0.00,   // 0%
  "4": 0.20,   // 20%
  "5": 0.80    // 80%
}
```

---

#### 2C: Roll Tower/Harvester Type (If Applicable)

```javascript
function rollTowerType(playerProgression) {
  // Get list of unlocked tower types (level > 0)
  const unlocked = [];
  
  if (playerProgression.towers.spellCannon > 0) unlocked.push("Ballista");
  if (playerProgression.towers.bellTower > 0) unlocked.push("DartTower");
  if (playerProgression.towers.crystalTower > 0) unlocked.push("SniperTower");
  if (playerProgression.towers.catapult > 0) unlocked.push("VoidTower");
  if (playerProgression.towers.skyshot > 0) unlocked.push("SkyshotTower");
  if (playerProgression.towers.spinshot > 0) unlocked.push("NeedleTower");
  
  // Equal probability for all unlocked
  const probability = 1 / unlocked.length;
  return randomChoice(unlocked);
}
```

**Example (Castle 10):**
- 6 towers unlocked → 16.67% each
- 3 harvesters unlocked → 33.33% each

---

#### 2D: Calculate Final Level

```javascript
function calculateItemLevel(category, levelOffset, towerType, playerProgression) {
  if (category === "Hero XP") {
    // Hero XP uses fixed levels (1-5)
    return levelOffset; // This is actually the level, not an offset
  }
  
  if (category === "Basic Tower") {
    const playerLevel = playerProgression.towers[towerTypeToKey(towerType)];
    const calculatedLevel = playerLevel + parseInt(levelOffset);
    return Math.max(calculatedLevel, -1); // Floor at -1
  }
  
  if (category === "Harvester") {
    const playerLevel = playerProgression.harvesters[towerTypeToKey(towerType) + "Harvester"];
    const calculatedLevel = playerLevel + parseInt(levelOffset);
    return Math.max(calculatedLevel, -1); // Floor at -1
  }
  
  // Runes, etc.
  return 0;
}
```

**Examples:**
- Castle 10, Bell Tower, offset -2: `7 + (-2) = 5`
- Castle 1, Spell Tower, offset -4: `3 + (-4) = -1` (floored)
- Castle 20, Hero XP: `level = 5` (no offset calculation)

---

#### 2E: Get Price

```javascript
function getPrice(uid, level, castleLevel, currency) {
  // 1. Try to get dynamic price
  const dynamicPrice = getDynamicPrice(uid, level, castleLevel);
  
  // 2. Fall back to base price if no dynamic pricing
  const gemPrice = dynamicPrice || getBasePrice(uid, level);
  
  // 3. Convert to gold if needed
  if (currency === "Gold") {
    return Math.ceil(gemPrice * (1000 / 133));
  }
  
  return gemPrice;
}

function getDynamicPrice(uid, level, castleLevel) {
  // Read from Item Pricing.xlsx
  // Find row matching: Column C = uid, Level = level
  // Return value from column (N + castleLevel - 1)
  // Returns null if not found or if item doesn't have dynamic pricing
}

function getBasePrice(uid, level) {
  // Read from Item Pricing.xlsx
  // Find row matching: Column C = uid, Level = level
  // Return Column G value
}
```

**Examples:**
```javascript
// Bell Tower L5 @ Castle 10, Gems
getDynamicPrice("Bell Tower", 5, 10) → 57
getPrice("Bell Tower", 5, 10, "Gems") → 57

// Bell Tower L5 @ Castle 10, Gold
getPrice("Bell Tower", 5, 10, "Gold") → ceil(57 * 7.5188) → 429

// Hero XP L5 @ Castle 20, Gems (no dynamic pricing)
getDynamicPrice("Hero XP", 5, 20) → null
getBasePrice("Hero XP", 5) → 155
getPrice("Hero XP", 5, 20, "Gems") → 155
```

---

#### 2F: Get Purchase Limit

```javascript
function getPurchaseLimit(category, levelOffset, currency) {
  // Read from Item Selection.xlsx, Column C
  
  if (category === "Basic Tower") {
    return LIMITS.basicTower[currency][levelOffset];
  }
  
  if (category === "Harvester") {
    return 1; // All harvesters have limit 1
  }
  
  if (category === "Hero XP") {
    return 3; // All Hero XP have limit 3
  }
  
  return 1; // Default
}
```

**Reference Table:**
```javascript
const LIMITS = {
  basicTower: {
    Gems: { "-4": 5, "-3": 5, "-2": 3, "-1": 2, "0": 1 },
    Gold: { "-4": 5, "-3": 3, "-2": 2, "-1": 1, "0": 1 }
  },
  harvester: 1,
  heroXp: 3
};
```

---

#### 2G: Validate Unlock Status

```javascript
function isUnlocked(category, towerType, playerProgression) {
  if (category === "Hero XP" || category === "Runes") {
    return true; // Always available
  }
  
  if (category === "Basic Tower") {
    return playerProgression.towers[towerTypeToKey(towerType)] > 0;
  }
  
  if (category === "Harvester") {
    return playerProgression.harvesters[towerTypeToKey(towerType) + "Harvester"] > 0;
  }
  
  return false;
}
```

**Rule:** If `isUnlocked() === false`, skip this offer and re-roll.

---

### Step 3: Assemble Shop

```javascript
function generateDailyShop(castleLevel) {
  const progression = getPlayerProgression(castleLevel);
  const offers = [];
  
  // Generate gem slots (3 per day)
  for (let i = 0; i < 3; i++) {
    const offer = generateSlot(castleLevel, "Gems", progression);
    if (offer) offers.push(offer);
  }
  
  // Generate gold slots (2 per day)
  for (let i = 0; i < 2; i++) {
    const offer = generateSlot(castleLevel, "Gold", progression);
    if (offer) offers.push(offer);
  }
  
  // Add Daily Chest (free, starting at Castle 4)
  if (castleLevel >= 4) {
    offers.unshift({
      uid: "DailyChest",
      displayName: "Daily Chest",
      level: rollDailyChestLevel(), // Weighted 64/25/10/1
      currency: "Free",
      price: 0,
      available: 1,
      category: "Special"
    });
  }
  
  return { offers };
}
```

---

## Utility Functions

### Weighted Random Selection

```javascript
function weightedRandom(weights) {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * total;
  
  for (const [key, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) return key;
  }
  
  return Object.keys(weights)[0]; // Fallback
}
```

### UID Mapping

```javascript
const UID_TO_DISPLAY = {
  "Ballista": "Spell Cannon",
  "DartTower": "Bell Tower",
  "SniperTower": "Crystal Tower",
  "NeedleTower": "Spinshot Turret",
  "SkyshotTower": "Skyshot Tower",
  "VoidTower": "Catapult Tower",
  "Tree": "Ash Tree",
  "WildHeroXp": "Hero XP",
  "Mana": "Mana"
};

const TOWER_TYPE_TO_PROGRESSION_KEY = {
  "Ballista": "spellCannon",
  "DartTower": "bellTower",
  "SniperTower": "crystalTower",
  "VoidTower": "catapult",
  "SkyshotTower": "skyshot",
  "NeedleTower": "spinshot"
};
```

---

## Complete Example Walkthrough

**Scenario:** Castle Level 10 player, generating 1 Gem slot

### Execution

1. **Load Progression:**
   ```javascript
   progression = {
     towers: { spellCannon: 7, bellTower: 7, crystalTower: 6, catapult: 6, skyshot: 7, spinshot: 7 },
     harvesters: { spell: 3, bell: 3, crystal: 3, catapult: 3, skyshot: 0, spinshot: 0 }
   }
   ```

2. **Roll Category (Gems):**
   ```javascript
   rolled = weightedRandom({ Basic: 0.40, Harvester: 0.20, HeroXP: 0.10, Runes: 0.30 })
   → "Basic Tower"
   ```

3. **Roll Level Offset:**
   ```javascript
   rolled = weightedRandom({ "-4": 0.10, "-3": 0.15, "-2": 0.35, "-1": 0.30, "0": 0.10 })
   → "-2"
   ```

4. **Roll Tower Type:**
   ```javascript
   unlockedTowers = [Ballista, DartTower, SniperTower, VoidTower, SkyshotTower, NeedleTower]
   rolled = randomChoice(unlockedTowers)
   → "SniperTower" (Crystal Tower)
   ```

5. **Calculate Level:**
   ```javascript
   playerLevel = progression.towers.crystalTower = 6
   finalLevel = 6 + (-2) = 4
   ```

6. **Get Price:**
   ```javascript
   dynamicPrice = getDynamicPrice("Crystal Tower", 4, 10) = 29 gems
   currency = "Gems"
   finalPrice = 29
   ```

7. **Get Limit:**
   ```javascript
   limit = LIMITS.basicTower.Gems["-2"] = 3
   ```

8. **Validate Unlock:**
   ```javascript
   isUnlocked("Basic Tower", "SniperTower", progression) = true (level 6 > 0)
   ```

9. **Output:**
   ```javascript
   {
     uid: "SniperTower",
     displayName: "Crystal Tower",
     level: 4,
     currency: "Gems",
     price: 29,
     available: 3,
     category: "Basic Tower",
     probability: 0.40 × 0.35 × 0.1667 = 2.33%
   }
   ```

---

## Edge Cases & Special Rules

### 1. Level Floor
- Minimum level = -1
- If calculated level < -1, set to -1

### 2. Gold Harvesters
- All Gold Harvester probabilities = 0%
- Harvesters can ONLY appear in Gem slots

### 3. Hero XP Fixed Levels
- Hero XP does NOT use offset system
- Levels are fixed: 1, 2, 3, 4, 5
- Probability varies by castle level

### 4. Re-rolling Locked Items
- If generated item is locked (level 0 in progression), discard and re-roll
- Track attempts to prevent infinite loops (max 10 attempts)

### 5. Duplicate Prevention
- Shop should avoid showing duplicate offers (same UID + Level)
- If duplicate generated, re-roll

---

## Performance Considerations

### Pre-computation
- Load all Excel data into memory on startup
- Index by castle level for O(1) lookups
- Cache UID mappings

### Optimization
```javascript
// Pre-build probability distributions
const CATEGORY_WEIGHTS = {}; // [castleLevel][currency] → weights
const OUTCOME_WEIGHTS = {};  // [castleLevel][currency][category] → weights

// Pre-load pricing tables
const DYNAMIC_PRICES = {};   // [uid][level][castleLevel] → price
const BASE_PRICES = {};      // [uid][level] → price

// Pre-load progression
const PROGRESSIONS = {};     // [castleLevel] → progression object
```

---

## Testing Checklist

- [ ] Castle 1 player: Only shows unlocked items (Spell, Bell towers)
- [ ] Castle 10 player: Shows 6 tower types, 4 harvester types
- [ ] Gold never shows Harvesters
- [ ] Dynamic pricing applies correctly
- [ ] Gold conversion rounds up
- [ ] Level floor at -1 enforced
- [ ] Purchase limits match Item Selection
- [ ] Hero XP probabilities match castle level
- [ ] Daily Chest only appears at Castle 4+
- [ ] No duplicate offers in same shop

---

## Next Steps for Implementation

1. Create data loading module (read all 3 Excel files)
2. Build probability engine (weighted random functions)
3. Implement shop generation function
4. Create pricing calculator
5. Add validation layer (unlock checks)
6. Build UI integration (render offers)
7. Add purchase tracking system
8. Implement shop refresh logic

---

**End of Specification**

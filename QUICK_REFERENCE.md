# Daily Shop - Quick Reference Guide

**Last Updated**: 2026-04-09

---

## File Overview

| File | Purpose | When to Edit |
|------|---------|--------------|
| **Item Pricing.xlsx** | Base prices & dynamic pricing by castle level | Adjust economy, rebalance costs |
| **Progression Map.xlsx** | Player unlock progression | Change when items unlock |
| **Item Selection.xlsx** | Probability weights & purchase limits | Adjust shop variety, limit purchases |
| **Daily Shop Tuning (04-08-26).xlsx** | Legacy slot templates | Being phased out |

---

## Common Calculations

### Dynamic Price Lookup
**Question:** How much does a Level 5 Bell Tower cost for a Castle 10 player?

**Answer:**
1. Open `Item Pricing.xlsx`
2. Find row: "Bell Tower Lv5"
3. Look at Column W (Castle 10): **57 gems**

---

### Gold Conversion
**Question:** What's the gold price for 57 gems?

**Formula:**
```
Gold = ceil(Gems × (1000 / 133))
Gold = ceil(57 × 7.5188)
Gold = ceil(428.57)
Gold = 429
```

**Always round UP**

---

### Probability Calculation
**Question:** What's the chance a Castle 10 player sees a Level 4 Crystal Tower in a Gem slot?

**Steps:**
1. **Category probability** (Item Selection, Gems, Castle 10, Basic Tower): 40%
2. **Level offset** (Player has Level 6, offer is Level 4 = offset -2): 35%
3. **Tower type** (6 towers unlocked at Castle 10): 16.67%
4. **Total**: 40% × 35% × 16.67% = **2.33%**

---

## Item UID Mapping

When you see these UIDs in code, they display as:

| Internal UID | Display Name |
|--------------|--------------|
| Ballista | Spell Cannon |
| DartTower | Bell Tower |
| SniperTower | Crystal Tower |
| NeedleTower | Spinshot Turret |
| SkyshotTower | Skyshot Tower |
| VoidTower | Catapult Tower |
| Tree | Ash Tree |
| WildHeroXp | Hero XP |
| Mana | Mana |

---

## Progression Quick Lookup

### Castle 1
**Unlocked:** Spell Cannon (3), Bell Tower (3)  
**Locked:** Everything else

### Castle 5
**Unlocked:** All 4 basic towers, 3 harvesters (Spell, Bell, Crystal)  
**Locked:** Skyshot, Spinshot

### Castle 10
**Unlocked:** All 6 towers (Levels 6-7), 4 harvesters (Catapult unlocked)  
**Locked:** Skyshot/Spinshot harvesters

### Castle 20
**Unlocked:** Everything (Towers at 16, Harvesters at 12)

---

## Purchase Limits Cheat Sheet

### Gem Offers
```
Basic Tower -4 levels: 5 purchases
Basic Tower -3 levels: 5 purchases
Basic Tower -2 levels: 3 purchases
Basic Tower -1 levels: 2 purchases
Basic Tower same level: 1 purchase

All Harvesters: 1 purchase
All Hero XP: 3 purchases
```

### Gold Offers
```
Basic Tower -4 levels: 5 purchases
Basic Tower -3 levels: 3 purchases
Basic Tower -2 levels: 2 purchases
Basic Tower -1 levels: 1 purchase

All Hero XP: 3 purchases
```

**Note:** Gold NEVER offers Harvesters (0% probability)

---

## Category Probabilities (Castle 10)

### Gem Slots
```
Basic Tower:  40%
Harvester:    20%
Hero XP:      10%
Runes:        30%
```

### Gold Slots
```
Basic Tower:  55%
Harvester:    0%  (never)
Hero XP:      30%
Runes:        15%
```

---

## Level Offset Probabilities (Castle 10, Gems, Basic Tower)

```
-4 levels below: 10%
-3 levels below: 15%
-2 levels below: 35%  ← Most common
-1 levels below: 30%
Same level (0):  10%
```

**Pattern:** Players mostly see items slightly below their current level

---

## Hero XP Probabilities (Castle 20, Gems)

```
Level 1:  0%
Level 2:  0%
Level 3:  0%
Level 4: 20%
Level 5: 80%  ← Most common for late game
```

**Pattern:** Early game sees L2-L3, late game sees L4-L5

---

## Common Tuning Tasks

### "Make late-game towers more expensive"
1. Open `Item Pricing.xlsx`
2. Find tower rows (Levels 10-20)
3. Edit Columns N-AG (dynamic prices for Castle 1-20)
4. Refresh shop tool to test

### "Players should see more variety"
1. Open `Item Selection.xlsx`
2. Reduce weight on most common category
3. Increase weight on underrepresented categories
4. Test probability changes

### "Unlock Skyshot earlier"
1. Open `Progression Map.xlsx`
2. Find row for target Castle Level
3. Change Skyshot tower column from 0 → desired level
4. Players will start seeing Skyshot offers

### "Increase purchase limits"
1. Open `Item Selection.xlsx`
2. Edit Column C (Limit) for desired outcome
3. Changes apply immediately

---

## Validation Rules

✅ **Always check before adding items to shop:**
- Player has unlocked the item type (level > 0)
- Price is > 0
- Purchase limit is ≥ 1
- Level is ≥ -1

❌ **Never show:**
- Items the player hasn't unlocked
- Duplicate offers (same UID + level)
- Invalid level offsets (below -1 floor)

---

## Testing Scenarios

### Scenario 1: Early Game Player (Castle 1-3)
- Should only see Spell Cannon and Bell Tower
- No harvesters
- Mostly Level -1, 0, 1 items
- Low gem costs (< 50)

### Scenario 2: Mid Game Player (Castle 10)
- 6 tower types available
- 4 harvester types in Gem slots
- Mix of levels (-2 most common)
- Gem costs: 10-100 range

### Scenario 3: Late Game Player (Castle 20)
- All items unlocked
- Higher level items (10-16)
- Hero XP L5 dominates (80%)
- Gem costs: 50-500+ range

---

## Troubleshooting

**Problem:** Player keeps seeing same items

**Solution:** Check Item Selection weights - may be too concentrated on one category

---

**Problem:** Prices seem wrong

**Solution:** 
1. Check if dynamic pricing exists (Columns N-AG in Item Pricing)
2. Verify castle level column is correct
3. For Gold, ensure conversion is rounding UP

---

**Problem:** Player sees locked items

**Solution:** Check Progression Map - item level must be > 0 for castle level

---

**Problem:** Purchase limits not working

**Solution:** Verify Column C in Item Selection has the correct limit value

---

## File Locations

```
Spire_Shop/
├── Item Pricing.xlsx          # Pricing & dynamic costs
├── Progression Map.xlsx       # Player unlocks
├── Item Selection.xlsx        # Probabilities & limits
├── Daily Shop Tuning (04-08-26).xlsx  # Legacy
├── PROJECT_CONTEXT.md         # Full documentation
├── SHOP_GENERATION_SPEC.md   # Technical spec
└── QUICK_REFERENCE.md        # This file
```

---

## Need More Details?

- **Full Context:** See `PROJECT_CONTEXT.md`
- **Implementation Guide:** See `SHOP_GENERATION_SPEC.md`
- **Code:** See `shop-data.js` and `shop.js`

---

**End of Quick Reference**

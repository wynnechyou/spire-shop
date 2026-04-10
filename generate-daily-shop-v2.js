const XLSX = require('xlsx');

// Load all data files
const itemSelectionWb = XLSX.readFile('Item Selection.xlsx');
const itemSelectionWs = itemSelectionWb.Sheets[itemSelectionWb.SheetNames[0]];

const itemPricingWb = XLSX.readFile('Item Pricing.xlsx');
const itemPricingWs = itemPricingWb.Sheets[itemPricingWb.SheetNames[0]];
const pricingData = XLSX.utils.sheet_to_json(itemPricingWs, { header: 1 });

const progressionWb = XLSX.readFile('Progression Map.xlsx');
const progressionWs = progressionWb.Sheets[progressionWb.SheetNames[0]];
const progressionData = XLSX.utils.sheet_to_json(progressionWs, { header: 1 });

// No UID mapping needed - Item Pricing uses game UIDs directly

const TOWER_TYPES = ['Ballista', 'DartTower', 'SniperTower', 'NeedleTower', 'SkyshotTower', 'VoidTower'];
const HARVESTER_TYPES = ['Tree'];
const RUNE_TYPES = [
    'DamageRune', 'RangeRune', 'AttackSpeedRune', 'PierceDodgeRune',
    'CriticalRune', 'PierceArmorRune', 'ExtraTargetsRune', 'DamageOverkillRune',
    'DamageCroakersRune', 'DamageHarpiesRune', 'DamageTrollsRune', 'DamagePillbugsRune',
    'DamageWangsRune', 'DamageSpittersRune', 'DamageHealersRune'
];

// Parse progression data
const playerProgression = {};
for (let i = 1; i < progressionData.length; i++) {
    const row = progressionData[i];
    const castleLevel = row[0];
    if (!castleLevel) continue;

    playerProgression[castleLevel] = {
        towers: {
            Ballista: row[3] || 0,
            DartTower: row[4] || 0,
            SniperTower: row[5] || 0,
            VoidTower: row[6] || 0,
            SkyshotTower: row[7] || 0,
            NeedleTower: row[8] || 0
        },
        harvesters: {
            Tree: row[9] || 0
        },
        heroLevel: row[15] || 0
    };
}

// Helper to get cell value from Item Selection
function getSelectionValue(row, castleLevel) {
    const col = 3 + (castleLevel - 1); // Column D = 3
    const cell = itemSelectionWs[XLSX.utils.encode_cell({ r: row, c: col })];
    return cell ? (cell.v || 0) : 0;
}

// Helper to get item price
function getItemPrice(itemId, level, castleLevel, currency) {
    // Map game UID to pricing UID
    let pricingUid = itemId;

    // Harvesters (Tree) - map level to Ash Tree stages
    if (itemId === 'Tree') {
        const ashTreeStages = {
            '-1': 'Ash Seed', // Level -1 doesn't exist in pricing, use Ash Seed
            '0': 'Ash Seed',
            '1': 'Bare Ash Tree',
            '2': 'Leafy Ash Tree',
            '3': 'Lush Ash Tree',
            '4': 'Radiant Ash Tree'
            // Levels 5+ have no pricing data, will return 0
        };
        pricingUid = ashTreeStages[level] || 'Radiant Ash Tree'; // Use highest tier as fallback
        // For Ash Tree, the level in pricing data is the stage (0-4), not the actual level
        level = Math.min(level, 4); // Cap at level 4
        level = Math.max(level, 0); // Floor at level 0
    }
    // Hero XP - special case, match by level only (UID in pricing is XP amount)
    else if (itemId === 'Hero XP') {
        const xpAmounts = { 1: 3, 2: 10, 3: 35, 4: 120, 5: 385 };
        pricingUid = xpAmounts[level];
    }
    // Runes - use 'Rune' UID for generic star tiers
    else if (itemId === 'Rune') {
        pricingUid = 'Rune';
    }
    // Specific rune types
    else if (itemId.endsWith('Rune')) {
        const runeMap = {
            'DamageRune': 'Damage Rune',
            'RangeRune': 'Range Rune',
            'AttackSpeedRune': 'Attack Speed Rune',
            'CriticalRune': 'Crit Rune'
        };
        pricingUid = runeMap[itemId] || 'Rune';
    }

    // Find item in pricing data
    for (let i = 1; i < pricingData.length; i++) {
        const row = pricingData[i];
        const uid = row[2]; // Column C
        const itemLevel = row[3]; // Column D

        if (uid === pricingUid && itemLevel === level) {
            // Try dynamic price first (starting at index 12 for Castle 1)
            const dynamicPriceCol = 11 + castleLevel; // Castle 1 = 12, Castle 10 = 21, etc.
            const dynamicPrice = row[dynamicPriceCol];

            if (dynamicPrice && dynamicPrice > 0) {
                // Convert to gold if needed
                if (currency === 'Gold') {
                    return Math.ceil(dynamicPrice * (1000 / 133));
                }
                return dynamicPrice;
            }

            // Fall back to base price (Column F, index 5)
            const basePrice = row[5];
            if (basePrice && basePrice > 0) {
                if (currency === 'Gold') {
                    return Math.ceil(basePrice * (1000 / 133));
                }
                return basePrice;
            }
        }
    }

    return 0;
}

// Generate loot table entries for a castle level and currency
function generateLootTable(castleLevel, currency) {
    const entries = [];
    const currencyName = currency === 'Diamonds' ? 'Gems' : 'Gold';

    // Get category probabilities
    const categoryRows = {
        'Basic Tower': currency === 'Diamonds' ? 2 : 7,
        'Harvester': currency === 'Diamonds' ? 3 : 8,
        'Hero XP': currency === 'Diamonds' ? 4 : 9,
        'Runes': currency === 'Diamonds' ? 5 : 10
    };

    const categoryWeights = {};
    for (const [category, row] of Object.entries(categoryRows)) {
        categoryWeights[category] = getSelectionValue(row, castleLevel);
    }

    // BASIC TOWERS
    if (categoryWeights['Basic Tower'] > 0) {
        const levelOffsets = [-4, -3, -2, -1, 0];
        const offsetRows = currency === 'Diamonds' ?
            { '-4': 14, '-3': 15, '-2': 16, '-1': 17, '0': 18 } :
            { '-4': 37, '-3': 38, '-2': 39, '-1': 40, '0': 41 };

        for (const offset of levelOffsets) {
            const outcomeWeight = getSelectionValue(offsetRows[offset], castleLevel);
            if (outcomeWeight === 0) continue;

            // Get unlocked tower types
            const prog = playerProgression[castleLevel];
            const unlockedTowers = TOWER_TYPES.filter(t => prog.towers[t] > 0);
            const typeWeight = unlockedTowers.length > 0 ? 1 / unlockedTowers.length : 0;

            for (const towerType of unlockedTowers) {
                const playerLevel = prog.towers[towerType];
                let itemLevel = playerLevel + parseInt(offset);
                itemLevel = Math.max(itemLevel, -1); // Floor at -1

                const weight = categoryWeights['Basic Tower'] * outcomeWeight * typeWeight * 1000;
                const price = getItemPrice(towerType, itemLevel, castleLevel, currency);

                // Get purchase limit
                const limitRow = offsetRows[offset];
                const limit = itemSelectionWs[XLSX.utils.encode_cell({ r: limitRow, c: 2 })]?.v || 1;

                entries.push({
                    weight: Math.round(weight),
                    result: `${towerType}{Level=${itemLevel}}{Cost=${price}}{Currency=${currency}}{Available=${limit}}`
                });
            }
        }
    }

    // HARVESTERS
    if (categoryWeights['Harvester'] > 0) {
        const levelOffsets = [-4, -3, -2, -1, 0];
        const offsetRows = currency === 'Diamonds' ?
            { '-4': 19, '-3': 20, '-2': 21, '-1': 22, '0': 23 } :
            { '-4': 42, '-3': 43, '-2': 44, '-1': 45, '0': 46 };

        for (const offset of levelOffsets) {
            const outcomeWeight = getSelectionValue(offsetRows[offset], castleLevel);
            if (outcomeWeight === 0) continue;

            const prog = playerProgression[castleLevel];
            const unlockedHarvesters = HARVESTER_TYPES.filter(h => prog.harvesters[h] > 0);
            const typeWeight = unlockedHarvesters.length > 0 ? 1 / unlockedHarvesters.length : 0;

            for (const harvesterType of unlockedHarvesters) {
                const playerLevel = prog.harvesters[harvesterType];
                let itemLevel = playerLevel + parseInt(offset);
                itemLevel = Math.max(itemLevel, -1);

                const weight = categoryWeights['Harvester'] * outcomeWeight * typeWeight * 1000;
                const price = getItemPrice(harvesterType, itemLevel, castleLevel, currency);

                const limitRow = offsetRows[offset];
                const limit = itemSelectionWs[XLSX.utils.encode_cell({ r: limitRow, c: 2 })]?.v || 1;

                entries.push({
                    weight: Math.round(weight),
                    result: `${harvesterType}{Level=${itemLevel}}{Cost=${price}}{Currency=${currency}}{Available=${limit}}`
                });
            }
        }
    }

    // HERO XP
    if (categoryWeights['Hero XP'] > 0) {
        const heroLevels = [1, 2, 3, 4, 5];
        const heroRows = currency === 'Diamonds' ?
            { 1: 24, 2: 25, 3: 26, 4: 27, 5: 28 } :
            { 1: 47, 2: 48, 3: 49, 4: 50, 5: 51 };

        for (const level of heroLevels) {
            const outcomeWeight = getSelectionValue(heroRows[level], castleLevel);
            if (outcomeWeight === 0) continue;

            const weight = categoryWeights['Hero XP'] * outcomeWeight * 1000;
            const price = getItemPrice('Hero XP', level, castleLevel, currency);

            const limitRow = heroRows[level];
            const limit = itemSelectionWs[XLSX.utils.encode_cell({ r: limitRow, c: 2 })]?.v || 3;

            entries.push({
                weight: Math.round(weight),
                result: `WildHeroXp{Level=${level}}{Cost=${price}}{Currency=${currency}}{Available=${limit}}`
            });
        }
    }

    // RUNES
    if (categoryWeights['Runes'] > 0) {
        // Rune tiers
        const runeTiers = [1, 2, 3, 4, 5];
        const runeRows = currency === 'Diamonds' ?
            { 1: 29, 2: 30, 3: 31, 4: 32, 5: 33 } :
            { 1: 52, 2: 53, 3: 54, 4: 55, 5: 56 };

        for (const tier of runeTiers) {
            const outcomeWeight = getSelectionValue(runeRows[tier], castleLevel);
            if (outcomeWeight === 0) continue;

            const typeWeight = 1 / RUNE_TYPES.length;

            for (const runeType of RUNE_TYPES) {
                const weight = categoryWeights['Runes'] * outcomeWeight * typeWeight * 1000;
                const price = getItemPrice('Rune', tier, castleLevel, currency);

                const limitRow = runeRows[tier];
                const limit = itemSelectionWs[XLSX.utils.encode_cell({ r: limitRow, c: 2 })]?.v || 1;

                entries.push({
                    weight: Math.round(weight),
                    result: `${runeType}{Level=${tier}}{Cost=${price}}{Currency=${currency}}{Available=${limit}}`
                });
            }
        }

        // Rune Dust
        const dustAmounts = [50, 250, 500];
        const dustRows = currency === 'Diamonds' ?
            { 50: 34, 250: 35, 500: 36 } :
            { 50: 57, 250: 58, 500: 59 };

        for (const amount of dustAmounts) {
            const outcomeWeight = getSelectionValue(dustRows[amount], castleLevel);
            if (outcomeWeight === 0) continue;

            const weight = categoryWeights['Runes'] * outcomeWeight * 1000;

            // Calculate Rune Dust price: 100 units = 13 gems
            const gemPrice = Math.ceil((amount / 100) * 13);
            const price = currency === 'Gold' ? Math.ceil(gemPrice * (1000 / 133)) : gemPrice;

            const limitRow = dustRows[amount];
            const limit = itemSelectionWs[XLSX.utils.encode_cell({ r: limitRow, c: 2 })]?.v || 1;

            entries.push({
                weight: Math.round(weight),
                result: `RuneDust{Level=${amount}}{Cost=${price}}{Currency=${currency}}{Available=${limit}}`
            });
        }
    }

    return entries;
}

// Build the output data
const outputData = [];

// Header row
outputData.push(['Node', '[Index]', 'Weight', 'Quantity', 'Result']);

// ROOT entries
outputData.push(['ROOT', 1, 1, 1, '<ROOT_$IslandIndex$>']);
outputData.push(['ROOT_0', 1, 1, 1, '<Items_$CastleLevel$>, <Bonus_$CastleLevel$>{Bonus=true}']);

// Items configurations (slot templates)
// PLAYTESTING VERSION: 20 slots instead of 6 for better testing
for (let castle = 1; castle <= 20; castle++) {
    let slotConfig = '';

    // Castle 4+ gets Daily Chest
    if (castle >= 4) {
        slotConfig = '<DailyChest>,';
    }

    // Generate 40 slots alternating between Gold and Diamond for variety
    const slots = [];
    for (let i = 0; i < 40; i++) {
        slots.push(i % 2 === 0 ? '<Gold_$CastleLevel$>' : '<Dia_$CastleLevel$>');
    }
    slotConfig += slots.join(',');

    outputData.push([`Items_${castle}`, 1, 1, 1, slotConfig]);
}

// Daily Chest (reuse from original)
outputData.push(['DailyChest', 1, 64, 1, 'DailyChest{Level=1}{Cost=0}{Available=1}']);
outputData.push(['DailyChest', 2, 25, 1, 'DailyChest{Level=2}{Cost=0}{Available=1}']);
outputData.push(['DailyChest', 3, 10, 1, 'DailyChest{Level=3}{Cost=0}{Available=1}']);
outputData.push(['DailyChest', 4, 1, 1, 'DailyChest{Level=4}{Cost=0}{Available=1}']);

// Bonus items (simplified - one per castle level)
for (let castle = 1; castle <= 20; castle++) {
    outputData.push([`Bonus_${castle}`, 1, 1, 1, `Ballista{Level=1}{Available=1}`]);
}

// Generate Diamond and Gold loot tables for each castle level
for (let castle = 1; castle <= 20; castle++) {
    console.log(`Generating Castle ${castle}...`);

    // Diamond loot table
    const diaEntries = generateLootTable(castle, 'Diamonds');
    diaEntries.forEach((entry, idx) => {
        outputData.push([`Dia_${castle}`, idx + 1, entry.weight, 1, entry.result]);
    });

    // Gold loot table
    const goldEntries = generateLootTable(castle, 'Gold');
    goldEntries.forEach((entry, idx) => {
        outputData.push([`Gold_${castle}`, idx + 1, entry.weight, 1, entry.result]);
    });
}

// Create new workbook
const newWb = XLSX.utils.book_new();
const newWs = XLSX.utils.aoa_to_sheet(outputData);

// Add to workbook
XLSX.utils.book_append_sheet(newWb, newWs, 'Sheet1');

// Write file
XLSX.writeFile(newWb, 'Daily Shop Tuning v2.xlsx');

console.log('\n✅ Generated: Daily Shop Tuning v2.xlsx');
console.log(`Total rows: ${outputData.length}`);

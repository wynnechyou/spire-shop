const XLSX = require('xlsx');

// Read Daily Shop Tuning
const dailyShopWb = XLSX.readFile('Daily Shop Tuning (04-08-26).xlsx');
const dailyShopWs = dailyShopWb.Sheets[dailyShopWb.SheetNames[0]];
const dailyShopData = XLSX.utils.sheet_to_json(dailyShopWs, { header: 1 });

// Read Progression Map for player levels
const progressionWb = XLSX.readFile('Progression Map.xlsx');
const progressionWs = progressionWb.Sheets[progressionWb.SheetNames[0]];
const progressionData = XLSX.utils.sheet_to_json(progressionWs, { header: 1 });

// Parse progression data
const playerProgression = {};
for (let i = 1; i < progressionData.length; i++) {
    const row = progressionData[i];
    const castleLevel = row[0];
    if (!castleLevel) continue;

    playerProgression[castleLevel] = {
        spellCannon: row[3] || 0,
        bellTower: row[4] || 0,
        crystalTower: row[5] || 0,
        catapult: row[6] || 0,
        skyshot: row[7] || 0,
        spinshot: row[8] || 0,
        heroLevel: row[15] || 0
    };
}

// Parse Daily Shop data into loot tables
const lootTables = {};
const slotConfigs = {};

for (let i = 1; i < dailyShopData.length; i++) {
    const row = dailyShopData[i];
    if (!row || row.length === 0) continue;

    const node = row[0];
    const weight = parseInt(row[2]) || 1;
    const result = row[4];

    if (!node || !result) continue;

    // Parse slot configs (Items_1 through Items_20)
    if (node.startsWith('Items_')) {
        const castleLevel = parseInt(node.replace('Items_', ''));
        const slots = result.split(',').map(s => s.trim().replace(/[<>]/g, ''));
        slotConfigs[castleLevel] = slots;
    }
    // Parse loot tables
    else if (node.startsWith('Dia_') || node.startsWith('Gold_')) {
        if (!lootTables[node]) {
            lootTables[node] = [];
        }
        lootTables[node].push({
            weight: weight,
            item: parseItemDefinition(result)
        });
    }
}

function parseItemDefinition(itemString) {
    if (!itemString) return null;

    const match = itemString.match(/^([^{]+)/);
    if (!match) return null;

    const itemId = match[1].trim();
    const props = {};
    const propMatches = itemString.matchAll(/\{(\w+)=([^}]+)\}/g);
    for (const propMatch of propMatches) {
        const key = propMatch[1];
        const value = propMatch[2];
        if (key === 'Level' || key === 'Cost' || key === 'Available') {
            props[key] = parseInt(value) || 0;
        } else {
            props[key] = value;
        }
    }

    return {
        id: itemId,
        level: props.Level || 0,
        currency: props.Currency || 'Gold',
        ...props
    };
}

// Categorize items
function categorizeItem(itemId) {
    const towers = ['Ballista', 'DartTower', 'SniperTower', 'NeedleTower', 'SkyshotTower', 'VoidTower'];
    const harvesters = ['Tree'];
    const heroXp = ['WildHeroXp'];

    if (towers.includes(itemId)) return 'Basic Tower';
    if (harvesters.includes(itemId)) return 'Harvester';
    if (heroXp.includes(itemId)) return 'Hero XP';
    if (itemId === 'Mana') return 'Mana';
    return 'Other';
}

// Get player's current level for an item
function getPlayerLevel(itemId, castleLevel) {
    const prog = playerProgression[castleLevel];
    if (!prog) return 0;

    const mapping = {
        'Ballista': prog.spellCannon,
        'DartTower': prog.bellTower,
        'SniperTower': prog.crystalTower,
        'VoidTower': prog.catapult,
        'SkyshotTower': prog.skyshot,
        'NeedleTower': prog.spinshot,
        'Tree': 0, // Harvester - simplified
        'WildHeroXp': prog.heroLevel
    };

    return mapping[itemId] || 0;
}

// Calculate level offset
function getLevelOffset(itemLevel, playerLevel) {
    return itemLevel - playerLevel;
}

// Analyze shop for each castle level
const analysis = {};

for (let castleLevel = 1; castleLevel <= 20; castleLevel++) {
    const slots = slotConfigs[castleLevel];
    if (!slots) continue;

    analysis[castleLevel] = {
        gems: { categories: {}, outcomes: {} },
        gold: { categories: {}, outcomes: {} }
    };

    // Analyze each slot
    for (const slotRef of slots) {
        // Skip bonus slots
        if (slotRef.includes('Bonus')) continue;
        if (slotRef === 'DailyChest') continue;

        // Determine currency
        const currency = slotRef.startsWith('Dia_') ? 'gems' : 'gold';
        const tableRef = slotRef.replace('$CastleLevel$', castleLevel);
        const lootTable = lootTables[tableRef];

        if (!lootTable || lootTable.length === 0) continue;

        // Calculate total weight
        const totalWeight = lootTable.reduce((sum, entry) => sum + entry.weight, 0);

        // Analyze each item in loot table
        for (const entry of lootTable) {
            const item = entry.item;
            if (!item) continue;

            const category = categorizeItem(item.id);
            const probability = entry.weight / totalWeight;

            // Add to category counts
            if (!analysis[castleLevel][currency].categories[category]) {
                analysis[castleLevel][currency].categories[category] = 0;
            }
            analysis[castleLevel][currency].categories[category] += probability;

            // Calculate level offset for towers/harvesters
            if (category === 'Basic Tower' || category === 'Harvester') {
                const playerLevel = getPlayerLevel(item.id, castleLevel);
                const offset = getLevelOffset(item.level, playerLevel);
                const offsetKey = `Level ${offset >= 0 ? offset : offset}`;

                if (!analysis[castleLevel][currency].outcomes[category]) {
                    analysis[castleLevel][currency].outcomes[category] = {};
                }
                if (!analysis[castleLevel][currency].outcomes[category][offsetKey]) {
                    analysis[castleLevel][currency].outcomes[category][offsetKey] = 0;
                }
                analysis[castleLevel][currency].outcomes[category][offsetKey] += probability;
            }
            // Hero XP levels
            else if (category === 'Hero XP') {
                const levelKey = `L${item.level}`;
                if (!analysis[castleLevel][currency].outcomes[category]) {
                    analysis[castleLevel][currency].outcomes[category] = {};
                }
                if (!analysis[castleLevel][currency].outcomes[category][levelKey]) {
                    analysis[castleLevel][currency].outcomes[category][levelKey] = 0;
                }
                analysis[castleLevel][currency].outcomes[category][levelKey] += probability;
            }
        }
    }
}

// Normalize probabilities (since we're averaging across multiple slots)
for (let castleLevel = 1; castleLevel <= 20; castleLevel++) {
    const data = analysis[castleLevel];
    if (!data) continue;

    ['gems', 'gold'].forEach(currency => {
        const currencyData = data[currency];

        // Normalize categories to sum to 1.0
        const categoryTotal = Object.values(currencyData.categories).reduce((sum, v) => sum + v, 0);
        if (categoryTotal > 0) {
            Object.keys(currencyData.categories).forEach(cat => {
                currencyData.categories[cat] /= categoryTotal;
            });
        }

        // Normalize outcomes within each category
        Object.keys(currencyData.outcomes).forEach(category => {
            const outcomeTotal = Object.values(currencyData.outcomes[category]).reduce((sum, v) => sum + v, 0);
            if (outcomeTotal > 0) {
                Object.keys(currencyData.outcomes[category]).forEach(outcome => {
                    currencyData.outcomes[category][outcome] /= outcomeTotal;
                });
            }
        });
    });
}

// Output results
console.log('=== DAILY SHOP TUNING ANALYSIS ===\n');

for (let castleLevel = 1; castleLevel <= 20; castleLevel++) {
    const data = analysis[castleLevel];
    if (!data) continue;

    console.log(`\nCastle Level ${castleLevel}:`);
    console.log('GEM SLOTS:');
    console.log('  Categories:', JSON.stringify(data.gems.categories, null, 2));
    console.log('  Outcomes:', JSON.stringify(data.gems.outcomes, null, 2));

    console.log('GOLD SLOTS:');
    console.log('  Categories:', JSON.stringify(data.gold.categories, null, 2));
    console.log('  Outcomes:', JSON.stringify(data.gold.outcomes, null, 2));
}

// Now write to Item Selection - Fill Out.xlsx
const fillOutWb = XLSX.readFile('Item Selection - Fill Out.xlsx');
const fillOutWs = fillOutWb.Sheets[fillOutWb.SheetNames[0]];

// Helper to write cell
function writeCell(row, col, value) {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
    fillOutWs[cellRef] = { t: 'n', v: value, z: '0%' };
}

// Write category probabilities (Rows 3-12, Columns D-W = Castle 1-20)
for (let castleLevel = 1; castleLevel <= 20; castleLevel++) {
    const data = analysis[castleLevel];
    if (!data) continue;

    const col = 3 + castleLevel - 1; // Column D = 3, E = 4, etc.

    // Gem categories (rows 3-7)
    writeCell(2, col, data.gems.categories['Basic Tower'] || 0);  // Row 3 (0-indexed = 2)
    writeCell(3, col, data.gems.categories['Harvester'] || 0);    // Row 4
    writeCell(4, col, data.gems.categories['Hero XP'] || 0);       // Row 5
    writeCell(5, col, 0);  // Runes                                 // Row 6
    writeCell(6, col, data.gems.categories['Other'] || data.gems.categories['Mana'] || 0); // Row 7

    // Gold categories (rows 8-12)
    writeCell(7, col, data.gold.categories['Basic Tower'] || 0);   // Row 8
    writeCell(8, col, data.gold.categories['Harvester'] || 0);     // Row 9
    writeCell(9, col, data.gold.categories['Hero XP'] || 0);        // Row 10
    writeCell(10, col, 0); // Runes                                  // Row 11
    writeCell(11, col, data.gold.categories['Other'] || data.gold.categories['Mana'] || 0); // Row 12
}

// Write outcome probabilities (Rows 15+, Columns D-W)
for (let castleLevel = 1; castleLevel <= 20; castleLevel++) {
    const data = analysis[castleLevel];
    if (!data) continue;

    const col = 3 + castleLevel - 1;

    // Gem Basic Tower outcomes (rows 15-19)
    const gemBasicTower = data.gems.outcomes['Basic Tower'] || {};
    writeCell(14, col, gemBasicTower['Level -4'] || 0);  // Row 15
    writeCell(15, col, gemBasicTower['Level -3'] || 0);  // Row 16
    writeCell(16, col, gemBasicTower['Level -2'] || 0);  // Row 17
    writeCell(17, col, gemBasicTower['Level -1'] || 0);  // Row 18
    writeCell(18, col, gemBasicTower['Level 0'] || 0);   // Row 19

    // Gem Harvester outcomes (rows 20-24)
    const gemHarvester = data.gems.outcomes['Harvester'] || {};
    writeCell(19, col, gemHarvester['Level -4'] || 0);   // Row 20
    writeCell(20, col, gemHarvester['Level -3'] || 0);   // Row 21
    writeCell(21, col, gemHarvester['Level -2'] || 0);   // Row 22
    writeCell(22, col, gemHarvester['Level -1'] || 0);   // Row 23
    writeCell(23, col, gemHarvester['Level 0'] || 0);    // Row 24

    // Gem Hero XP outcomes (rows 25-29)
    const gemHeroXp = data.gems.outcomes['Hero XP'] || {};
    writeCell(24, col, gemHeroXp['L1'] || 0);  // Row 25
    writeCell(25, col, gemHeroXp['L2'] || 0);  // Row 26
    writeCell(26, col, gemHeroXp['L3'] || 0);  // Row 27
    writeCell(27, col, gemHeroXp['L4'] || 0);  // Row 28
    writeCell(28, col, gemHeroXp['L5'] || 0);  // Row 29

    // Gem Runes (row 30)
    writeCell(29, col, 0);  // Row 30

    // Gold Basic Tower outcomes (rows 31-35)
    const goldBasicTower = data.gold.outcomes['Basic Tower'] || {};
    writeCell(30, col, goldBasicTower['Level -4'] || 0);  // Row 31
    writeCell(31, col, goldBasicTower['Level -3'] || 0);  // Row 32
    writeCell(32, col, goldBasicTower['Level -2'] || 0);  // Row 33
    writeCell(33, col, goldBasicTower['Level -1'] || 0);  // Row 34
    writeCell(34, col, goldBasicTower['Level 0'] || 0);   // Row 35

    // Gold Harvester outcomes (rows 36-40)
    const goldHarvester = data.gold.outcomes['Harvester'] || {};
    writeCell(35, col, goldHarvester['Level -4'] || 0);   // Row 36
    writeCell(36, col, goldHarvester['Level -3'] || 0);   // Row 37
    writeCell(37, col, goldHarvester['Level -2'] || 0);   // Row 38
    writeCell(38, col, goldHarvester['Level -1'] || 0);   // Row 39
    writeCell(39, col, goldHarvester['Level 0'] || 0);    // Row 40

    // Gold Hero XP outcomes (rows 41-45)
    const goldHeroXp = data.gold.outcomes['Hero XP'] || {};
    writeCell(40, col, goldHeroXp['L1'] || 0);  // Row 41
    writeCell(41, col, goldHeroXp['L2'] || 0);  // Row 42
    writeCell(42, col, goldHeroXp['L3'] || 0);  // Row 43
    writeCell(43, col, goldHeroXp['L4'] || 0);  // Row 44
    writeCell(44, col, goldHeroXp['L5'] || 0);  // Row 45

    // Gold Runes (row 46)
    writeCell(45, col, 0);  // Row 46
}

// Write the file
XLSX.writeFile(fillOutWb, 'Item Selection - Filled.xlsx');
console.log('\n\n✅ Written to: Item Selection - Filled.xlsx');

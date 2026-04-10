// Shop Data Parser and Manager

class ShopDataManager {
    constructor() {
        this.rawData = null;
        this.slotConfigs = {}; // Items_1 through Items_20
        this.lootTables = {}; // Dia_1, Gold_1, DailyChest, etc.
        this.bonusTables = {}; // Bonus_1 through Bonus_20
    }

    async loadFromExcel(filePath) {
        try {
            const response = await fetch(filePath);
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            this.rawData = data;
            this.parseData(data);

            console.log('✅ Shop data loaded successfully');
            console.log('Slot Configs:', Object.keys(this.slotConfigs).length);
            console.log('Loot Tables:', Object.keys(this.lootTables).length);

            return true;
        } catch (error) {
            console.error('❌ Error loading shop data:', error);
            return false;
        }
    }

    async loadFromGoogleSheets(sheetId, gid, name = 'data') {
        try {
            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
            console.log(`📊 Loading ${name} from Google Sheets...`);
            console.log(`📎 URL: ${csvUrl}`);

            const response = await fetch(csvUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}. Make sure the Google Sheet is publicly accessible (Share → Anyone with the link can view)`);
            }

            const csvText = await response.text();

            if (!csvText || csvText.length < 10) {
                throw new Error('Empty or invalid response from Google Sheets');
            }

            // Parse CSV using xlsx library
            const workbook = XLSX.read(csvText, { type: 'string' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (!data || data.length === 0) {
                throw new Error('No data found in Google Sheets response');
            }

            this.rawData = data;
            this.parseData(data);

            console.log(`✅ ${name} loaded from Google Sheets successfully!`);
            console.log(`   Rows loaded: ${data.length}`);
            console.log('   Slot Configs:', Object.keys(this.slotConfigs).length);
            console.log('   Loot Tables:', Object.keys(this.lootTables).length);

            return true;
        } catch (error) {
            console.error(`❌ Error loading ${name} from Google Sheets:`, error);
            console.error(`   Sheet ID: ${sheetId}`);
            console.error(`   Tab GID: ${gid}`);
            console.error(`
🔧 Troubleshooting:
1. Make sure the Google Sheet is publicly accessible:
   - Open: https://docs.google.com/spreadsheets/d/${sheetId}
   - Click Share → Change to "Anyone with the link" → Viewer
2. Check that the tab exists (gid=${gid})
3. Try hard refresh: Ctrl+Shift+R
4. Check browser console for detailed error messages
            `);
            return false;
        }
    }

    parseData(data) {
        // Skip header row
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            const node = row[0];
            const index = row[1];
            const weight = row[2];
            const quantity = row[3];
            const result = row[4];

            if (!node || !result) continue;

            // Parse slot configurations (Items_1 through Items_20)
            if (node.startsWith('Items_')) {
                this.slotConfigs[node] = this.parseSlotConfig(result);
            }
            // Parse loot tables (Dia_X, Gold_X, DailyChest, etc.)
            else if (node.startsWith('Dia_') || node.startsWith('Gold_') || node === 'DailyChest') {
                if (!this.lootTables[node]) {
                    this.lootTables[node] = [];
                }
                this.lootTables[node].push({
                    index: index,
                    weight: parseInt(weight) || 1,
                    quantity: parseInt(quantity) || 1,
                    item: this.parseItemDefinition(result)
                });
            }
            // Parse bonus tables (Bonus_1 through Bonus_20)
            else if (node.startsWith('Bonus_')) {
                this.bonusTables[node] = this.parseItemDefinition(result);
            }
        }
    }

    parseSlotConfig(configString) {
        // Example: "<DailyChest>,<Dia_$CastleLevel$>,<Dia_$CastleLevel$>,<Dia_$CastleLevel$>,<Gold_$CastleLevel$>,<Gold_$CastleLevel$>"
        const slots = configString.split(',').map(s => s.trim());
        return slots.map(slot => {
            // Remove < > brackets
            const cleaned = slot.replace(/[<>]/g, '');
            // Check if it has {Bonus=true}
            const isBonus = cleaned.includes('{Bonus=true}');
            const tableName = cleaned.replace(/\{.*?\}/g, '').trim();
            return { tableName, isBonus };
        });
    }

    parseItemDefinition(itemString) {
        // Example: "SniperTower{Level=2}{Cost=36}{Currency=Diamonds}{Available=3}"
        if (!itemString) return null;

        // Extract item ID (everything before first {)
        const match = itemString.match(/^([^{]+)/);
        if (!match) return null;

        const itemId = match[1].trim();

        // Extract all key-value pairs
        const props = {};
        const propMatches = itemString.matchAll(/\{(\w+)=([^}]+)\}/g);
        for (const propMatch of propMatches) {
            const key = propMatch[1];
            const value = propMatch[2];

            // Convert numeric values
            if (key === 'Level' || key === 'Cost' || key === 'Available') {
                props[key] = parseInt(value) || 0;
            } else {
                props[key] = value;
            }
        }

        return {
            id: itemId,
            level: props.Level || 0,
            cost: props.Cost || 0,
            currency: props.Currency || 'Gold',
            available: props.Available || 1
        };
    }

    getShopForCastleLevel(castleLevel) {
        const configKey = `Items_${castleLevel}`;
        const slotConfig = this.slotConfigs[configKey];

        if (!slotConfig) {
            console.error(`No slot config found for Castle Level ${castleLevel}`);
            return [];
        }

        const shopItems = [];

        for (const slot of slotConfig) {
            let tableName = slot.tableName.replace('$CastleLevel$', castleLevel);
            const lootTable = this.lootTables[tableName];

            if (!lootTable || lootTable.length === 0) {
                console.warn(`No loot table found for ${tableName}`);
                continue;
            }

            // Select item based on weighted random
            const selectedItem = this.selectWeightedRandom(lootTable);
            if (selectedItem && selectedItem.item) {
                shopItems.push({
                    ...selectedItem.item,
                    source: tableName,
                    isBonus: slot.isBonus
                });
            }
        }

        return shopItems;
    }

    selectWeightedRandom(lootTable) {
        const totalWeight = lootTable.reduce((sum, entry) => sum + entry.weight, 0);
        let random = Math.random() * totalWeight;

        for (const entry of lootTable) {
            random -= entry.weight;
            if (random <= 0) {
                return entry;
            }
        }

        return lootTable[0]; // Fallback
    }

    // Get item display name
    getItemDisplayName(itemId) {
        const nameMap = {
            'Ballista': 'Spell Cannon',
            'DartTower': 'Bell Tower',
            'SniperTower': 'Crystal Tower',
            'NeedleTower': 'Spinshot Turret',
            'SkyshotTower': 'Skyshot Tower',
            'VoidTower': 'Catapult Tower',
            'Tree': 'Ash Tree',
            'WildHeroXp': 'Hero XP',
            'Mana': 'Mana',
            'DailyChest': 'Daily Chest'
        };
        return nameMap[itemId] || itemId;
    }

    // Get item icon (emoji/unicode representation)
    getItemIcon(itemId) {
        const iconMap = {
            'Ballista': '🎯',
            'DartTower': '🔔',
            'SniperTower': '💎',
            'NeedleTower': '⚙️',
            'SkyshotTower': '☁️',
            'VoidTower': '🌀',
            'Tree': '🌳',
            'WildHeroXp': '⭐',
            'Mana': '💧',
            'DailyChest': '🎁'
        };
        return iconMap[itemId] || '📦';
    }

    // Get item description
    getItemDescription(item) {
        if (item.id === 'DailyChest') {
            return `A mysterious chest containing valuable rewards. Open to discover what's inside!`;
        }
        if (item.id === 'Tree') {
            return `Plant this tree to generate resources over time. At level 5 this produces a Spell Cannon Harvester.`;
        }
        if (item.id === 'WildHeroXp') {
            return `Hero experience points. Use to level up your heroes and unlock powerful abilities.`;
        }
        if (item.id === 'Mana') {
            return `Magical mana used to cast spells and activate special abilities in battle.`;
        }
        if (item.id.includes('Tower')) {
            const descriptions = {
                'Ballista': 'Shoots single enemy. Range: 3.8 tiles. Deals 50 damage per shot. 0.4 shots per second.',
                'DartTower': 'Rapid-fire tower. Range: 3.2 tiles. Deals 20 damage per shot. 2.0 shots per second.',
                'SniperTower': 'A powerful sniper tower. Deals 8 damage per shot. Fires 3 seconds per shot.',
                'NeedleTower': 'Multi-target tower. Hits 3 enemies. Deals 15 damage each. 1.5 shots per second.',
                'SkyshotTower': 'Anti-air tower. Range: 4.5 tiles. Deals 40 damage. Prioritizes flying enemies.',
                'VoidTower': 'Area damage tower. Range: 2.5 tiles. Deals 30 damage in radius. 0.8 shots per second.'
            };
            return descriptions[item.id] || `A defensive tower for your castle.`;
        }
        return `Level ${item.level} item for your tower defense strategy.`;
    }
}

// Global instance
window.shopDataManager = new ShopDataManager();

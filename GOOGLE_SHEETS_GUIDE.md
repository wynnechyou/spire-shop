# Google Sheets Integration Guide

## How It Works

The shop now loads **live data** from Google Sheets! Anyone can edit the spreadsheet and see changes immediately on the website.

## Google Sheet URL
**Edit Here:** https://docs.google.com/spreadsheets/d/1jX9hiYLuL-BFTspOHJIGBuFZYowXW7uKtOnrlkeu6fw

---

## Tabs Used:

### 1. **ShopTuning** (Rows 1-27)
- **What:** Slot configurations and loot tables for all castle levels
- **DO NOT EDIT:** Rows 1-27 (Items configurations, DailyChest, Bonus)
- **Edit:** Rows 28+ (loot table entries for Dia_X, Gold_X)

### 2. **Probability Weights** (Future use)
- Category probabilities for each castle level
- Not currently used in v2.0, but available for future updates

---

## How to Update Shop Tuning:

### Option 1: Edit Slot Configurations (Rows 2-23)
**Example:** Change Castle 10 from 10 slots to 12 slots
1. Open Google Sheets
2. Go to **ShopTuning** tab
3. Find Row for `Items_10`
4. Edit the slot configuration in Column E
5. Save (auto-saves in Google Sheets)
6. Refresh the website: https://wynnechyou.github.io/spire-shop/

### Option 2: Edit Loot Tables (Rows 28+)
**Example:** Change the cost of a specific item
1. Find the row for the item (e.g., `Dia_10` for Castle 10 Diamond offers)
2. Edit the `Result` column to change item properties:
   - `{Cost=123}` - Change price
   - `{Available=5}` - Change purchase limit
   - `{Level=10}` - Change item level
3. Save and refresh the website

---

## Important Rules:

### ✅ Safe to Edit:
- Item costs in `{Cost=X}`
- Purchase limits in `{Available=X}`
- Item levels in `{Level=X}`
- Loot table weights (Column C)

### ❌ DO NOT Edit (Rows 1-27):
- `ROOT` entries
- `Items_1` through `Items_20` configurations
- `DailyChest` loot table
- `Bonus_X` entries

---

## Troubleshooting:

### Changes Not Showing Up?
1. **Hard refresh the browser:** `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Check Google Sheets sharing:** Make sure it's set to "Anyone with the link can view"
3. **Check browser console (F12):** Look for errors

### "Failed to load shop data" Error?
- Google Sheets must be publicly accessible
- Go to Share → Change to "Anyone with the link" → Viewer

### Loot Tables Not Generating Correctly?
- Make sure Column A (Node), Column C (Weight), Column E (Result) are filled
- Check that item syntax is correct: `ItemName{Level=X}{Cost=Y}{Currency=Z}{Available=N}`

---

## Testing Your Changes:

1. Edit the Google Sheet
2. Open: https://wynnechyou.github.io/spire-shop/
3. Hard refresh: `Ctrl + Shift + R`
4. Change Castle Level to test specific levels
5. Click "Refresh Shop" multiple times to test probability distribution

---

## Collaboration:

**Multiple people can edit the Google Sheet simultaneously!**

- Changes are saved automatically
- Anyone with the link can view the live shop
- Editors can update tuning in real-time
- Website updates instantly after refresh

---

## Version Tracking:

- **v1.0:** Baseline with local Excel files
- **v2.0:** Live Google Sheets integration ✨

To compare versions, check git tags:
- `git checkout v1.0` - View old version
- `git checkout main` - Return to latest

---

**Questions?** Check the browser console (F12) for detailed loading logs.

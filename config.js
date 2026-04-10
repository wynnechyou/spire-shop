// Google Sheets Configuration
// To update the shop tuning, edit the Google Sheet and refresh the page!
// Edit here: https://docs.google.com/spreadsheets/d/1jX9hiYLuL-BFTspOHJIGBuFZYowXW7uKtOnrlkeu6fw

const GOOGLE_SHEETS_CONFIG = {
    SHEET_ID: '1jX9hiYLuL-BFTspOHJIGBuFZYowXW7uKtOnrlkeu6fw',

    // Tab IDs (gid from the URL when you click on each tab)
    TABS: {
        SHOP_TUNING: '1248780469',      // ShopTuning tab
        PROBABILITY_WEIGHTS: '1234622886' // Probability Weights tab
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GOOGLE_SHEETS_CONFIG;
}

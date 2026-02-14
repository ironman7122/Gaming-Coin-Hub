# Game Rates & Admin Setup

## Overview

- **Game Rates page** (`game-rates.html`): Displays a table of games with Player and Admin links
- **Admin page** (`admin.html`): Login and add games (Game Name, Player Link, Admin Link)
- **Backend**: Google Sheets + Apps Script (no hosting required)

---

## 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new sheet
2. Name it "Gaming Coin Hub - Games"
3. Add headers in row 1: `Game Name | Player URL | Admin URL`
4. (Optional) Paste the initial 27 games from `js/games-data.js` or add them via the admin panel after setup

---

## 2. Create Apps Script

1. In the Sheet: **Extensions > Apps Script**
2. Replace the default code with the script below
3. Set the admin password: **Project Settings** (gear icon) > **Script Properties** > Add property:
   - Name: `ADMIN_PASSWORD`
   - Value: your chosen admin password

### Script

```javascript
function doGet(e) {
  const action = e.parameter && e.parameter.action;
  if (action === 'getGames') {
    const games = getGamesFromSheet();
    return createResponse(200, { games: games });
  }
  return createResponse(200, { message: 'Gaming Coin Hub API' });
}

function doPost(e) {
  try {
    const data = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : e.parameter;
    const action = data.action;
    
    if (action === 'login') {
      const stored = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
      const match = stored && data.password === stored;
      return createResponse(200, { success: match, error: match ? null : 'Invalid password' });
    }
    
    if (action === 'addGame') {
      const stored = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
      if (!stored || data.password !== stored) {
        return createResponse(200, { success: false, error: 'Invalid password' });
      }
      const g = data.game;
      const name = (g && g.name || '').toString().trim();
      const playerUrl = (g && g.playerUrl || '').toString().trim();
      const adminUrl = (g && g.adminUrl || '').toString().trim();
      if (!name || !playerUrl || !adminUrl) {
        return createResponse(200, { success: false, error: 'Game name, player URL, and admin URL are required' });
      }
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      sheet.appendRow([name, playerUrl, adminUrl]);
      return createResponse(200, { success: true, message: 'Game added' });
    }
    
    return createResponse(400, { error: 'Unknown action' });
  } catch (err) {
    return createResponse(500, { error: err.message });
  }
}

function getGamesFromSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];
  const games = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0]) {
      games.push({
        name: String(row[0]),
        playerUrl: row[1] ? String(row[1]) : '',
        adminUrl: row[2] ? String(row[2]) : ''
      });
    }
  }
  return games;
}

function createResponse(code, body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. **Deploy > New deployment > Web app**
5. Execute as: **Me**, Who has access: **Anyone**
6. Copy the **Web app URL**

---

## 3. Update the website

1. Open `game-rates.html` and `admin.html`
2. Replace `YOUR_APPS_SCRIPT_URL_HERE` with your Web app URL in both files

---

## 4. Add initial games

Either:
- Paste the games from `js/games-data.js` into your Sheet (columns A, B, C), or
- Log in at `admin.html` and add games one by one

The Game Rates page will show games from the Sheet when the URL is configured. If the Sheet is empty or the fetch fails, it falls back to the static list in `js/games-data.js`.

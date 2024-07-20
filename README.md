# Survivor Liga MX
This project provides a set of Google Apps Script functions (`macros.gs`) designed to automate the management of a Liga MX spreadsheet. It includes features such as initializing player regions, updating points and lives based on match results, and displaying rankings. Additionally, it fetches football match results using football-api.

## Features

- **Initialize Spreadsheet**: Set up the spreadsheet with default values for points, lives, and formatting.
- **Update Points and Lives**: Automatically update points and lives for each team based on the latest match results.
- **Rankings Display**: Sort and display players points and remaining lives.
- **Fetch Match Results**: Fetch the latest football match results from an API and update the spreadsheet based on that.

## How to Use

1. **Setting Up the Spreadsheet**:
   - Open your Google Spreadsheet.
   - Go to `Extensions > Apps Script`.
   - Copy the contents of `macros.gs` into the script editor and save.


2. **Running the Script**:
   - In the Google Spreadsheet, click the "Actualizar" button to fetch the latest results.

## Custom Functions

- `initializePlayerRegionBackground()`: Initializes the background for the player region.
- `initializePointsAndLives()`: Sets initial points and lives for players.
- `updatePlayerRegionBasedOnLives()`: Updates the player cell based on the current lives of players.
- `sortAndDisplayRankings()`: Sorts players based on points and lives and displays the rankings.
- `update()`: Fetches the latest match results and updates the spreadsheet accordingly.

## Requirements

- Google Spreadsheet
- API Key for football match results

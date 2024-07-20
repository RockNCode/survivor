/** @OnlyCurrentDoc */
function initializePlayerRegionBackground() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var playersStartRange = sheet.getRange("players_start");
  var teamsStartRow = sheet.getRange("teams_start").getRow();
  var teamsEndRow = sheet.getRange("teams_end").getRow();

  var lastColumn = sheet.getLastColumn();

  // Set the background color to white for the entire player region
  for (var col = playersStartRange.getColumn(); col <= lastColumn; col++) {
    for (var row = teamsStartRow; row <= teamsEndRow; row++) {
      sheet.getRange(row, col).setBackground('white').setFontColor('black');
    }
  }
}

function initializePointsAndLives() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var playersStartRange = sheet.getRange("players_start");
  var puntosRow = sheet.getRange("puntos_row").getRow();
  var vidasRow = sheet.getRange("vidas_row").getRow();

  var lastColumn = sheet.getLastColumn();

  // Initialize points and lives for each player
  for (var col = playersStartRange.getColumn(); col <= lastColumn; col++) {
    // Initialize points to 0
    sheet.getRange(puntosRow, col).setValue(0);

    // Initialize lives to 3
    sheet.getRange(vidasRow, col).setValue(3);
  }
}

function updatePlayerRegionBasedOnLives() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var playersStartRange = sheet.getRange("players_start");
  var teamsStartRow = sheet.getRange("teams_start").getRow();
  var teamsEndRow = sheet.getRange("teams_end").getRow();
  var vidasRow = sheet.getRange("vidas_row").getRow();
  var puntosRow = sheet.getRange("puntos_row").getRow();
  var players_row = sheet.getRange("players_row").getRow();

  var lastColumn = sheet.getLastColumn();
  var ranking = {}
  var eliminados = []

  // Check each player's lives and update the column background if lives are 0
  for (var col = playersStartRange.getColumn(); col <= lastColumn; col++) {
    var livesCell = sheet.getRange(vidasRow, col);
    var playerCell = sheet.getRange(players_row,col)
    var puntosCell = sheet.getRange(puntosRow,col)

    var currentLives = livesCell.getValue(); // Default lives is 3
    var currentPlayer = playerCell.getValue()
    var currentPoints = puntosCell.getValue()

    console.log(currentLives)

    if (currentLives <= 0) {
      // Set the background color to red
      playerCell.setBackground('red');
      playerCell.setFontColor('white');
      eliminados.push(currentPlayer)
    }
    else {
      playerCell.setBackground('white');
      playerCell.setFontColor('black');
      ranking[currentPlayer] = {
        "vidas" : currentLives,
        "puntos" : currentPoints
      }
    }
  }
  console.log("Rankings")
  console.log(ranking)
  sortAndDisplayRankings(ranking,eliminados)
}

function sortAndDisplayRankings(ranking={},eliminados=[]) {
  // Convert the ranking object to an array for sorting
  var rankingArray = [];
  for (var participant in ranking) {
    if (ranking.hasOwnProperty(participant)) {
      rankingArray.push([participant, ranking[participant].puntos, ranking[participant].vidas]);
    }
  }

  // Sort the array by points first, then by vidas as a tiebreaker
  rankingArray.sort(function(a, b) {
    if (b[1] === a[1]) {
      return b[2] - a[2]; // If points are equal, sort by vidas in descending order
    }
    return b[1] - a[1]; // Sort by points in descending order
  });

  // Get the named range 'region_ranking'
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rankingRange = sheet.getRange("region_ranking");
  var muertosRange = sheet.getRange("muertos_range")

  // Clear the existing ranking area
  rankingRange.clear();
  muertosRange.clear();

  // Populate the ranking data into the range
  for (var i = 0; i < rankingArray.length; i++) {
    rankingRange.getCell(i + 1, 1).setValue(i + 1); // Posicion
    rankingRange.getCell(i + 1, 2).setValue(rankingArray[i][0]); // Participante
    rankingRange.getCell(i + 1, 3).setValue(rankingArray[i][1]); // Puntos
    rankingRange.getCell(i + 1, 4).setValue(rankingArray[i][2]); // Vidas
  }
  for (var i = 0; i < eliminados.length; i++) {
    muertosRange.getCell(i + 1, 1).setValue(eliminados[i]); // Jugador muerto
  }

  var rankingSubRange = rankingRange.offset(0, 0, rankingArray.length, rankingRange.getNumColumns());
  styleRange(rankingSubRange)

  if (eliminados.length > 0) {
    var muertosSubRange = muertosRange.offset(0, 0, eliminados.length, muertosRange.getNumColumns());
    styleRange(muertosSubRange)
  }
}

function styleRange(range) {
  // Set background color
  range.setBackground('#f0f0f0');

  // Set font color
  range.setFontColor('#000000');

  // Set font size
  range.setFontSize(12);

  // Set text alignment
  range.setHorizontalAlignment('center');
  range.setVerticalAlignment('middle');

  // Add borders
  range.setBorder(true, true, true, true, true, true);

  // Set font weight
  range.setFontWeight('bold');
}

function update() {
  var url = "https://v3.football.api-sports.io/fixtures?league=262&season=2024";
  var scriptProperties = PropertiesService.getScriptProperties();
  var apiKey = scriptProperties.getProperty('footballApiKey');
  var options = {
    "method" : "GET",
    "headers": {
      "x-rapidapi-host": "v3.football.api-sports.io",
      "x-rapidapi-key": apiKey
    }
  };

  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  var jornadas = {};

  data.response.forEach(function(fixture) {
    var jornada = "J" + fixture.league.round.split(" ").pop();
    var matchStatus = fixture.fixture.status ? fixture.fixture.status.short : null;
    var homeTeam = fixture.teams.home.name;
    var awayTeam = fixture.teams.away.name;
    var homeScore = fixture.goals.home;
    var awayScore = fixture.goals.away;

    if (!jornadas[jornada]) {
      jornadas[jornada] = {
        "TeamsWin": [],
        "TeamsLost": [],
        "TeamsTied": []
      };
    }

    if (matchStatus === "FT") { // Full Time
      if (homeScore > awayScore) {
        jornadas[jornada].TeamsWin.push(homeTeam);
        jornadas[jornada].TeamsLost.push(awayTeam);
      } else if (homeScore < awayScore) {
        jornadas[jornada].TeamsWin.push(awayTeam);
        jornadas[jornada].TeamsLost.push(homeTeam);
      } else {
        jornadas[jornada].TeamsTied.push(homeTeam);
        jornadas[jornada].TeamsTied.push(awayTeam);
      }
    }
  });

  var result = {
    "Jornadas": jornadas
  };


  // Logger.log(JSON.stringify(result, null, 2));

  // Now lets iterate over the columns from named range "players_start" until the last column with data.
  // The teams will be at named column "teams_column" and the start row is "teams_start" and the end row is "teams_end",
  // if we find a value on a player cell, we will check the jornadas structure and see if the team won, tied or lost.
  // If the team won we will update cell at named row "puntos_row" and increase the value by 3, if it tied we will increase by 1,
  // if it lost we will not do anything. If the team lost we will decrease the row at "vidas_row" by 1.

  // Initialization
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var playersStartRange = sheet.getRange("players_start");
  var teamsColumnRange = sheet.getRange("teams_column");
  var teamsStartRow = sheet.getRange("teams_start").getRow();
  var teamsEndRow = sheet.getRange("teams_end").getRow();
  var puntosRow = sheet.getRange("puntos_row").getRow();
  var vidasRow = sheet.getRange("vidas_row").getRow();

  var lastColumn = sheet.getLastColumn();

  initializePlayerRegionBackground()
  initializePointsAndLives()

  // Iterate over the columns from players_start to the last column with data
  for (var col = playersStartRange.getColumn(); col <= lastColumn; col++) {
    for (var row = teamsStartRow; row <= teamsEndRow; row++) {
      var cell = sheet.getRange(row, col);
      var cellValue = cell.getValue();
      var teamName = sheet.getRange(row, teamsColumnRange.getColumn()).getValue();

      if (cellValue) {
        Logger.log("Cell value " + cellValue)
        var jornada = cellValue; // Assuming the cell value corresponds to the jornada
        var resultObj = result["Jornadas"][jornada]//jornadas[jornada];
        //Logger.log(result["Jornadas"])
        if (resultObj) {
          Logger.log("Results are present")
          if (resultObj.TeamsWin.includes(teamName)) {
            // Increase points by 3
            Logger.log("Increasing 3 points for team : " + teamName)
            var puntosCell = sheet.getRange(puntosRow, col);
            var currentPoints = puntosCell.getValue() || 0;
            puntosCell.setValue(currentPoints + 3);
            cell.setBackground('green').setFontColor('white');
          } else if (resultObj.TeamsTied.includes(teamName)) {
            // Increase points by 1
            Logger.log("Increasing 1 points for team : " + teamName)
            var puntosCell = sheet.getRange(puntosRow, col);
            var currentPoints = puntosCell.getValue() || 0;
            puntosCell.setValue(currentPoints + 1);
            cell.setBackground('yellow').setFontColor('black');
          } else if (resultObj.TeamsLost.includes(teamName)) {
            // Decrease lives by 1
            Logger.log("Decrease 1 live for team : " + teamName)
            var vidasCell = sheet.getRange(vidasRow, col);
            var currentLives = vidasCell.getValue() || 3; // Default lives is 3
            vidasCell.setValue(currentLives - 1);
            cell.setBackground('red').setFontColor('white');
          } else{
            cell.setBackground('white').setFontColor('black');
          }
        } else {
          //Logger.log("Results don't exist")
        }
      }
    }
  }
  updatePlayerRegionBasedOnLives()
}

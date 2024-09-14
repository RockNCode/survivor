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

function initializeHeaderRegionBackground() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headerRange = sheet.getRange("players_row");

  // Set the background color to white for the header region
  headerRange.setBackground('white').setFontColor('black');
}

function initializePointsAndLives(currentRound) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var playersStartRange = sheet.getRange("players_start");
  var puntosRow = sheet.getRange("puntos_row").getRow();
  var vidasRow = sheet.getRange("vidas_row").getRow();
  var playersRow = sheet.getRange("players_row").getRow();
  var teamsStartRow = sheet.getRange("teams_start").getRow();
  var teamsEndRow = sheet.getRange("teams_end").getRow();
  var teamsColumn = sheet.getRange("teams_column").getColumn();
  var lastColumn = sheet.getLastColumn();

  // Initialize points and lives for each player
  for (var col = playersStartRange.getColumn(); col <= lastColumn; col++) {
    // Initialize points to 0
    sheet.getRange(puntosRow, col).setValue(0);

    // Initialize lives to 3
    sheet.getRange(vidasRow, col).setValue(3);
  }

  // Get the total number of the current round
  var totalRounds = parseInt(currentRound.split(" - ").pop());

  // Generate an array of past rounds (excluding the current round)
  var pastRounds = [];
  for (var i = 1; i < totalRounds; i++) {
    pastRounds.push('Apertura - ' + i);
  }

  // Collect all players
  var players = [];
  for (var col = playersStartRange.getColumn(); col <= lastColumn; col++) {
    var playerName = sheet.getRange(playersRow, col).getValue();
    players.push({ name: playerName, column: col });
  }

  // Collect picks for each player
  var playerPicks = {};
  players.forEach(function(player) {
    playerPicks[player.name] = {};
  });

  // Go through the picks grid and populate playerPicks
  for (var row = teamsStartRow; row <= teamsEndRow; row++) {
    for (var col = playersStartRange.getColumn(); col <= lastColumn; col++) {
      var playerName = sheet.getRange(playersRow, col).getValue();
      var cellValue = sheet.getRange(row, col).getValue();

      if (cellValue) {
        var jornada = cellValue; // e.g., 'J5'
        var pickRoundNumber = parseInt(jornada.substring(1));
        var pickRound = 'Apertura - ' + pickRoundNumber;

        // Record that the player made a pick for this round
        playerPicks[playerName][pickRound] = true;
      }
    }
  }

  // For each player, check if they have picks for pastRounds
  players.forEach(function(player) {
    var vidasCell = sheet.getRange(vidasRow, player.column);
    var currentLives = 3; // Since we just set it to 3

    pastRounds.forEach(function(round) {
      if (!playerPicks[player.name].hasOwnProperty(round)) {
        // Player did not make a pick for this past round, deduct a life
        currentLives--;
      }
    });

    // Update the lives in the sheet
    vidasCell.setValue(currentLives);
  });
}

function updatePlayerRegionBasedOnLives(playersWhoPickedCurrentRound) {
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
      // check if the player picked a team for the current round and if not, leave the background as is
      if (playersWhoPickedCurrentRound.hasOwnProperty(currentPlayer)) {
        playerCell.setBackground('white');
        playerCell.setFontColor('black');
      }
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

  // Variables to store fixtures
  var upcomingFixtures = [];
  var pastFixtures = [];

  data.response.forEach(function(fixture) {
    var matchStatus = fixture.fixture.status ? fixture.fixture.status.short : null;

    if (matchStatus === 'NS' || matchStatus === 'TBD') {
      upcomingFixtures.push(fixture);
    } else if (matchStatus === 'FT' || matchStatus === 'AET' || matchStatus === 'PEN') {
      pastFixtures.push(fixture);
    }
  });

  // Sort fixtures by date
  upcomingFixtures.sort(function(a, b) {
    return new Date(a.fixture.date) - new Date(b.fixture.date);
  });

  pastFixtures.sort(function(a, b) {
    return new Date(b.fixture.date) - new Date(a.fixture.date);
  });

  // Determine the current round
  var currentRound = '';
  if (upcomingFixtures.length > 0) {
    // Use the round of the next upcoming fixture
    currentRound = upcomingFixtures[0].league.round;
  } else if (pastFixtures.length > 0) {
    // All fixtures have been played; use the last completed round
    currentRound = pastFixtures[0].league.round;
  } else {
    // Default to the first round if no fixtures are found
    currentRound = 'Apertura - 1';
  }

  Logger.log("Current Round: " + currentRound);
  // Set the current round in the spreadsheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange("current_round").setValue(currentRound);

  // Create the jornadas object
  var jornadas = {};

  // Process past fixtures to build the jornadas object
  pastFixtures.forEach(function(fixture) {
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

    if (matchStatus === "FT" || matchStatus === "AET" || matchStatus === "PEN") {
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

  // Now proceed to process the player picks

  // Initialization
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var playersStartRange = sheet.getRange("players_start");
  var teamsColumnRange = sheet.getRange("teams_column");
  var teamsStartRow = sheet.getRange("teams_start").getRow();
  var teamsEndRow = sheet.getRange("teams_end").getRow();
  var puntosRow = sheet.getRange("puntos_row").getRow();
  var vidasRow = sheet.getRange("vidas_row").getRow();
  var players_row = sheet.getRange("players_row").getRow();

  var lastColumn = sheet.getLastColumn();

  initializePlayerRegionBackground();
  initializeHeaderRegionBackground();
  initializePointsAndLives(currentRound);

  var allPlayers = [];
  var playersWhoPickedCurrentRound = {};

  // Collect all players
  for (var col = playersStartRange.getColumn(); col <= lastColumn; col++) {
    var playerCell = sheet.getRange(players_row, col);
    var currentPlayer = playerCell.getValue();
    allPlayers.push({
      name: currentPlayer,
      column: col
    });
  }

  // Iterate over the columns from players_start to the last column with data
  for (var col = playersStartRange.getColumn(); col <= lastColumn; col++) {
    var playerCell = sheet.getRange(players_row, col);
    var currentPlayer = playerCell.getValue();

    for (var row = teamsStartRow; row <= teamsEndRow; row++) {
      var cell = sheet.getRange(row, col);
      var cellValue = cell.getValue();
      var teamName = sheet.getRange(row, teamsColumnRange.getColumn()).getValue();

      if (cellValue) {
        var jornada = cellValue; // Assuming the cell value corresponds to the jornada (e.g., 'J13')

        // Check if the pick is for the current round
        var pickRound = 'Apertura - ' + jornada.substring(1);
        if (pickRound === currentRound) {
          playersWhoPickedCurrentRound[currentPlayer] = true;
        }

        var resultObj = result["Jornadas"][jornada];

        if (resultObj) {
          if (resultObj.TeamsWin.includes(teamName)) {
            // Increase points by 3
            var puntosCell = sheet.getRange(puntosRow, col);
            var currentPoints = puntosCell.getValue() || 0;
            puntosCell.setValue(currentPoints + 3);
            cell.setBackground('green').setFontColor('white');
          } else if (resultObj.TeamsTied.includes(teamName)) {
            // Increase points by 1
            var puntosCell = sheet.getRange(puntosRow, col);
            var currentPoints = puntosCell.getValue() || 0;
            puntosCell.setValue(currentPoints + 1);
            cell.setBackground('yellow').setFontColor('black');
          } else if (resultObj.TeamsLost.includes(teamName)) {
            // Decrease lives by 1
            var vidasCell = sheet.getRange(vidasRow, col);
            var currentLives = vidasCell.getValue() || 3;
            vidasCell.setValue(currentLives - 1);
            cell.setBackground('red').setFontColor('white');
          } else {
            cell.setBackground('white').setFontColor('black');
          }
        }
      }
    }
  }

  // Deduct a life for players who didn't make a pick for the current round
  allPlayers.forEach(function(player) {
    var currentPlayer = player.name;
    var col = player.column;

    if (!playersWhoPickedCurrentRound.hasOwnProperty(currentPlayer)) {
      // Player did not make a pick for the current round
      Logger.log("Player " + currentPlayer + " did not make a pick for " + currentRound);
      // Decrease lives by 1
      var vidasCell = sheet.getRange(vidasRow, col);
      var currentLives = vidasCell.getValue() || 3;
      vidasCell.setValue(currentLives - 1);
      // Optionally, update the player's cell to indicate a missed pick
      var playerCell = sheet.getRange(players_row, col);
      playerCell.setBackground('orange').setFontColor('black');
    }
  });

  updatePlayerRegionBasedOnLives(playersWhoPickedCurrentRound);
}

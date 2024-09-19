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
    "method": "GET",
    "headers": {
      "x-rapidapi-host": "v3.football.api-sports.io",
      "x-rapidapi-key": apiKey
    }
  };

  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());

  var rounds = {};

  // Build the rounds object with fixtures and date ranges
  data.response.forEach(function(fixture) {
    var roundName = fixture.league.round;
    if (!rounds[roundName]) {
      rounds[roundName] = {
        fixtures: [],
        earliestDate: null,
        latestDate: null
      };
    }
    rounds[roundName].fixtures.push(fixture);

    var fixtureDate = new Date(fixture.fixture.date);

    if (!rounds[roundName].earliestDate || fixtureDate < rounds[roundName].earliestDate) {
      //rounds[roundName].earliestDate = fixtureDate;
      rounds[roundName].earliestDate = new Date(fixtureDate.getFullYear(), fixtureDate.getMonth(), fixtureDate.getDate());

    }
    if (!rounds[roundName].latestDate || fixtureDate > rounds[roundName].latestDate) {
      //rounds[roundName].latestDate = fixtureDate;
      rounds[roundName].latestDate = new Date(fixtureDate.getFullYear(), fixtureDate.getMonth(), fixtureDate.getDate(), 23, 59, 59);

    }
  });

  // Convert rounds object to an array and sort by round number
  var roundsArray = [];
  for (var roundName in rounds) {
    if (rounds.hasOwnProperty(roundName)) {
      var roundNumberStr = roundName.split(" - ").pop();
      var roundNumber = parseInt(roundNumberStr);
      roundsArray.push({
        roundName: roundName,
        roundNumber: roundNumber,
        earliestDate: rounds[roundName].earliestDate,
        latestDate: rounds[roundName].latestDate,
        fixtures: rounds[roundName].fixtures
      });
    }
  }

  // Sort the rounds by their number
  roundsArray.sort(function(a, b) {
    return a.roundNumber - b.roundNumber;
  });

  // Determine the current round based on the current date
  var currentDate = new Date();
  // currentDate.setHours(currentDate.getHours() - 6); // Convert to Mexico City time
  
  // For testing, let's set the current date to a specific date of September 20, 2024
  // currentDate = new Date("2024-09-20T12:00:00-05:00");
  
  var currentRound = '';
  var currentRoundFound = false;
  console.log("Current date : " + currentDate);
  for (var i = 0; i < roundsArray.length; i++) {
    var round = roundsArray[i];

    if (currentDate >= round.earliestDate && currentDate <= round.latestDate) {
      // Current date falls within this round's date range
      currentRound = round.roundName;
      currentRoundFound = true;
      break;
    } else if (currentDate < round.earliestDate) {
      // Current date is before this round's fixtures
      if (i > 0) {
        console.log("Using past round")
        // Use the previous round
        currentRound = roundsArray[i - 1].roundName;
      } else {
        // This is the first round
        console.log("Third condition")
        currentRound = round.roundName;
      }
      currentRoundFound = true;
      console.log("Round earliest : " + round.earliestDate)
      console.log("Round latest : " + round.latestDate)

      break;
    }
  }

  if (!currentRoundFound) {
    // Current date is after all rounds; use the last round
    currentRound = roundsArray[roundsArray.length - 1].roundName;
  }

  Logger.log("Current Round: " + currentRound);
  // Set the current round in the spreadsheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange("current_round").setValue(currentRound);

  // Build the jornadas object
  var jornadas = {};

  // Process rounds to build the jornadas object
  roundsArray.forEach(function(round) {
    var jornada = "J" + round.roundNumber;
    jornadas[jornada] = {
      "TeamsWin": [],
      "TeamsLost": [],
      "TeamsTied": []
    };

    round.fixtures.forEach(function(fixture) {
      var matchStatus = fixture.fixture.status ? fixture.fixture.status.short : null;
      var homeTeam = fixture.teams.home.name;
      var awayTeam = fixture.teams.away.name;
      var homeScore = fixture.goals.home;
      var awayScore = fixture.goals.away;

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
  });

  var result = {
    "Jornadas": jornadas
  };

  // Now proceed to process the player picks

  // Initialization
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

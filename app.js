const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const installingDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error :${error.message}`);
    process.exit(1);
  }
};

installingDbAndServer();

const PlayerDbObjectToResponseObj = (playerObject) => {
  return {
    playerId: playerObject.player_id,
    playerName: playerObject.player_name,
  };
};

const matchDetailsDbObjectToResponseObj = (matchDetailsObject) => {
  return {
    matchId: matchDetailsObject.match_id,
    match: matchDetailsObject.match,
    year: matchDetailsObject.year,
  };
};

const matchScoreDbObjectToResponseObj = (matchScoreObject) => {
  return {
    playerMatchId: matchScoreObject.player_match_id,
    playerId: matchScoreObject.player_id,
    matchId: matchScoreObject.match_id,
    score: matchScoreObject.score,
    fours: matchScoreObject.fours,
    sixes: matchScoreObject.sixes,
  };
};

//API 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
    *
    FROM
    player_details`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => PlayerDbObjectToResponseObj(eachPlayer))
  );
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerOfIdQuery = `
    SELECT
      *
    FROM
      player_details
    WHERE
      player_id = ${playerId};`;
  const queryResponse = await database.get(playerOfIdQuery);
  response.send(PlayerDbObjectToResponseObj(queryResponse));
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT
      *
    FROM
      match_details
    WHERE
      match_id = ${matchId};`;
  const queryResponse = await database.get(matchDetailsQuery);
  response.send(matchDetailsDbObjectToResponseObj(queryResponse));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const postPlayerDetails = `
    UPDATE
      player_details
    SET
      player_name = '${playerName}',
    WHERE
      player_id = ${playerId};
    `;
  await database.get(postPlayerDetails);
  response.send("Player Details Updated");
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchDetailsQuery = `
    SELECT
      match_id,
      match,
      year
    FROM
      player_match_score
    NATURAL JOIN
      match_details
    WHERE 
      player_id = ${playerId};`;
  const queryResponse = await database.get(playerMatchDetailsQuery);
  response.send(
    queryResponse.map((eachItem) => matchDetailsDbObjectToResponseObj(eachItem))
  );
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const requestingPlayerDetailsQuery = `
    SELECT
      player_id,
      player_name
    FROM 
      player_details
    NATURAL JOIN 
      player_match_details
    WHERE
      match_Id = ${matchId};`;
  const queryResponse = await database.all(requestingPlayerDetailsQuery);
  request.send({
    playerId: queryResponse.player_id,
    playerName: queryResponse.player_name,
  });
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const gettingDetailsOfPlayerQuery = `
    SELECT
      player_id,
      player_name,
      SUM(score),
      SUM(fours),
      SUM(sixes)
    FROM
      player_match_details
    WHERE
      player_id = ${playerId};`;
  const queryResponse = await database.get(gettingDetailsOfPlayerQuery);
  response.send({
    playerId: queryResponse.player_id,
    playerName: queryResponse.player_name,
    totalScore: ["SUM(score)"],
    totalFours: ["SUM(fours)"],
    totalSixes: ["SUM(sixes)"],
  });
});

module.exports = app;

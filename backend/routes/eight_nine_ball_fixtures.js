var express = require("express");
var router = express.Router();
const _ = require("lodash");
const Joi = require("joi");
const knex = require("../db/knex");
const auth = require("../auth");
const moment = require("moment");

const eight_nine_ball_seasons = require("../models/eight_nine_ball_seasons");
const eight_nine_ball_leagues = require("../models/eight_nine_ball_leagues");
const eight_nine_ball_fixtures = require("../models/eight_nine_ball_fixtures");

const score = require("../functions/score");
const playoff = require("../functions/playoffscore");
const fixture_split = require("../functions/polygonshuffle");
const fixturegen = require("../functions/fixturegen");

/* 
  GET handler for /api/89ball_fixture/group/:seasonId
  Function: To get the number of distinct group
*/
router.get("/group/:seasonId", (req, res) => {
  req.query.type = parseInt(req.query.type, 10);
  const schema = {
    type: Joi.number()
      .integer()
      .required()
  };

  //Validation
  if (Joi.validate(req.query, schema, { convert: false }).error) {
    res.status(400).json({ status: "error", error: "Invalid data" });
    return;
  }

  let seasonId = parseInt(req.params.seasonId, 10);

  eight_nine_ball_fixtures
    .query()
    .where({ type: req.query.type, seasonId: seasonId })
    .max("group as count")
    .then(
      count => {
        res.json(count);
      },
      e => {
        res.status(400).send();
      }
    );
});

/* 
  GET handler for /api/89ball_fixture/all/?type
  Function: To get the all fixtures with specified params (specific type)
*/
router.get("/all", (req, res) => {
  req.query.type = parseInt(req.query.type, 10);
  const schema = {
    type: Joi.number()
      .integer()
      .required(),
    staffName: Joi.string(),
    hidePlayed: Joi.string()
  };

  //Validation
  if (Joi.validate(req.query, schema, { convert: false }).error) {
    res.status(400).json({ status: "error", error: "Invalid data" });
    return;
  }

  //Build the filter
  let where1 = {
    type: req.query.type
  };
  let where2 = {
    type: req.query.type
  };

  //Params handling
  if (req.query.hasOwnProperty("staffName") && req.query.staffName !== " ") {
    where1.player1 = req.query.staffName;
    where2.player2 = req.query.staffName;
  }
  if (
    req.query.hasOwnProperty("hidePlayed") &&
    req.query.hidePlayed === "true"
  ) {
    where1.score1 = null;
    where1.score2 = null;
    where2.score1 = null;
    where2.score2 = null;
  }

  eight_nine_ball_fixtures
    .query()
    .where(where1)
    .orWhere(where2)
    .then(
      fixture => {
        res.send(fixture);
      },
      e => {
        res.status(500).json(e);
      }
    );
});

/* 
  GET handler for /api/89ball_fixture/:seasonId
  Function: To get the fixtures in the specified seasons with specified params
*/
router.get("/:seasonId", (req, res) => {
  req.query.type = parseInt(req.query.type, 10);
  const schema = {
    type: Joi.number()
      .integer()
      .required(),
    staffName: Joi.string(),
    hidePlayed: Joi.string(),
    showLess: Joi.string(),
    onlyPlayed: Joi.string()
  };

  //Validation
  if (Joi.validate(req.query, schema, { convert: false }).error) {
    res.status(400).json({ status: "error", error: "Invalid data" });
    return;
  }

  //Build the filter
  let where1 = {
    type: req.query.type,
    seasonId: parseInt(req.params.seasonId, 10)
  };
  let where2 = {
    type: req.query.type,
    seasonId: parseInt(req.params.seasonId, 10)
  };

  //Params handling
  if (req.query.hasOwnProperty("staffName") && req.query.staffName !== " ") {
    where1.player1 = req.query.staffName;
    where2.player2 = req.query.staffName;
  }
  if (
    req.query.hasOwnProperty("hidePlayed") &&
    req.query.hidePlayed === "true"
  ) {
    where1.score1 = null;
    where1.score2 = null;
    where2.score1 = null;
    where2.score2 = null;
  }

  if (req.query.hasOwnProperty("showLess") && req.query.showLess === "true") {
    eight_nine_ball_fixtures
      .query()
      .where(function() {
        this.where(where1).orWhere(where2);
      })
      .andWhere(
        "date",
        "<=",
        moment()
          .add(2, "weeks")
          .toISOString()
      )
      .orderBy("player1")
      .then(
        fixture => {
          res.send(fixture);
        },
        e => {
          res.status(500).json(e);
        }
      );
  } else if (
    req.query.hasOwnProperty("onlyPlayed") &&
    req.query.onlyPlayed === "true"
  ) {
    eight_nine_ball_fixtures
      .query()
      .where(function() {
        this.where(where1).orWhere(where2);
      })
      .whereNotNull("score1")
      .whereNotNull("score2")
      .orderBy("player1")
      .then(
        fixture => {
          res.send(fixture);
        },
        e => {
          res.status(500).json(e);
        }
      );
  } else {
    eight_nine_ball_fixtures
      .query()
      .where(where1)
      .orWhere(where2)
      .orderBy("player1")
      .then(
        fixture => {
          res.send(fixture);
        },
        e => {
          res.status(500).json(e);
        }
      );
  }
});

/* 
  PUT handler for /api/89ball_fixture/edit/
  Function: To update the score
*/
router.put("/edit", auth.checkJwt, async (req, res) => {
  const schema = {
    type: Joi.number()
      .integer()
      .required(),
    seasonId: Joi.number()
      .integer()
      .required(),
    player1: Joi.string().required(),
    score1: Joi.number().required(),
    player2: Joi.string().required(),
    score2: Joi.number().required(),
    playoff: Joi.any()
  };

  if (Joi.validate(req.body, schema, { convert: false }).error) {
    res.status(400).json({ status: "error", error: "Invalid data" });
    return;
  }

  //these will be amended to the DB
  const leagueAttributes = {
    type: req.body.type,
    seasonId: req.body.seasonId,
    player1: req.body.player1,
    score1: null,
    player2: req.body.player2,
    score2: null
  };

  const p1Attributes = {
    type: req.body.type,
    seasonId: req.body.seasonId,
    staffName: req.body.player1
  };

  const p2Attributes = {
    type: req.body.type,
    seasonId: req.body.seasonId,
    staffName: req.body.player2
  };

  //Check if fixture exist and score is still null (thus fixture is unplayed)
  let fixture;
  try {
    fixture = await eight_nine_ball_fixtures.query().findOne(leagueAttributes);

    if (!fixture) {
      res.status(404).send();
      return;
    }
  } catch (e) {
    res.status(500).send();
  }

  let player1;
  let player2;

  //Fetch player1
  try {
    player1 = await eight_nine_ball_leagues.query().findOne(p1Attributes);
    if (!player1) {
      res.status(404).send();
      return;
    }
  } catch (e) {
    res.status(500).send();
    return;
  }

  //Fetch player2
  try {
    player2 = await eight_nine_ball_leagues.query().findOne(p2Attributes);
    if (!player2) {
      res.status(404).send();
      return;
    }
  } catch (e) {
    res.status(500).send();
    return;
  }

  /* PLAYOFF LEAGUE ALGORITHM */
  if (
    req.body.hasOwnProperty("playoff") &&
    (req.body.playoff === true || req.body.playoff === 1)
  ) {
    try {
      const players = playoff.calculateScore(
        player1,
        player2,
        req.body.score1,
        req.body.score2,
        fixture.date
      );
      player1 = _.cloneDeep(players.player1);
      player2 = _.cloneDeep(players.player2);
    } catch (e) {
      res.status(500).send();
      return;
    }
  } else {
  /* NORMAL LEAGUE ALGORITHM */
    try {
      const players = score.calculateScore(
        player1,
        player2,
        req.body.score1,
        req.body.score2,
        fixture.date
      );
      player1 = _.cloneDeep(players.player1);
      player2 = _.cloneDeep(players.player2);
    } catch (e) {
      res.status(500).send();
      return;
    }
  }

  //UPDATE FIXTURE TABLE
  try {
    let result = await eight_nine_ball_fixtures
      .query()
      .findOne(leagueAttributes)
      .patch({
        score1: req.body.score1,
        score2: req.body.score2
      });
    if (result === 0) {
      res.status(404).send();
      return;
    }
  } catch (e) {
    res.status(500).send();
    return;
  }

  //UPDATE PLAYER1 IN LEAGUE TABLE
  try {
    let result = await eight_nine_ball_leagues
      .query()
      .findOne(p1Attributes)
      .patch(player1);
    if (result === 0) {
      res.status(404).send();
      return;
    }
  } catch (e) {
    res.status(500).send();
    return;
  }

  //UPDATE PLAYER2 IN LEAGUE TABLE
  try {
    let result = await eight_nine_ball_leagues
      .query()
      .findOne(p2Attributes)
      .patch(player2);
    if (result === 0) {
      res.status(404).send();
      return;
    }
  } catch (e) {
    res.status(500).send();
    return;
  }

  //EVERYTHING SUCCEEDED
  res.status(200).send();
});

/* 
  PUT handler for /api/89ball_fixture/edit/force
  Function: To update the score
*/
router.put("/edit/force", auth.checkJwt, async (req, res) => {
  const schema = {
    type: Joi.number()
      .integer()
      .required(),
    seasonId: Joi.number()
      .integer()
      .required(),
    player1: Joi.string().required(),
    score1: Joi.number().required(),
    player2: Joi.string().required(),
    score2: Joi.number().required()
  };

  if (Joi.validate(req.body, schema, { convert: false }).error) {
    res.status(400).json({ status: "error", error: "Invalid data" });
    return;
  }

  const leagueAttributes = {
    type: req.body.type,
    seasonId: req.body.seasonId,
    player1: req.body.player1,
    player2: req.body.player2
  };

  //UPDATE FIXTURE TABLE
  try {
    let result = await eight_nine_ball_fixtures
      .query()
      .findOne(leagueAttributes)
      .patch({
        score1: req.body.score1,
        score2: req.body.score2
      });
    if (result === 0) {
      res.status(404).send();
      return;
    }
  } catch (e) {
    res.status(500).send();
    return;
  }

  //EVERYTHING SUCCEED
  res.status(200).send();
});

/* 
  POST handler for /api/89ball_fixture/generate/ 
  Function: Handles fixture generation and fixture splitting
*/
router.post("/generate", auth.checkJwt, async (req, res) => {
  var group = 0;
  aesDate = moment().add(1, "week");
  let seasonId = req.body.seasonId;
  let type = req.body.type;

  //take the seasonid and see if it's acceptable
  const schema = {
    type: Joi.number()
      .integer()
      .required(),
    seasonId: Joi.number()
      .integer()
      .required(),
    staffName: Joi.string()
  };

  if (Joi.validate(req.body, schema, { convert: false }).error) {
    res.status(400).json({ status: "error", error: "Invalid data" });
    return;
  }

  //db call to get names
  let players;
  try {
    players = await eight_nine_ball_leagues
      .query()
      .where({ type: type, seasonId: seasonId });
    if (players.length <= 1) {
      res.status(400).send("Not enough players");
      return;
    }
  } catch (e) {
    res.status(500).send();
    return;
  }

  /* GENERATE FIXTURE FOR NEW PLAYER */
  if (req.body.hasOwnProperty("staffName") && req.body.staffName !== " ") {
    //Only add a single new player

    //Remove the new player from players
    players = players.filter(player => player.staffName !== req.body.staffName);
    //Shuffle just to randomise
    players = _.shuffle(players);

    //Get first date of the first old fixture group
    let initialDate;
    await eight_nine_ball_fixtures
      .query()
      .where({ type: req.body.type, seasonId: req.body.seasonId })
      .orderBy("group", "asc")
      .then(
        fixtures => {
          initialDate = fixtures[0].date;
        },
        e => {
          res.status(400).send(e);
        }
      );

    let fixture = [];
    for (let i = 0; i < players.length; i++) {
      fixture = [
        ...fixture,
        {
          type: req.body.type,
          seasonId: req.body.seasonId,
          player1: req.body.staffName,
          player2: players[i].staffName,
          group: i,
          date: moment(initialDate).toISOString()
        }
      ];
      //Increment due date
      initialDate = moment(initialDate)
        .add(1, "week")
        .toISOString();
    }

    knex.batchInsert("eight_nine_ball_fixtures", fixture, 100).then(
      result => {
        if (result) {
          res.status(200).send();
        }
      },
      e => {
        res.status(400).send(e);
      }
    );
  } else {
    /* NORMAL FIXTURE GEN */
    var playerCount = players.length;
    let fixture = [];
    let exCount = 1;
    if (playerCount % 2 > 0) {
      exCount = 0;
    }
    //this gets a fixture and puts it into fixtSets
    for (var j = 0; j < playerCount - exCount; j++) {
      fixture = fixturegen.fixtureCalc(
        type,
        players,
        seasonId,
        group,
        aesDate.toISOString()
      ); //this represents the fixture rows
      knex.batchInsert("eight_nine_ball_fixtures", fixture, 100).then(
        result => {
          if (result) {
            res.status(200).send();
          }
        },
        e => {
          res.status(400).send();
        }
      );
      group++;
      aesDate = aesDate.add(1, "week");

      players = fixture_split.polygonShuffle(players); //rotate players for next fixture
    }
  }
});

/* 
  POST handler for /api/89ball_fixture/playoff
  Function: generates playoff fixtures
*/
router.post("/playoff", auth.checkJwt, async (req, res) => {
  aesDate = moment().add(1, "week");
  let seasonId = req.body.seasonId;
  let type = req.body.type;

  //take the seasonid and see if it's acceptable
  const schema = {
    type: Joi.number()
      .integer()
      .required(),
    seasonId: Joi.number()
      .integer()
      .required(),
    draws: Joi.array().required()
  };

  if (Joi.validate(req.body, schema, { convert: false }).error) {
    res.status(400).json({ status: "error", error: "Invalid data" });
    return;
  }

  //Reopen the season
  await eight_nine_ball_seasons
    .query()
    .findOne({ type: req.body.type, seasonId: req.body.seasonId })
    .patch({ finished: false, playoff: true })
    .catch(e => {
      res.status(400).send(e);
      return;
    });

  //Get last date of the last old fixture group
  let lastDate;
  let group;
  await eight_nine_ball_fixtures
    .query()
    .where({ type: req.body.type, seasonId: req.body.seasonId })
    .orderBy("group", "desc")
    .then(
      fixtures => {
        lastDate = fixtures[0].date;
        group = fixtures[0].group + 1;
      },
      e => {
        res.status(400).send(e);
      }
    );

  //GET PLAYERS FOR THE PLAYOFF
  for (let i = 0; i < req.body.draws.length; i++) {
    let players = await eight_nine_ball_leagues
      .query()
      .where({
        type: type,
        seasonId: seasonId,
        points: req.body.draws[i].points,
        goalsFor: req.body.draws[i].goalsFor,
        goalsAgainst: req.body.draws[i].goalsAgainst
      })
      .catch(e => {
        res.status(400).send(e);
        return;
      });

    //Generate PLAYOFF FIXTURE
    var playerCount = players.length;
    let fixture = [];
    let exCount = 1;
    if (playerCount % 2 !== 0) {
      exCount = 0;
    }

    for (var j = 0; j < playerCount - exCount; j++) {
      fixture = fixturegen.fixtureCalc(
        type,
        players,
        seasonId,
        group,
        moment(lastDate)
          .add(1, "week")
          .toISOString()
      ); //this represents the fixture rows

      knex.batchInsert("eight_nine_ball_fixtures", fixture, 100).then(
        result => {
          if (result) {
            res.status(200).send();
          }
        },
        e => {
          res.status(400).send(e);
        }
      );

      //Increment due date
      lastDate = moment(lastDate)
        .add(1, "week")
        .toISOString();

      //Increment group
      group++;

      players = fixture_split.polygonShuffle(players); //rotate players for next fixture
    }
  }
});

module.exports = router;

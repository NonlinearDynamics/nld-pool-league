var express = require("express");
var router = express.Router();
const Joi = require("joi");
const knex = require("../db/knex");
const auth = require("../auth");

const eight_nine_ball_leagues = require("../models/eight_nine_ball_leagues");
const eight_nine_ball_fixtures = require("../models/eight_nine_ball_fixtures");

/* 
  GET handler for /api/89_ball_league
  Function: To get all the players detail in the 8ball/9ball league
*/
router.get("/", (req, res) => {
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

  eight_nine_ball_leagues
    .query()
    .where({ type: req.query.type })
    .orderBy("points", "desc")
    .orderBy("goalsFor", "desc")
    .orderBy("goalsAgainst", "asc")
    .orderBy("win", "desc")
    .then(
      players => {
        res.json(players);
      },
      e => {
        res.status(400).json(e);
      }
    );
});

/* 
  GET handler for /api/89_ball_league/:seasonId
  Function: To get all the players detail in the specific season
*/
router.get("/:seasonId", (req, res) => {
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

  eight_nine_ball_leagues
    .query()
    .where({ type: req.query.type, seasonId: seasonId })
    .orderBy("points", "desc")
    .orderBy("goalsFor", "desc")
    .orderBy("goalsAgainst", "asc")
    .orderBy("win", "desc")
    .then(
      players => {
        if (!players.length) res.status(404).send();
        else res.json(players);
      },
      e => {
        res.status(400).json(e);
      }
    );
});

/* 
  GET handler for /api/89_ball_league/:seasonId/asc
  Function: To get all the players detail in the specific season in ascending order
*/
router.get("/:seasonId/asc", (req, res) => {
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

  eight_nine_ball_leagues
    .query()
    .where({ type: req.query.type, seasonId: seasonId })
    .orderBy("staffName")
    .then(
      players => {
        if (!players.length) res.status(404).send();
        else res.json(players);
      },
      e => {
        res.status(400).json(e);
      }
    );
});

/* 
  POST handler for /api/89_ball_league/add/player
  Function: To add player to the 8 ball league (FUTURE USE)
*/
router.post("/add/player", auth.checkJwt, (req, res) => {
  const schema = {
    type: Joi.number()
      .integer()
      .required(),
    seasonId: Joi.number()
      .integer()
      .required(),
    staffName: Joi.string().required()
  };

  //Validation
  if (Joi.validate(req.body, schema, { convert: false }).error) {
    res.status(400).json({ status: "error", error: "Invalid data" });
    return;
  }

  knex("eight_nine_ball_seasons")
    .insert({
      type: req.body.type,
      seasonId: req.body.seasonId
    })
    .then(
      () => {
        knex("eight_nine_ball_leagues")
          .insert({
            type: req.body.type,
            seasonId: req.body.seasonId,
            staffName: req.body.staffName
          })
          .then(
            player => {
              res.json(player);
            },
            e => {
              res.status(400).json(e);
            }
          );
      },
      e => {
        res.status(400).json(e);
      }
    );
});

/* 
  POST handler for /api/89_ball_league/add/players
  Function: To add players to the 8 ball league (BATCH INSERT)
*/
router.post("/add/players", auth.checkJwt, (req, res) => {
  const schema = {
    type: Joi.number()
      .integer()
      .required(),
    seasonId: Joi.number()
      .integer()
      .required(),
    staffs: Joi.array().items(
      Joi.object({
        type: Joi.number()
          .integer()
          .required(),
        seasonId: Joi.number()
          .integer()
          .required(),
        staffName: Joi.string().required()
      })
    )
  };

  //Validation
  if (Joi.validate(req.body, schema, { convert: false }).error) {
    res.status(400).json({ status: "error", error: "Invalid data" });
    return;
  }

  knex("eight_nine_ball_seasons")
    .insert({
      type: req.body.type,
      seasonId: req.body.seasonId
    })
    .then(
      () => {
        knex.batchInsert("eight_nine_ball_leagues", req.body.staffs, 100).then(
          result => {
            if (result) {
              res.status(200).send();
            }
          },
          e => {
            res.status(400).send(e);
          }
        );
      },
      e => {
        res.status(400).json(e);
      }
    );
});

/* 
  DELETE handler for /api/89_ball_league/delete/player
  Function: To delete player from the league (NOTE YET IMPLEMENTED IN THE UI)
*/
router.delete("/delete/player", auth.checkJwt, (req, res) => {
  let staffName = req.body.staffName;
  let type = req.body.type;
  let seasonId = req.body.seasonId;
  var opponent, result, staffGoals, oppGoals;

  const schema = {
    type: Joi.number()
      .integer()
      .required(),
    seasonId: Joi.number()
      .integer()
      .required(),
    staffName: Joi.string().required()
  };

  //Validation
  if (Joi.validate(req.body, schema, { convert: false }).error) {
    res.status(400).json({ status: "error", error: "Invalid data" });
    return;
  }

  //search fixtures
  //where the name is detected, look at the scores
  //deduct opponents league points as necessary
  //delete fixture

  eight_nine_ball_fixtures
    .query()
    .where({ 
      type: type, 
      seasonId: seasonId,
      player1: staffName
    }).orWhere({
      type: type,
      seasonId: seasonId,
      player2: staffName
    })
    .then( //use players.length to get end of loop
      players => {
        if (!players.length) res.status(404).send();
        else{ 
          //from 0 to length-1
          //take opponents name
          //check if win etc
          //deduct accordingly
          for (let i = 0; i < players.length; i++) {
            if (players[i].player1 == staffName) {
              opponent = players[i].player2;
              if (players[i].score1 > players[i].score2) {

              }
            } else {
              opponent = players[i].player1;
            }

            if (player) {

            }
          }




          console.log(players.length)
          console.log(players[2].staffName + " mmmmm");
          res.json(players)};
      },
      e => {
        res.status(400).json(e);
      }
    );

/*
  //delete from league
  eight_nine_ball_leagues
    .query()
    .delete()
    .where({
      type: req.body.type,
      seasonId: req.body.seasonId,
      staffName: req.body.staffName
    })
    .then(
      result => {
        if (result === 0) {
          //Nothing deleted
          res.status(404).json();
        } else {
          //Something deleted
          res.status(204).send();
        }
      },
      e => {
        //Internal error
        res.status(500).send();
      }
    );
    */
});

module.exports = router;

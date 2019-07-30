var express = require("express");
var router = express.Router();
const _ = require("lodash");
const Joi = require("joi");
const knex = require("../db/knex");

const eight_nine_ball_fixtures = require("../models/eight_nine_ball_fixtures");
const eight_nine_ball_leagues = require("../models/eight_nine_ball_leagues");
const eight_nine_ball_seasons = require("../models/eight_nine_ball_seasons");
const hall_of_fame = require("../models/hall_of_fame");

/* 
  GET handler for /api/89ball_league/hall_of_fame 
  Function: To get the hall of fame
*/
router.get("/", async (req, res) => {
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

  hall_of_fame
    .query()
    .where({ type: req.query.type })
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
  POST handler for /api/89ball_league/hall_of_fame/calculate
  Function: To calculate win percentages
*/
router.post("/calculate", async (req, res) => {
  //post or patch? it does both - should it?
  type = req.body.type;
  let hof;
  let start = true;
  let names = ["", ""];
  const schema = {
    type: Joi.number()
      .integer()
      .required()
  };

  //Validation
  if (Joi.validate(req.body, schema, { convert: false }).error) {
    res.status(400).json({ status: "error", error: "Invalid data" });
    return;
  }

  let leagues = await eight_nine_ball_leagues.query().where({
    type: type
  });
  if (leagues === 0) {
    res.status(404).send();
  }

  //go through all league rows relevant
  for (let i = 0; i < leagues.length; i++) {
    hofRow = await hall_of_fame.query().findOne({
      type: type,
      staffName: leagues[i].staffName
    });

    //if the name isn't in the hall of fame, add it
    if (typeof hofRow === "undefined") { //TODO: this bit is buggy! will only add one user, then throw an error. why?
      knex("hall_of_fame")
        .insert({
          staffName: leagues[i].staffName,
          type: 8
        })
        .then(
          (hofRow = await hall_of_fame.query().findOne({
            //or length
            type: type,
            staffName: leagues[i].staffName
          }))
        );
    }

    //wipes values without need for extra db call loop
    //check if name has been called
    if (names.includes(leagues[i].staffName)) { 
      start = false;
    } else {
      start = true;
      names.push(leagues[i].staffName);
    }
    //if not, add it to the list and set its values to zero
    if (start == true) {
      hofRow.wins = 0;
      hofRow.plays = 0;
      hofRow.draws = 0;
      hofRow.punctuality = 0;
      hofRow.goalsAgainstTop = 0;
      hofRow.highestGF = 0;
      hofRow.scrappy = 0;
      hofRow.streak = 0;
      hofRow.improvement = 0;
      start = false;
    }

    //check if this season is the players best yet
    if (leagues[i].goalsFor > hofRow.highestGF) {
      hofRow.highestGF = leagues[i].goalsFor;
    }

    //check if improvement should be calculated
    let seasons = await eight_nine_ball_seasons.query().where({
      type: type
    });
    if (seasons.length > 3) { //only with more than 3 seasons
      if (i > seasons.length - 2) { //and only with the latest two
        hofRow.improvement = hofRow.improvement + leagues[i].win;
      } else {
        hofRow.wins = hofRow.wins + leagues[i].win;
      }
    } else {
      hofRow.wins = hofRow.wins + leagues[i].win;
    }

    //basic calculations to aid numerous features
    hofRow.plays = hofRow.plays + leagues[i].play;
    hofRow.draws = hofRow.draws + leagues[i].draw;
    //change this calculation when you look at how punctuality is actually done - aiming for a punct point per match played on time
    hofRow.punctuality = hofRow.punctuality + leagues[i].punctuality;
    hofRow.percentage = Math.trunc((hofRow.wins * 100) / hofRow.plays);
    hofRow.drawRate = Math.trunc((hofRow.draws * 100) / hofRow.plays);
    hofRow.punctRate = Math.trunc((hofRow.punctRate * 100) / hofRow.plays);

    //update the table
    await hall_of_fame
      .query()
      .findOne({
        type: type,
        staffName: leagues[i].staffName
      })
      .patch(hofRow);
  }

  //must go through fixtures to calculate streak. handle scrappy through here too
  let fixtures = await eight_nine_ball_fixtures.query().where({
    type: type
  });
  if (fixtures === 0) {
    res.status(404).send();
  }

  //needs the full HoF DB this time
  let hofAll = await hall_of_fame.query().where({ 
    type: type
  });
  if (fixtures === 0) {
    res.status(404).send();
  }

  let player1, player2 = 0;

  //now go through fixtures: needed for scrappy and streak calculations
  for (let i = 0; i < fixtures.length; i++) {
    //TODO i should be fired for writing code this bad

    //get the locations of the players from the main HoF table
    for (let j = 0; j < hofAll.length; j++) {
      if (hofAll[j].staffName == fixtures[i].player1) {
        player1 = j;
      } else if (hofAll[j].staffName == fixtures[i].player2) {
        player2 = j;
      } //TODO can't break because that gives a sexy little error
    }

    //update streak or reset as necessary. issues WILL arise if the scrappyRate calc is moved to the main loop
    if (fixtures[i].score1 > fixtures[i].score2) { //check which player won
      hofAll[player1].scrappyRate++;
      if (hofAll[player1].scrappyRate > hofAll[player1].streak) { //check if current streak is their best
        hofAll[player1].streak = hofAll[player1].scrappyRate; 
      }
      hofAll[player2].scrappyRate = 0; //reset opponents
    } else if (fixtures[i].score2 > fixtures[i].score1) {
      //no action for draws = do not affect current streak
      hofAll[player2].scrappyRate++;
      if (hofAll[player2].scrappyRate > hofAll[player2].streak) {
        hofAll[player2].streak = hofAll[player2].scrappyRate;
      }
      hofAll[player1].scrappyRate = 0;
    }

    //calculate scrappy: counts points against whoever top player is.
    let topPlayer = _.maxBy(hofAll, "percentage"); //get top player

    if (fixtures[i].name1 == topPlayer) {
      //check if the top player played in the fixture
      hofAll[player2].scrappy = hofAll[player2].scrappy + fixtures[i].score2; //if so, increment suitably
    } else if (fixtures[i].name2 == topPlayer) {
      hofAll[player1].scrappy = hofAll[player1].scrappy + fixtures[i].score1;
    }
  }

  //have to go through hof again for Scrappy - else no way to know who the top player is
  for (let i = 0; i < hofAll.length; i++) {
    hofAll[i].scrappyRate = Math.trunc(
      (hofAll[i].scrappy * 100) / hofAll[i].plays
    );
    hofAll[i].improvement = Math.trunc((hofAll[i].improvement * 100) / 2);

    let seasons = await eight_nine_ball_seasons.query().where({
      type: type
    });
    //calculate wins as suitable regarding improvement HoF
    if (seasons.length > 3) {
      hofAll[i].percentage = Math.trunc(
        (hofAll[i].wins * 100) / hofAll[i].plays - 2
      );
    } else {
      hofAll[i].percentage = Math.trunc(
        (hofAll[i].wins * 100) / hofAll[i].plays
      );
    }

    //patch db
    let hofAll2 = await hall_of_fame.query().findOne({
      type: type,
      staffName: hofAll[i].staffName
    });
    await hall_of_fame
      .query()
      .findOne({
        type: type,
        staffName: hofAll[i].staffName
      })
      .patch(hofAll2);
  }
  res.json(hofAll);
});

module.exports = router;

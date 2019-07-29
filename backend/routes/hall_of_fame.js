var express = require("express");
var router = express.Router();
const _ = require("lodash");
const Joi = require("joi");
const auth = require("../auth");
const knex = require("../db/knex");

const eight_nine_ball_fixtures = require("../models/eight_nine_ball_fixtures");
const eight_nine_ball_leagues = require("../models/eight_nine_ball_leagues");
const hall_of_fame = require("../models/hall_of_fame");

//delete player?

/* 
  GET handler for /api/89ball_league/hall_of_fame MAYBE
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
  let names = ["",""];
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
    hof = await hall_of_fame.query().findOne({
      type: type,
      staffName: leagues[i].staffName
    });

    //if the name isn't in the hall of fame, add it
    if (typeof hof === "undefined") {
      knex("hall_of_fame")
        .insert({
          staffName: leagues[i].staffName,
          type: 8,
        })
        .then(
          (hof = await hall_of_fame.query().findOne({
            //or length
            type: type,
            staffName: leagues[i].staffName
          }))
        );
    }

    //wipes values without need for extra db call loop
    if (names.includes(leagues[i].staffName)) {
      start = false;
    } else {
      start = true;
      names.push(leagues[i].staffName)
    }

    if (start == true) {
    hof.wins = 0;
    hof.plays = 0;
    hof.draws = 0;
    hof.punctuality = 0;
    start = false;
    }

    //look for best game ISSUE with 'cannot set property wins of undefined' at router.post
    if (leagues[i].goalsFor > hof.goalsFor) {
      hof.highestGF = leagues[i].goalsFor;
    }

    //calculations
    console.log("this is the hof rn " + hof.staffName)
    hof.wins = hof.wins + leagues[i].win;
    hof.plays = hof.plays + leagues[i].play;
    hof.draws = hof.draws + leagues[i].draw;
    hof.punctuality = hof.punctuality + leagues[i].punctuality;
    hof.percentage = Math.trunc((hof.wins * 100) / hof.plays);
    hof.drawRate = Math.trunc((hof.draws * 100) / hof.plays);
    hof.punctRate = Math.trunc((hof.punctRate * 100) / hof.plays);

    //patch
    let hof3 = await hall_of_fame
      .query()
      .findOne({
        type: type,
        staffName: leagues[i].staffName
      })
      .patch(hof);
  }

  let fixtures = await eight_nine_ball_fixtures.query().where({
    //must go through fixtures to calculate streak. handle scrappy through here too
    type: type
  });
  if (fixtures === 0) {
    res.status(404).send();
  }
  let hofAll = await hall_of_fame.query().where({
    //must go through fixtures to calculate streak. handle scrappy through here too
    type: type
  });
  if (fixtures === 0) {
    res.status(404).send();
  }

  let player1,
    player2 = 0;
  for (let i = 0; i < fixtures.length; i++) {
    //TODO i should be fired for writing code this bad

    for (let j = 0; j < hofAll.length; j++) {
      //find them in the hof table. locations stored and accessed through hofAll[player1].param
      if (hofAll[j].staffName == fixtures[i].name1) {
        player1 = j;
      } else if (hofAll[j].staffName == fixtures[i].name2) {
        player2 = j;
      } //TODO can't break because that gives a sexy little error
    }

    //update streak or reset as necessary. might need to store curStreak elsewhere if it kicks off about this
    if (fixtures[i].score1 > fixtures[i].score2) {
      //if player1 won
      hofAll[player1].curStreak++; //if this gives an error then you can't do this
      if (hofAll[player1].curStreak > hofAll[player1].streak) {
        hofAll[player1].streak = hofAll[player1].curStreak; //update streak
      }
      hofAll[player2].curStreak = 0; //no need to update this one. reset
    } else if (fixtures[i].score2 > fixtures[i].score1) {
      //not gonna do anything for draws. can keep streak but no increment.
      hofAll[player2].curStreak++;
      if (hofAll[player2].curStreak > hofAll[player2].streak) {
        hofAll[player2].streak = hofAll[player2].curStreak;
      }
      hofAll[player1].curStreak = 0;
    }

    //calculate scrappy. counts points against whoever top player is. could prob hardcode this to mal and noone would notice
    /*let topPlayer = maxBy(hofAll, "percentage"); //get top player. this might just not work
    //check if top player played in the fixture
    if (fixtures[i].name1 == topPlayer) {  //if so, increment suitably
      hofAll[player2].scrappy = hofAll[player2].scrappy + fixtures[i].score2;
    } else if (fixtures[i].name2 == topPlayer) {
      hofAll[player1].scrappy = hofAll[player1].scrappy + fixtures[i].score1;
    }*/
  }

  //have to go through hof AGAIN to calculate scrappy average
  /*for (let i = 0; i < hofAll.length; i++) {
    hofAll[i].scrappyRate = hofAll[i].scrappy / hofAll[i].plays;

    let hof4 = await hall_of_fame
      .query()
      .findOne({
        type: type,
        staffName: leagues[i].staffName
      })
      .patch(hofAll);
  }*/
  res.json(hofAll);
});

module.exports = router;

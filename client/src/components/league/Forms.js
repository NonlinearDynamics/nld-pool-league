import React from "react";

/* component for filling in the form in the league table */
const Forms = ({ form }) => {
  let formsToBeDisplayed = [];
  if (!form || form.length === 0) {
    form = "-----";
  }
  for (let i = 0; i < form.length; i++) {
    if (form.charAt(i) === "W") {
      formsToBeDisplayed = formsToBeDisplayed.concat(
        <div key={i} className="form-item">
          <div className="win-icon icon-24" alt="win" />
        </div>
      );
    } else if (form.charAt(i) === "D") {
      formsToBeDisplayed = formsToBeDisplayed.concat(
        <div key={i} className="form-item">
          <div className="draw-icon icon-24" alt="draw" />
        </div>
      );
    } else if (form.charAt(i) === "L") {
      formsToBeDisplayed = formsToBeDisplayed.concat(
        <div key={i} className="form-item">
          <div className="loss-icon icon-24" alt="loss" />
        </div>
      );
    } else if (form.charAt(i) === "-") {
      formsToBeDisplayed = formsToBeDisplayed.concat(
        <div key={i} className="form-item">
          <div className="no-game-icon icon-24" alt="no game" />
        </div>
      );
    }
  }
  return formsToBeDisplayed;
};

export default Forms;

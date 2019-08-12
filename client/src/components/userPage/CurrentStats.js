import React from "react";
import Forms from "../league/Forms";

const CurrentStats = props => {
  console.log(props.form);
  return (
    <div>
      <h2 style={{ textAlign: "left", marginLeft: "18px" }}>Current Season:</h2>
      <div className="current-stats">
        <div className="current-league-pos">
          <h4>Current League Position:</h4>
          <div className="stat">{props.getLeaguePos}</div>
        </div>
        <div className="current-form">
          <h4>Form:</h4>
          <Forms form={props.form} />
        </div>
      </div>
    </div>
  );
};

export default CurrentStats;

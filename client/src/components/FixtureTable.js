import React from "react";
import FixtureTableBody from "./FixtureTableBody";

const FixtureTable = props => {
  return (
    <div className="fixtureTableContainer">
      <h3>List of Fixtures</h3>
      <table className="fixtureTable" cellSpacing="0">
        <thead>
          <tr>
            <th>Score</th>
            <th>Name</th>
            <th />
            <th>Name</th>
            <th>Score</th>
          </tr>
        </thead>
        <FixtureTableBody fixtures={props.fixtures} />
      </table>
    </div>
  );
};

export default FixtureTable;

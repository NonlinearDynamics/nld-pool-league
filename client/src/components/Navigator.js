import React from "react";

const Navigator = props => {
  var currentStyle = {
    fontWeight: "bold"
  };

  var current = props.current;
  const itemsToBeDisplayed = props.items.map(item =>
    current == item ? (
      <li>
        <a href="" style={currentStyle}>
          {item}
        </a>
      </li>
    ) : (
      <li>
        <a href="">{item}</a>
      </li>
    )
  );

  return (
    <div className="nav">
      <h2>{props.title}</h2>
      <ul>{itemsToBeDisplayed}</ul>
    </div>
  );
};

export default Navigator;

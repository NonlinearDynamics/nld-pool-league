import React from "react";
import Collapsible from "./Collapsible.js";
import { Link, matchPath } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import auth0Client from "../../Auth";

const SubNavBar = props => {
  var currentPath = window.location.pathname;

  var icon = matchPath(currentPath, { path: "/8-ball", exact: false }) ? (
    <div className="eight-ball-icon" alt="eight ball" />
  ) : matchPath(currentPath, { path: "/9-ball", exact: false }) ? (
    <div className="nine-ball-icon" alt="nine ball" />
  ) : (
    "TYPE ERROR"
  );

  /* set the title of the nav bar depending on the URL path */
  var title =
    matchPath(currentPath, { path: "/8-ball/seasons", exact: false }) ||
    matchPath(currentPath, { path: "/8-ball/hall_of_fame", exact: false }) ||
    matchPath(currentPath, { path: "/8-ball/dashboard", exact: false })
      ? "8-Ball"
      : matchPath(currentPath, { path: "/8-ball/overview" }) ||
        matchPath(currentPath, { path: "/8-ball/fixtures" })
      ? "8-Ball Season " + props.activeSeason
      : matchPath(currentPath, { path: "/9-ball/seasons", exact: false }) ||
        matchPath(currentPath, {
          path: "/9-ball/hall_of_fame",
          exact: false
        }) ||
        matchPath(currentPath, { path: "/9-ball/dashboard", exact: false })
      ? "9-Ball"
      : matchPath(currentPath, { path: "/9-ball/overview" }) ||
        matchPath(currentPath, { path: "/9-ball/fixtures" })
      ? "9-Ball Season " + props.activeSeason
      : "Billiards";

  /* makes 'All Seasons' link bold */
  var seasonsCurrentStyle = matchPath(currentPath, {
    path: "*/seasons",
    exact: false
  })
    ? {
        fontWeight: "bold"
      }
    : {};

  /* makes 'fixtures' link bold */
  var fixturesCurrentStyle = matchPath(currentPath, {
    path: "*/fixtures",
    exact: false
  })
    ? {
        fontWeight: "bold"
      }
    : {};

  /* makes 'current season' link bold */
  var currentSeasonCurrentStyle = matchPath(currentPath, {
    path: "*/overview",
    exact: false
  })
    ? {
        fontWeight: "bold"
      }
    : {};

  /* makes 'hall of fame' link bold */
  var hallOfFameCurrentStyle = matchPath(currentPath, {
    path: "*/hall_of_fame",
    exact: false
  })
    ? {
        fontWeight: "bold"
      }
    : {};

  /* makes 'dashboard' link bold */
  var dashboardCurrentStyle = matchPath(currentPath, {
    path: "*/dashboard",
    exact: false
  })
    ? {
        fontWeight: "bold"
      }
    : {};

  /* makes 'kitty' link bold */
  var kittyCurrentStyle = matchPath(currentPath, {
    path: "*/kitty",
    exact: false
  })
    ? {
        fontWeight: "bold"
      }
    : {};

  const seasonFixtureLink = path => {
    if (props.type !== "Billiards") {
      if (props.activeSeason === undefined) {
        if (props.latestSeason === null) {
          return (
            <span>
              <li>
                <Link
                  to={`/${path}/hall_of_fame`}
                  style={hallOfFameCurrentStyle}
                  id="HoFLink"
                >
                  Hall of Fame
                </Link>
              </li>
              <li>
                <Link
                  to={`/${path}/kitty`}
                  style={kittyCurrentStyle}
                  id="KittyLink"
                >
                  Kitty
                </Link>
              </li>
            </span>
          );
        } else {
          return (
            <span>
              <li>
                <Link
                  to={`/${path}/overview/${props.latestSeason}`}
                  style={currentSeasonCurrentStyle}
                  id="fixturesLink"
                >
                  Current Season
                </Link>
              </li>
              <li>
                <Link
                  to={`/${path}/fixtures/${props.latestSeason}`}
                  style={fixturesCurrentStyle}
                  id="fixturesLink"
                >
                  Arrange Fixtures
                </Link>
              </li>
              <li>
                <Link
                  to={`/${path}/hall_of_fame`}
                  style={hallOfFameCurrentStyle}
                  id="HoFLink"
                >
                  Hall of Fame
                </Link>
              </li>
              <li>
                <Link
                  to={`/${path}/kitty`}
                  style={kittyCurrentStyle}
                  id="KittyLink"
                >
                  Kitty
                </Link>
              </li>
            </span>
          );
        }
      } else {
        return (
          <span>
            <li>
              <Link
                to={`/${path}/overview/${props.activeSeason}`}
                style={currentSeasonCurrentStyle}
                id="fixturesLink"
              >
                Current Season
              </Link>
            </li>
            <li>
              <Link
                to={`/${path}/fixtures/${props.activeSeason}`}
                style={fixturesCurrentStyle}
                id="fixturesLink"
              >
                Arrange Fixtures
              </Link>
            </li>
            <li>
              <Link
                to={`/${path}/hall_of_fame`}
                style={hallOfFameCurrentStyle}
                id="HoFLink"
              >
                Hall of Fame
              </Link>
            </li>
            <li>
              <Link
                to={`/${path}/kitty`}
                style={kittyCurrentStyle}
                id="KittyLink"
              >
                Kitty
              </Link>
            </li>
          </span>
        );
      }
    }
  };

  return (
    <div className="subnav">
      <ToastContainer />
      {icon}
      <div className="nav">
        <h2
          style={{
            width: "250px",
            marginRight: "1.5rem"
          }}
        >
          {title}
        </h2>
        <ul className="main-items">
          <li>
            {props.type !== "Billiards" ? (
              <Link
                to={`/${props.type}-ball/seasons`}
                style={seasonsCurrentStyle}
                id="seasonsLink"
              >
                All Seasons
              </Link>
            ) : (
              <Link
                to={`/${props.type}/seasons`}
                style={seasonsCurrentStyle}
                id="seasonsLink"
              >
                All Seasons
              </Link>
            )}
          </li>
          {props.type !== "Billiards"
            ? seasonFixtureLink(`${props.type}-ball`)
            : seasonFixtureLink(`Billiards`)}

          <li>
            {!auth0Client.isAuthenticated() ? null : props.type !==
              "Billiards" ? (
              <Link
                to={`/${props.type}-ball/dashboard`}
                style={dashboardCurrentStyle}
                id="seasonsLink"
              >
                My Dashboard
              </Link>
            ) : (
              <Link
                to={`/${props.type}/dashboard`}
                style={dashboardCurrentStyle}
                id="seasonsLink"
              >
                My Dashboard
              </Link>
            )}
          </li>
        </ul>
      </div>
      <Collapsible
        type={props.type}
        seasonFixtureLink={seasonFixtureLink}
        seasonsCurrentStyle={seasonsCurrentStyle}
        dashboardCurrentStyle={dashboardCurrentStyle}
      />
    </div>
  );
};

export default SubNavBar;

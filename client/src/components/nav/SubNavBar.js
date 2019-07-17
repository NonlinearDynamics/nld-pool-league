import React from "react";
import { Link, matchPath } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

const SubNavBar = props => {
  var currentPath = window.location.pathname;

  /* set the title of the nav bar depending on the URL path */
  var title = matchPath(currentPath, { path: "/8-ball/seasons", exact: false })
    ? "8-Ball"
    : matchPath(currentPath, { path: "/8-ball/overview" }) ||
      matchPath(currentPath, { path: "/8-ball/fixtures" })
    ? "8-Ball Season " + props.activeSeason
    : matchPath(currentPath, { path: "/9-ball/seasons", exact: false })
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

  const toastSeasonNotFound = () => {
    toast.error("⛔Season not found! Try again or create a new season", {
      position: "top-center",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  };

  const seasonFixtureLink = path => {
    if (props.type !== "Billiards") {
      if (props.activeSeason === undefined) {
        if (props.latestSeason === null) {
          return (
            <span>
              <li>
                <Link onClick={() => toastSeasonNotFound()}>Latest Season</Link>
              </li>
              <li>
                <Link onClick={() => toastSeasonNotFound()}>
                  Arrange Fixtures
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
          </span>
        );
      }
    }
  };

  return (
    <div className="subnav">
      <ToastContainer />
      <div className="nav">
        <h2>{title}</h2>
        <ul>
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
        </ul>
      </div>
    </div>
  );
};

export default SubNavBar;

import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import LandingPage from "./components/LandingPage.js";
import App from "./components/LeaguePage";
import SeasonsPage from "./components/SeasonsPage.js";
import FixturesPage from "./components/FixturesPage.js";
import NotFound from "./components/NotFound";

ReactDOM.render(
  <Router>
    <div>
      <Switch>
        <Route exact path="/" component={LandingPage} />
        <Route path="*/overview" component={App} />
        <Route path="*/seasons" component={SeasonsPage} />
        <Route path="*/fixtures" component={FixturesPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  </Router>,
  document.getElementById("root")
);

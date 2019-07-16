import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  withRouter
} from "react-router-dom";
import LandingPage from "./LandingPage.js";
import LeaguePage from "./LeaguePage";
import SeasonsPage from "./SeasonsPage.js";
import FixturesPage from "./FixturesPage";
import NotFound from "./NotFound";

import Callback from "../Callback";

const App = () => {
  return (
    <div>
      <Switch>
        <Route path="/" exact component={LandingPage} />
        <Route
          path="/:type(8|9)-ball/overview/:seasonId?"
          component={LeaguePage}
        />
        <Route
          path="/:type(billiards)/overview/:seasonId?"
          component={LeaguePage}
        />
        <Route path="/:type(8|9)-ball/seasons" component={SeasonsPage} />
        <Route path="/:type(billiards)/seasons" component={SeasonsPage} />
        <Route path="/:type(8|9)-ball/fixtures" component={FixturesPage} />
        <Route path="/:type(billiards)/fixtures" component={FixturesPage} />
        <Route path="/callback" component={Callback} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
};

export default withRouter(App);

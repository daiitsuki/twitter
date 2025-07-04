import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../routes/Home";
import Auth from "../routes/Auth";
import Navigation from "./Navigation";
import Profile from "../routes/Profile";

const AppRouter = ({ refreshUserData, isLoggedIn, userInfo }) => {
  return (
    <div className="container">
      <Router>
        {isLoggedIn && <Navigation userInfo={userInfo} />}
        <Routes>
          {isLoggedIn ? (
            <>
              <Route path="/" element={<Home userInfo={userInfo} />} />
              <Route
                path="/profile"
                element={
                  <Profile
                    refreshUserData={refreshUserData}
                    userInfo={userInfo}
                  />
                }
              />
            </>
          ) : (
            <Route path="/" element={<Auth />} />
          )}
        </Routes>
      </Router>
    </div>
  );
};

export default AppRouter;

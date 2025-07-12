import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../routes/Home";
import Auth from "../routes/Auth";
import Navigation from "./Navigation";
import Profile from "../routes/Profile";

const AppRouter = ({
  isLoggedIn,
  userInfo,
  loginWithNickname,
  logout,
  updateUserDisplayName,
  updateUserMsgSettings,
}) => {
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
                    userInfo={userInfo}
                    logout={logout}
                    updateUserDisplayName={updateUserDisplayName}
                    updateUserMsgSettings={updateUserMsgSettings}
                  />
                }
              />
            </>
          ) : (
            <Route
              path="/"
              element={<Auth loginWithNickname={loginWithNickname} />}
            />
          )}
        </Routes>
      </Router>
    </div>
  );
};

export default AppRouter;

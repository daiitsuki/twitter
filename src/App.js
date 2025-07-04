import "./fbase";

import { useEffect, useState } from "react";
import AppRouter from "./components/Router";
import { authService, dbService } from "./fbase";
import { doc, getDoc, setDoc } from "firebase/firestore";

function App() {
  const [init, setInit] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({});

  const refreshUserData = () => {
    const user = authService.currentUser;
    setUserInfo({
      displayName: user.displayName,
      uid: user.uid,
      updateProfile: () =>
        user.updateProfile(user, { displayName: user.displayName }),
    });
  };

  const onAuthStateChange = async () => {
    authService.onAuthStateChanged(async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUserInfo({
          displayName: user.displayName,
          uid: user.uid,
          updateProfile: () =>
            user.updateProfile(user, { displayName: user.displayName }),
        });
        /*      const swRegistration = await navigator.serviceWorker.register(
          `${process.env.PUBLIC_URL}/firebase-messaging-sw.js`
        ); */
        /*  const token = await getToken(messaging, {
          vapidKey:
            "BHSrTsbuFPyMNqqrt6r9SMRG3ysncEjssMu3k3LUsP_IcTxpF5Dy3ntvkpkG9DGL6ooh_X8_NfIr23R5gnD3jmg",
          serviceWorkerRegistration: swRegistration,
        });
        setMsgToken(token); */

        const docRef = doc(dbService, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, {
            displayName: user.displayName,
            uid: user.uid,
          });
        }
      } else {
        setIsLoggedIn(false);
        setUserInfo(null);
      }
      setInit(true);
    });
  };

  useEffect(() => {
    onAuthStateChange();
  }, []);

  return (
    <>
      {init ? (
        <AppRouter
          refreshUserData={refreshUserData}
          isLoggedIn={isLoggedIn}
          userInfo={userInfo}
        />
      ) : (
        "로딩중..."
      )}
      <footer>&copy; daiitsuki {new Date().getFullYear()}</footer>
    </>
  );
}

export default App;

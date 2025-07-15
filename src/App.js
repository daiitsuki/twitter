import "./fbase";
import { useEffect, useState } from "react";
import AppRouter from "./components/Router";
import { dbService, messaging } from "./fbase";
import { doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { getToken } from "firebase/messaging";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("simple-auth-user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (!parsedUser.forceLogout) {
        localStorage.removeItem("simple-auth-user");
      } else {
        setUserInfo(parsedUser);
        setIsLoggedIn(true);
      }
    }
  }, []);

  const loginWithNickname = async (nickname) => {
    const uid = uuidv4();
    let msgToken = null;

    try {
      const registration = await navigator.serviceWorker.getRegistration(
        "/twitter/"
      );
      if (registration) {
        msgToken = await getToken(messaging, {
          vapidKey:
            "BHSrTsbuFPyMNqqrt6r9SMRG3ysncEjssMu3k3LUsP_IcTxpF5Dy3ntvkpkG9DGL6ooh_X8_NfIr23R5gnD3jmg",
          serviceWorkerRegistration: registration,
        });
      } else {
        console.warn("서비스 워커가 등록되지 않았습니다.");
      }
    } catch (err) {
      console.warn("FCM 토큰 가져오기 실패", err);
    }

    const userData = {
      uid,
      displayName: nickname,
      createdAt: Date.now(),
      msgToken: msgToken || null,
      forceLogout: true,
    };

    try {
      await setDoc(doc(dbService, "users", uid), userData);
      localStorage.setItem("simple-auth-user", JSON.stringify(userData));
      setUserInfo(userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("유저 정보 저장 실패:", error);
    }
  };

  const logout = async () => {
    if (userInfo && userInfo.uid) {
      try {
        await deleteDoc(doc(dbService, "users", userInfo.uid));
      } catch (error) {
        console.error("Error deleting user from database: ", error);
      }
    }
    localStorage.removeItem("simple-auth-user");
    setUserInfo(null);
    setIsLoggedIn(false);
  };

  const updateUserDisplayName = async (newDisplayName) => {
    try {
      // Firebase Auth의 현재 사용자 프로필 업데이트
      // 현재 App.js에는 authService가 import 되어있지 않으므로, fbase.js에서 가져와야 합니다.
      // 임시로 userInfo.uid를 사용하여 로컬 스토리지와 userInfo 상태만 업데이트합니다.
      // 실제 Firebase Auth 사용 시에는 authService.currentUser를 사용해야 합니다.
      const updatedUserInfo = { ...userInfo, displayName: newDisplayName };
      localStorage.setItem("simple-auth-user", JSON.stringify(updatedUserInfo));
      setUserInfo(updatedUserInfo);
    } catch (error) {
      console.error("프로필명 업데이트 실패:", error);
    }
  };

  const updateUserMsgSettings = async (msgToken, enabled) => {
    const userRef = doc(dbService, "users", userInfo.uid);
    await updateDoc(userRef, {
      notificationsEnabled: enabled,
      ...(msgToken && !userInfo.msgToken ? { msgToken } : {}), // 토큰 새로 받았을 때만 저장
    });

    const updatedUser = {
      ...userInfo,
      notificationsEnabled: enabled,
      msgToken: msgToken ?? userInfo.msgToken,
    };

    localStorage.setItem("simple-auth-user", JSON.stringify(updatedUser));
    setUserInfo(updatedUser);
  };

  useEffect(() => {
    const swPath = `${process.env.PUBLIC_URL}/firebase-messaging-sw.js?apiKey=${process.env.REACT_APP_API_KEY}&authDomain=${process.env.REACT_APP_AUTH_DOMAIN}&projectId=${process.env.REACT_APP_PROJECT_ID}&storageBucket=${process.env.REACT_APP_STORAGE_BUCKET}&messagingSenderId=${process.env.REACT_APP_MESSAGING_SENDER_ID}&appId=${process.env.REACT_APP_APP_ID}`;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration(swPath).then((registration) => {
        if (registration) {
          console.log(
            "이미 등록된 서비스 워커가 있습니다. 업데이트를 시도합니다."
          );
          registration.update();
        } else {
          navigator.serviceWorker
            .register(swPath)
            .then((registration) => {
              console.log("서비스 워커 등록 성공", registration);
            })
            .catch((error) => {
              console.error("서비스 워커 등록 실패", error);
            });
        }
      });
    }
  }, []);

  return (
    <>
      <AppRouter
        isLoggedIn={isLoggedIn}
        userInfo={userInfo}
        loginWithNickname={loginWithNickname}
        logout={logout}
        updateUserDisplayName={updateUserDisplayName}
        updateUserMsgSettings={updateUserMsgSettings}
      />
      <footer>&copy; daiitsuki {new Date().getFullYear()}</footer>
    </>
  );
}

export default App;

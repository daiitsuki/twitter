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
  const [msgToken, setMsgToken] = useState("");

  useEffect(() => getTokenF, []);

  const getTokenF = async () => {
    try {
      // 수정 2: PUBLIC_URL 기반으로 경로 생성
      const registration = await navigator.serviceWorker.getRegistration(
        "/twitter/"
      );

      if (registration) {
        const token = await getToken(messaging, {
          vapidKey:
            "BHSrTsbuFPyMNqqrt6r9SMRG3ysncEjssMu3k3LUsP_IcTxpF5Dy3ntvkpkG9DGL6ooh_X8_NfIr23R5gnD3jmg",
          serviceWorkerRegistration: registration,
        });
        setMsgToken(token);
      } else {
        console.warn("서비스 워커가 등록되지 않았습니다.");
      }
    } catch (err) {
      console.warn("FCM 토큰 가져오기 실패", err);
    }
  };

  const loginWithNickname = async (nickname) => {
    const uid = uuidv4();

    const userData = {
      uid,
      displayName: nickname,
      createdAt: Date.now(),
      msgToken: msgToken,
      notificationsEnabled: true,
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
    if (!userInfo || !userInfo.uid) {
      console.error("사용자 정보가 없습니다.");
      return;
    }

    try {
      const userRef = doc(dbService, "users", userInfo.uid);
      await updateDoc(userRef, {
        displayName: newDisplayName,
      });

      const updatedUserInfo = { ...userInfo, displayName: newDisplayName };
      localStorage.setItem("simple-auth-user", JSON.stringify(updatedUserInfo));
      setUserInfo(updatedUserInfo);
    } catch (error) {
      console.error("프로필명 업데이트 실패:", error);
    }
  };

  const updateUserMsgSettings = async (msgToken, enabled) => {
    // 수정 4: userInfo null 체크 추가
    if (!userInfo || !userInfo.uid) {
      console.warn("사용자 정보가 없어 알림 설정을 업데이트할 수 없습니다.");
      return;
    }

    const userRef = doc(dbService, "users", userInfo.uid);
    const updateData = {
      notificationsEnabled: enabled,
    };

    if (msgToken && msgToken !== userInfo.msgToken) {
      updateData.msgToken = msgToken;
    }

    await updateDoc(userRef, updateData);

    const updatedUser = {
      ...userInfo,
      notificationsEnabled: enabled,
      msgToken: msgToken ?? userInfo.msgToken,
    };

    localStorage.setItem("simple-auth-user", JSON.stringify(updatedUser));
    setUserInfo(updatedUser);
  };

  // 서비스워커 초기화 및 재등록
  useEffect(() => {
    const swPath = `${process.env.PUBLIC_URL}/firebase-messaging-sw.js?apiKey=${process.env.REACT_APP_API_KEY}&authDomain=${process.env.REACT_APP_AUTH_DOMAIN}&projectId=${process.env.REACT_APP_PROJECT_ID}&storageBucket=${process.env.REACT_APP_STORAGE_BUCKET}&messagingSenderId=${process.env.REACT_APP_MESSAGING_SENDER_ID}&appId=${process.env.REACT_APP_APP_ID}`;

    const cleanupAndRegister = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((r) => r.unregister()));
          console.log("기존 서비스 워커를 모두 해제했습니다.");

          const registration = await navigator.serviceWorker.register(swPath);
          console.log("최신 서비스 워커 등록 성공:", registration);
        } catch (error) {
          console.error("서비스 워커 정리 및 재등록 실패:", error);
        }
      }
    };

    cleanupAndRegister();
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

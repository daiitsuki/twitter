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
    if (!userInfo || !userInfo.uid) {
      console.error("사용자 정보가 없습니다.");
      return;
    }

    try {
      // 1. Firestore 데이터 업데이트
      const userRef = doc(dbService, "users", userInfo.uid);
      await updateDoc(userRef, {
        displayName: newDisplayName,
      });

      // 2. 로컬 상태 및 localStorage 업데이트
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

    const cleanupAndRegister = async () => {
      if ("serviceWorker" in navigator) {
        try {
          // 기존에 등록된 모든 서비스 워커를 가져옵니다.
          const registrations =
            await navigator.serviceWorker.getRegistrations();

          // 모든 서비스 워커를 해제합니다.
          const unregisterPromises = registrations.map((registration) =>
            registration.unregister()
          );
          await Promise.all(unregisterPromises);
          console.log("기존 서비스 워커를 모두 해제했습니다.");

          // 최신 서비스 워커를 새로 등록합니다.
          const registration = await navigator.serviceWorker.register(swPath);
          console.log("최신 서비스 워커 등록 성공:", registration);
        } catch (error) {
          console.error("서비스 워커 정리 및 재등록 실패:", error);
        }
      }
    };

    cleanupAndRegister();
  }, []);

  useEffect(() => {
    const updateMsgToken = async () => {
      if (!userInfo?.uid) return;

      try {
        const registration = await navigator.serviceWorker.getRegistration(
          process.env.PUBLIC_URL
        );
        if (!registration) {
          console.warn("서비스 워커 등록되지 않음");
          return;
        }

        const newToken = await getToken(messaging, {
          vapidKey:
            "BHSrTsbuFPyMNqqrt6r9SMRG3ysncEjssMu3k3LUsP_IcTxpF5Dy3ntvkpkG9DGL6ooh_X8_NfIr23R5gnD3jmg", // ← 기존 사용하던 키
          serviceWorkerRegistration: registration,
        });

        if (newToken && newToken !== userInfo.msgToken) {
          await updateUserMsgSettings(newToken, true); // Firestore 및 localStorage 업데이트
          console.log("📲 FCM 토큰 갱신됨:", newToken);
        } else {
          console.log("✅ 기존 FCM 토큰 유지:", newToken);
        }
      } catch (err) {
        console.warn("FCM 토큰 확인/갱신 실패:", err);
      }
    };

    updateMsgToken();
  }, [userInfo]);

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

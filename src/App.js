import "./fbase";
import { useEffect, useState } from "react";
import AppRouter from "./components/Router";
import { dbService } from "./fbase";
import { collection, addDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("simple-auth-user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUserInfo(parsedUser);
      setIsLoggedIn(true);
    }
  }, []);

  const loginWithNickname = async (nickname) => {
    const uid = uuidv4();
    const userData = {
      uid,
      displayName: nickname,
      createdAt: Date.now(),
    };
    try {
      await addDoc(collection(dbService, "users"), userData);
      localStorage.setItem("simple-auth-user", JSON.stringify(userData));
      setUserInfo(userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("유저 정보 저장 실패:", error);
    }
  };

  const logout = () => {
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

  return (
    <>
      <AppRouter
        isLoggedIn={isLoggedIn}
        userInfo={userInfo}
        loginWithNickname={loginWithNickname}
        logout={logout}
        updateUserDisplayName={updateUserDisplayName}
      />
      <footer>&copy; daiitsuki {new Date().getFullYear()}</footer>
    </>
  );
}

export default App;

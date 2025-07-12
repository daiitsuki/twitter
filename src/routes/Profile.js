import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Profile.module.css";
import { getToken } from "firebase/messaging";
import { messaging } from "../fbase";
import { faBell, faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Profile = ({
  userInfo,
  logout,
  updateUserDisplayName,
  updateUserMsgSettings,
}) => {
  const [newProfileName, setNewProfileName] = useState(userInfo.displayName);
  const navigate = useNavigate();

  const onLogOutClick = () => {
    logout();
    navigate("/");
  };

  const onChange = (event) => setNewProfileName(event.target.value);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (newProfileName.trim() && newProfileName !== userInfo.displayName) {
      await updateUserDisplayName(newProfileName);
      alert("프로필명이 변경되었습니다.");
    }
  };

  const toggleNotification = async () => {
    // 알림 끄기
    if (userInfo.notificationsEnabled) {
      await updateUserMsgSettings(userInfo.msgToken, false);
      return;
    }

    // 알림 켜기
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        await updateUserMsgSettings(userInfo.msgToken, false);
        return;
      }

      let token = userInfo.msgToken;
      if (!token) {
        token = await getToken(messaging, {
          vapidKey:
            "BHSrTsbuFPyMNqqrt6r9SMRG3ysncEjssMu3k3LUsP_IcTxpF5Dy3ntvkpkG9DGL6ooh_X8_NfIr23R5gnD3jmg",
          serviceWorkerRegistration: await navigator.serviceWorker.register(
            "/twitter/firebase-messaging-sw.js",
            { scope: "/twitter/" }
          ),
        });
      }

      if (token) {
        await updateUserMsgSettings(token, true);
      } else {
        await updateUserMsgSettings(null, false); // 예외적으로 null 처리
      }
    } catch (error) {
      console.error("알림 설정 실패:", error);
      await updateUserMsgSettings(userInfo.msgToken, false);
    }
  };

  return (
    <>
      <div className={styles.profile}>
        <div className={styles.userName}>{userInfo.displayName}님의 프로필</div>
        <span>프로필명 변경</span>
        <form onSubmit={onSubmit} className={styles.form}>
          <input
            type="text"
            value={newProfileName}
            onChange={onChange}
            className={styles.inputText}
            placeholder="최대 30자까지 입력 가능합니다."
            maxLength={30}
            required
          />
          <input type="submit" value="변경" className={styles.confirm} />
        </form>
        <br />
        <span>알림 설정</span>
        <div className={styles.form}>
          <span className={styles.inputText} style={{ textAlign: "center" }}>
            {userInfo.notificationsEnabled
              ? "알림을 받는 중"
              : "알림을 받지 않습니다."}
          </span>
          <button onClick={toggleNotification} className={styles.confirm}>
            {userInfo.notificationsEnabled ? (
              <FontAwesomeIcon
                icon={faBell}
                size="xl"
                style={{ color: "#3a1d1d" }}
              />
            ) : (
              <FontAwesomeIcon
                icon={faBellSlash}
                size="xl"
                style={{ color: "#3a1d1d" }}
              />
            )}
          </button>
        </div>
      </div>

      <button onClick={onLogOutClick} className={styles.logOut}>
        로그아웃
      </button>
    </>
  );
};

export default Profile;

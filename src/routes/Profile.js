import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Profile.module.css";

const Profile = ({ userInfo, logout, updateUserDisplayName }) => {
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
          <input
            value={"알림 설정 준비중입니다."}
            className={styles.inputText}
            disabled
          />
        </div>
      </div>

      <button onClick={onLogOutClick} className={styles.logOut}>
        로그아웃
      </button>
    </>
  );
};

export default Profile;

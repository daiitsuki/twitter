import { useState } from "react";
import styles from "./Auth.module.css";

const Auth = ({ loginWithNickname }) => {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const onChange = (e) => setNickname(e.target.value);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    await loginWithNickname(nickname);
  };

  return (
    <div className={styles.container}>
      <form onSubmit={onSubmit} className={styles.form}>
        <input
          className={styles.inputText}
          type="text"
          value={nickname}
          onChange={onChange}
          placeholder="닉네임을 입력하세요"
          maxLength={30}
        />
        <input className={styles.button} type="submit" value="입장하기" />
        <span className={styles.error}>{error}</span>
      </form>
    </div>
  );
};

export default Auth;

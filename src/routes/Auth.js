import { useState } from "react";
import styles from "./Auth.module.css";

const Auth = ({ loginWithNickname }) => {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onChange = (e) => {
    const {
      target: { name, value },
    } = e;
    if (name === "nickname") {
      setNickname(value);
    } else if (name === "password") {
      setPassword(value);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    if (password !== process.env.REACT_APP_LOGIN_CODE) {
      setError("코드가 일치하지 않습니다.");
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
          name="nickname"
          value={nickname}
          onChange={onChange}
          placeholder="닉네임을 입력하세요"
          maxLength={30}
        />
        <input
          className={styles.inputText}
          type="password"
          name="password"
          value={password}
          onChange={onChange}
          placeholder="우리의 기념일! 4자리 숫자"
        />
        <input className={styles.button} type="submit" value="입장하기" />
        <span className={styles.error}>{error}</span>
      </form>
    </div>
  );
};

export default Auth;

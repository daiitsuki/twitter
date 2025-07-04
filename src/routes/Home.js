import Tweet from "../components/Tweet";
import { dbService, storageService } from "../fbase";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import styles from "./Home.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faXmark } from "@fortawesome/free-solid-svg-icons";

const Home = ({ userInfo }) => {
  const [tweet, setTweet] = useState("");
  const [tweets, setTweets] = useState([]);
  const [attachment, setAttachment] = useState();

  useEffect(() => {
    const q = query(
      collection(dbService, "tweets"),
      orderBy("createdAt", "desc"),
      //////////////////////
      //  20개로 개수제한  //
      //////////////////////
      limit(20)
    );
    onSnapshot(q, (snapshot) => {
      const tweetArr = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTweets(tweetArr);
    });
  }, []);

  const onChange = (event) => {
    setTweet(event.target.value);
  };
  const onSubmit = async (event) => {
    event.preventDefault();

    /*   // 현서 토큰
    const msgToken1 = (
      await getDoc(doc(dbService, "users", "GAdhAZcnfKPk9Cme37xvRPTQ9Z03"))
    ).data().msgToken;

    // 내 토큰
    const msgToken2 = (
      await getDoc(doc(dbService, "users", "LKzKN0SV2AeFfgMUG8t3aKKaBz62"))
    ).data().msgToken; */

    let attachmentUrl = null;
    if (attachment) {
      const attachmentRef = ref(storageService, ` ${userInfo.uid}/${uuidv4()}`);

      const metadata = {
        cacheControl: "public,max-age=31536000",
      };

      await uploadString(attachmentRef, attachment, "data_url", metadata);
      attachmentUrl = await getDownloadURL(attachmentRef);
    }

    await addDoc(collection(dbService, "tweets"), {
      text: tweet,
      createdAt: Date.now(),
      uid: userInfo.uid,
      name: userInfo.displayName,
      attachmentUrl,
      edited: false,
      liked: false,
    });
    setTweet("");
    setAttachment(null);

    /*    let toUser;
    if (userInfo.uid === "GAdhAZcnfKPk9Cme37xvRPTQ9Z03") {
      toUser = msgToken1;
    } else if (userInfo.uid === "LKzKN0SV2AeFfgMUG8t3aKKaBz62") {
      toUser = msgToken2;
    }
    console.log(); */

    /*  fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "key=AAAAsVxo5vQ:APA91bE_xs8msCipHiLIr9Jfd3TOX2Ub3s1Pti0nDLEoTLjC2pi8AWv7rOcI8bgneSxXiSCxSQFB-v8jiE73PvTP43GZjTQivoHSJVK2WB3PyDxNACZvytnSpvNXbFU7HmsgKh839UKG",
      },
      body: JSON.stringify({
        to: toUser,
        notification: {
          title: "달톡",
          body: ${userInfo.displayName}: ${
            attachmentUrl ? "(사진을 보냈습니다)" : ""
          } ${tweet},
          icon: "https://i.ibb.co/gRgZKdS/logo96.png",
          image: attachmentUrl,
        },
      }),
    }).then((res) => {
      if (res.ok) {
        console.log("생성이 완료 되었습니다.");
      }
    }); */
  };

  const onFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const image = new Image();
      image.onload = () => {
        // 캔버스를 통해 이미지 크기 줄이기 (1/4 크기)
        const canvas = document.createElement("canvas");
        canvas.width = image.width / 2; // 필요 시 /4로 변경
        canvas.height = image.height / 2;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // canvas를 data_url로 변환
        const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.8); // 품질 80%
        setAttachment(resizedDataUrl);
      };
      image.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const onAttachmentClear = () => setAttachment(null);
  return (
    <div className={styles.container}>
      <div className={styles.tweetContainer}>
        {tweets.length === 0 ? (
          <span className={styles.noTweet}>
            아무런 대화도 없어요
            <br />
            <br />
            대화를 시작해보세요!
          </span>
        ) : (
          tweets.map((tweet) => (
            <Tweet
              key={tweet.id}
              tweetObj={tweet}
              isOwner={userInfo.uid === tweet.uid}
            />
          ))
        )}
      </div>
      <form className={styles.form} onSubmit={onSubmit}>
        <input
          value={tweet}
          onChange={onChange}
          type="text"
          placeholder="최대 200자까지 입력 가능합니다."
          maxLength={200}
          className={styles.inputText}
          required
        />
        <div className={styles.submitForm}>
          <label className={styles.uploadLabel} htmlFor="imgFile">
            <FontAwesomeIcon icon={faImage} size="xl" />
          </label>
          <input
            className={styles.inputImg}
            onChange={onFileChange}
            type="file"
            accept="image/*"
            id="imgFile"
          />

          {attachment && (
            <div className={styles.previewBox}>
              <img
                alt="preview"
                src={attachment}
                className={styles.previewImg}
              />
              {/* 버튼 타입 버튼으로 넣는거 중요함. 안그러면 submit으로 인식 */}
              <button
                type="button"
                className={styles.imgClear}
                onClick={onAttachmentClear}
              >
                <FontAwesomeIcon
                  icon={faXmark}
                  size="lg"
                  style={{ color: "#ff0000" }}
                />
              </button>
            </div>
          )}

          <input className={styles.tweetBtn} type="submit" value="전송" />
        </div>
      </form>
    </div>
  );
};

export default Home;

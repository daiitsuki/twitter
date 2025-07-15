const admin = require("firebase-admin");

// --- Firebase Admin SDK 초기화 (Vercel 환경 변수 사용) ---
if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountString) {
      throw new Error(
        "GOOGLE_APPLICATION_CREDENTIALS 환경 변수가 설정되지 않았습니다."
      );
    }
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Firebase Admin SDK 초기화 실패:", error);
  }
}
// --- 초기화 종료 ---

const db = admin.firestore();
const messaging = admin.messaging();

module.exports = async (req, res) => {
  // --- 시작: CORS 헤더 설정 ---
  res.setHeader("Access-Control-Allow-Origin", "https://daiitsuki.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }
  // --- 종료: CORS 헤더 설정 ---

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  if (!admin.apps.length) {
    return res.status(500).json({
      success: false,
      error: "Firebase Admin SDK가 초기화되지 않았습니다.",
    });
  }

  const { message, senderId } = req.body;

  if (!message || !senderId) {
    return res.status(400).send("Missing message or senderId");
  }

  try {
    const usersSnapshot = await db.collection("users").get();
    const tokens = [];

    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      if (doc.id !== senderId && user.msgToken && user.notificationsEnabled) {
        tokens.push(user.msgToken);
      }
    });

    if (tokens.length === 0) {
      return res.status(200).send("알림을 보낼 사용자가 없습니다.");
    }

    const notification = {
      notification: {
        title: "새로운 메시지를 발견했어요!",
        body: message,
      },
      tokens: tokens,
    };

    const response = await messaging.sendEachForMulticast(notification);
    console.log(
      "성공적으로 알림 전송 시도:",
      `${response.successCount}개 성공, ${response.failureCount}개 실패`
    );

    const failedTokens = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const failedToken = tokens[idx];
        console.error(`❌ 실패한 토큰: ${failedToken}`);
        console.error(`   ↳ 실패 사유: ${resp.error?.message}`);

        if (
          resp.error?.message?.includes("Requested entity was not found") ||
          resp.error?.message?.includes("NotRegistered")
        ) {
          failedTokens.push(failedToken);
        }
      }
    });

    // Firestore에서 무효한 토큰 삭제
    if (failedTokens.length > 0) {
      const batch = db.batch();

      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (failedTokens.includes(data.msgToken)) {
          const ref = db.collection("users").doc(doc.id);
          batch.update(ref, { msgToken: admin.firestore.FieldValue.delete() });
          console.log(`🧹 Firestore에서 삭제할 토큰: ${data.msgToken}`);
        }
      });

      await batch.commit();
      console.log("✅ Firestore에서 무효한 토큰 삭제 완료");
    }

    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error("알림 전송 중 에러 발생:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

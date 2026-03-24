import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  console.log("🌱 Seeding mock users...");

  const mockUsers = [
    {
      openId: "mock_kuwahara_tomoki",
      name: "桑原智樹",
      email: "kuwahara@example.com",
      loginMethod: "mock",
      role: "user",
      school: "同志社大学 理工学部 情報システムデザイン学科",
      grade: "3年",
      bio: "21歳。ボブヘアの茶髪。スタイル良し。情報システムデザインを専攻し、UI/UXデザインとWebフロントエンド開発に興味があります。",
    },
    {
      openId: "mock_furukawa_takahiro",
      name: "古川貴大",
      email: "furukawa@example.com",
      loginMethod: "mock",
      role: "user",
      school: "近畿大学",
      grade: "2年",
      bio: "大阪在住。筋トレ歴3ヶ月で来年の夏に腹筋を割ることが目標。筋トレ頑張ります！フィットネスとスポーツに情熱を注いでいます。",
    },
    {
      openId: "mock_kaerin_taro",
      name: "帰りん太郎",
      email: "kaerin@example.com",
      loginMethod: "mock",
      role: "user",
      school: "関西大学 システム理工学部",
      grade: "1年",
      bio: "インター予選出場、数学オリンピック金メダリスト。ベンチプレス130kg。彼女8人（？）。数学と筋トレを愛するマルチタレント。",
    },
    {
      openId: "mock_sankai_megumi",
      name: "三階恵",
      email: "sankai@example.com",
      loginMethod: "mock",
      role: "user",
      school: "関西大学 総合情報学部",
      grade: "2回生",
      bio: "20歳。映像制作（After Effects）、情報オリンピック本戦出場、地理学会で発表経験あり。中高で生徒会、サークル運営・統括、授業作成、地方創生、VRChat、League of Legends（ジャングル）。",
    },
  ];

  const mockProfiles = [
    {
      generatedBio: "同志社大学理工学部情報システムデザイン学科3年生。21歳。UI/UXデザインとWebフロントエンド開発に強い関心を持ち、デザインと技術の融合を追求しています。ファッションセンスにも自信あり。",
      skills: JSON.stringify(["UI/UXデザイン", "Webフロントエンド", "Figma", "React", "情報システム設計", "プロトタイピング"]),
      interests: JSON.stringify(["デザイン", "ファッション", "テクノロジー", "カフェ巡り", "写真撮影"]),
      experiences: JSON.stringify(["同志社大学情報システムデザイン学科在学", "UI/UXプロジェクト参加", "Webアプリ開発"]),
      strengths: JSON.stringify(["デザイン思考", "クリエイティビティ", "コミュニケーション力", "美的センス"]),
      personalityTraits: JSON.stringify(["クリエイティブ", "社交的", "トレンドに敏感", "細部にこだわる"]),
    },
    {
      generatedBio: "近畿大学2年生。大阪在住のフィットネス愛好家。筋トレ歴3ヶ月で来年の夏に腹筋を割ることを目標に日々トレーニングに励んでいます。努力家で目標に向かって突き進むタイプ。",
      skills: JSON.stringify(["筋力トレーニング", "栄養管理", "目標設定", "自己管理", "スポーツ"]),
      interests: JSON.stringify(["筋トレ", "フィットネス", "栄養学", "ボディメイク", "スポーツ", "健康管理"]),
      experiences: JSON.stringify(["近畿大学在学", "筋トレ3ヶ月継続", "ボディメイク挑戦中"]),
      strengths: JSON.stringify(["継続力", "目標達成力", "ストイックさ", "ポジティブ思考"]),
      personalityTraits: JSON.stringify(["努力家", "ストイック", "明るい", "目標志向"]),
    },
    {
      generatedBio: "関西大学システム理工学部1年生。数学オリンピック金メダリストで、インター予選出場経験あり。ベンチプレス130kgの筋力を持つ文武両道の天才型。多方面で卓越した才能を発揮。",
      skills: JSON.stringify(["数学", "競技プログラミング", "ベンチプレス", "論理的思考", "問題解決", "アルゴリズム"]),
      interests: JSON.stringify(["数学", "筋トレ", "競技プログラミング", "物理学", "ゲーム理論"]),
      experiences: JSON.stringify(["数学オリンピック金メダル", "インター予選出場", "ベンチプレス130kg達成", "関西大学システム理工学部在学"]),
      strengths: JSON.stringify(["天才的数学力", "身体能力", "論理的思考", "マルチタレント"]),
      personalityTraits: JSON.stringify(["天才肌", "自信家", "多才", "エネルギッシュ"]),
    },
    {
      generatedBio: "関西大学総合情報学部2回生。20歳。映像制作（After Effects）のスキルを持ち、情報オリンピック本戦出場、地理学会での発表経験がある。中高で生徒会活動、サークル運営・統括、授業作成、地方創生プロジェクトに携わった経験豊富なリーダー。VRChatやLeague of Legends（ジャングル）も楽しむ多趣味な人物。",
      skills: JSON.stringify(["映像制作", "After Effects", "プログラミング", "プレゼンテーション", "リーダーシップ", "プロジェクト管理", "VR技術"]),
      interests: JSON.stringify(["映像制作", "情報科学", "地理学", "地方創生", "VRChat", "League of Legends", "ゲーム", "教育"]),
      experiences: JSON.stringify(["情報オリンピック本戦出場", "地理学会発表", "中高生徒会", "サークル運営・統括", "授業作成", "地方創生プロジェクト"]),
      strengths: JSON.stringify(["リーダーシップ", "マルチスキル", "実行力", "発表力", "組織運営力"]),
      personalityTraits: JSON.stringify(["リーダー気質", "多趣味", "行動力がある", "知的好奇心旺盛"]),
    },
  ];

  const userIds = [];

  for (let i = 0; i < mockUsers.length; i++) {
    const u = mockUsers[i];
    console.log(`  Creating user: ${u.name}...`);

    const [existing] = await connection.execute(
      "SELECT id FROM users WHERE openId = ?", [u.openId]
    );

    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
      await connection.execute(
        "UPDATE users SET name=?, email=?, school=?, grade=?, bio=? WHERE id=?",
        [u.name, u.email, u.school, u.grade, u.bio, userId]
      );
      console.log(`    Updated existing user (id: ${userId})`);
    } else {
      const [result] = await connection.execute(
        "INSERT INTO users (openId, name, email, loginMethod, role, school, grade, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [u.openId, u.name, u.email, u.loginMethod, u.role, u.school, u.grade, u.bio]
      );
      userId = result.insertId;
      console.log(`    Created new user (id: ${userId})`);
    }
    userIds.push(userId);

    // Upsert profile
    const p = mockProfiles[i];
    const [existingProfile] = await connection.execute(
      "SELECT id FROM profiles WHERE userId = ?", [userId]
    );

    if (existingProfile.length > 0) {
      await connection.execute(
        "UPDATE profiles SET generatedBio=?, skills=?, interests=?, experiences=?, strengths=?, personalityTraits=?, lastGeneratedAt=NOW() WHERE userId=?",
        [p.generatedBio, p.skills, p.interests, p.experiences, p.strengths, p.personalityTraits, userId]
      );
      console.log(`    Updated profile`);
    } else {
      await connection.execute(
        "INSERT INTO profiles (userId, generatedBio, skills, interests, experiences, strengths, personalityTraits, lastGeneratedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
        [userId, p.generatedBio, p.skills, p.interests, p.experiences, p.strengths, p.personalityTraits]
      );
      console.log(`    Created profile`);
    }

    // Also create some extracted_insights for each mock user
    const insightTypes = {
      skill: (p.skills ? JSON.parse(p.skills) : []).slice(0, 3),
      interest: (p.interests ? JSON.parse(p.interests) : []).slice(0, 3),
      experience: (p.experiences ? JSON.parse(p.experiences) : []).slice(0, 2),
    };

    for (const [type, labels] of Object.entries(insightTypes)) {
      for (const label of labels) {
        // Create a dummy activity first if needed
        const [existingInsight] = await connection.execute(
          "SELECT id FROM extracted_insights WHERE userId = ? AND label = ? AND type = ?",
          [userId, label, type]
        );
        if (existingInsight.length === 0) {
          // Create a dummy activity
          const [actResult] = await connection.execute(
            "INSERT INTO activities (userId, type, content, aiProcessed) VALUES (?, 'text', ?, 1)",
            [userId, `${label}に関する記録`]
          );
          const actId = actResult.insertId;
          await connection.execute(
            "INSERT INTO extracted_insights (activityId, userId, type, label, confidence) VALUES (?, ?, ?, ?, ?)",
            [actId, userId, type, label, 0.8 + Math.random() * 0.2]
          );
        }
      }
    }
    console.log(`    Created insights`);
  }

  // Create match recommendations for user id=1
  console.log("\n🎯 Creating match recommendations...");
  const realUserId = 1;

  // Clear existing mock recommendations
  for (const uid of userIds) {
    await connection.execute(
      "DELETE FROM match_recommendations WHERE userId = ? AND targetUserId = ?",
      [realUserId, uid]
    );
  }

  const matchData = [
    { type: "friend", score: 0.87, reasons: JSON.stringify(["同じ情報系の学部で共通の技術的関心がある", "UI/UXデザインの知識が互いのプロジェクトに活かせる", "年齢が近く大学生活の話題で盛り上がれる"]) },
    { type: "friend", score: 0.72, reasons: JSON.stringify(["大阪エリアの大学生同士で交流しやすい", "目標に向かって努力する姿勢が共通している", "フィットネスの話題で新しい視点を得られる"]) },
    { type: "role_model", score: 0.91, reasons: JSON.stringify(["数学オリンピック金メダルの実績は学習のロールモデルになる", "文武両道の姿勢から多方面での成長のヒントを得られる", "同じ理工系で技術的な議論ができる"]) },
    { type: "friend", score: 0.85, reasons: JSON.stringify(["情報系の学部で技術的な共通点が多い", "映像制作やVR技術など幅広いスキルセットから学べる", "リーダーシップ経験が豊富でプロジェクト協力に最適"]) },
  ];

  for (let i = 0; i < userIds.length; i++) {
    const match = matchData[i];
    await connection.execute(
      "INSERT INTO match_recommendations (userId, targetUserId, type, score, reasons, isViewed, isActedUpon) VALUES (?, ?, ?, ?, ?, 0, 0)",
      [realUserId, userIds[i], match.type, match.score, match.reasons]
    );
    console.log(`  Created recommendation: ${mockUsers[i].name} (${match.type}, score: ${match.score})`);
  }

  console.log("\n✅ Seed completed!");
  await connection.end();
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});

import { NextRequest, NextResponse } from "next/server";

type CardInput = {
  name: string;
  en: string;
  keywords: string[];
  reversed: boolean;
};

type ReadingResult = {
  cardMeanings: string[];
  pastSummary: string;
  presentSummary: string;
  futureSummary: string;
  overallSummary: string;
  advice: string;
};

function localReading(question: string, cards: CardInput[]): ReadingResult {
  const orientation = (card: CardInput) =>
    card.reversed
      ? "逆位暗示這股能量可能受阻、被壓抑，或正以較不舒服的方式浮現"
      : "正位表示這股能量正在自然地推動事情發展";

  return {
    cardMeanings: cards.map(
      (card, index) =>
        `${["過去", "現在", "未來"][index]}位置的${card.name}${card.reversed ? "（逆位）" : "（正位）"}，核心關鍵是「${card.keywords.join("、")}」。${orientation(card)}。`,
    ),
    pastSummary: `針對「${question}」，${cards[0].name}讓人聯想到：你過去可能曾面對一段與「${cards[0].keywords.join("、")}」有關的經驗。也許你努力維持某個局面、承擔了比預期更多的責任，或曾因一次沒有得到回應的期待而變得謹慎。這不一定是單一事件，也可能是一段逐漸累積的感受；它至今仍影響你判斷安全感與機會的方式。`,
    presentSummary: `現在的${cards[1].name}指出，你可能正處在「想前進、又怕選錯」的拉扯裡。表面上你在處理現實問題，內心真正的挑戰卻可能是如何相信自己的判斷，以及如何在他人的期待和自己的需求之間劃出界線。「${cards[1].keywords.join("、")}」是此刻最需要正視的主題。`,
    futureSummary: `${cards[2].name}描繪的未來不是突然降臨的結果，而是一個逐步成形的場景：接下來可能出現新的邀請、一次重要對話，或讓你重新安排優先順序的轉折。當「${cards[2].keywords.join("、")}」的能量變得明顯，你會更清楚哪些道路值得投入、哪些關係或習慣該放下。這是可能性，不是已寫死的命運。`,
    overallSummary: `三張牌串起的是一段「從過去的防備，走向現在的重新選擇，再進入未來的新局面」的旅程。你問的表面也許是一個決定，但更深層的課題，是不再只用舊經驗保護自己，而是用現在真正想要的生活來決定下一步。`,
    advice: `先不要逼自己一次得到完整答案。請在一週內完成一個可驗證的小行動：寫下你最害怕發生的結果、最希望出現的結果，以及你能主動做的一件事；接著安排一次必要的詢問、對話或嘗試。塔羅指出的是趨勢，真正改變未來的，仍是你接下來願意採取的行動。`,
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const cards = body.cards as CardInput[];
  const fallback = localReading(body.question, cards);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ reading: fallback, mode: "local" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        input: [
          {
            role: "system",
            content: `你是一位直覺敏銳、溫暖而敢於具體推演的繁體中文塔羅解讀師。

你的任務不是只解釋牌義，而是把使用者的問題、生日、名字，以及三張牌連成一段有情境、有心理洞察的故事。可以大膽推測，但每個推測都必須使用「可能、也許、看起來像、牌面讓人聯想到」等措辭，不能把推測冒充為已知事實，也不能聲稱能確定預言未來。

寫作要求：
1. pastSummary（約 180–280 字）：推測過去「可能發生過什麼」。描繪 1–2 個具體但合理的場景，例如關係變化、失望、責任壓力、錯過機會、長期努力或某次轉折；說明它如何塑造現在的反應模式。
2. presentSummary（約 180–280 字）：深入描述當前心境、矛盾、隱藏需求和現實挑戰。區分表面問題與更深層的情緒或信念，讓使用者感到被理解。
3. futureSummary（約 180–280 字）：描繪接下來可能出現的具體情境、人物互動、機會或轉折，以及「採取行動」和「維持現狀」可能帶來的不同發展。未來是趨勢，不是宿命。
4. overallSummary（約 160–240 字）：把過去、現在、未來串成一條清楚的因果與成長軸線，直接回應使用者真正想問的核心。
5. advice（約 120–200 字）：給 2–3 個具體、近期可執行的行動，避免只有「相信自己、順其自然」之類空泛句子。
6. cardMeanings：三段，每段約 60–100 字，解釋該牌在其時間位置、正逆位與本次問題中的意義。
7. 語氣可以有神祕感與戲劇性，但不要恐嚇，不做醫療、法律、投資保證，也不要捏造精確日期、姓名或不可驗證的重大事件。
8. 避免每段重複牌名與關鍵字；優先寫情境、心理和因果。

只輸出合法 JSON，不加 markdown，格式：
{"cardMeanings":["","",""],"pastSummary":"","presentSummary":"","futureSummary":"","overallSummary":"","advice":""}`,
          },
          {
            role: "user",
            content: JSON.stringify({
              姓名: body.name,
              生日: body.birthday,
              問題: body.question,
              抽牌: cards.map((card, index) => ({
                位置: ["過去", "現在", "未來"][index],
                牌名: card.name,
                英文牌名: card.en,
                方向: card.reversed ? "逆位" : "正位",
                關鍵字: card.keywords,
              })),
            }),
          },
        ],
      }),
    });

    if (!response.ok) throw new Error("Model request failed");
    const data = await response.json();
    const text = data.output
      ?.flatMap((item: { content?: { text?: string }[] }) => item.content || [])
      .find((item: { text?: string }) => item.text)?.text;
    const reading = JSON.parse(text) as ReadingResult;

    if (
      !Array.isArray(reading.cardMeanings) ||
      reading.cardMeanings.length !== 3 ||
      !reading.pastSummary ||
      !reading.presentSummary ||
      !reading.futureSummary ||
      !reading.overallSummary ||
      !reading.advice
    ) {
      throw new Error("Invalid model output");
    }

    return NextResponse.json({ reading, mode: "ai" });
  } catch {
    return NextResponse.json({ reading: fallback, mode: "local" });
  }
}

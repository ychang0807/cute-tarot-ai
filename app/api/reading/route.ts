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
  const cardMeanings = cards.map((card, index) => {
    const time = ["過去的經驗", "此刻的你", "未來的可能"][index];
    const flow = card.reversed
      ? "它以逆位出現，提醒你先看見內在的阻力，不必急著逼自己得到答案"
      : "它以正位出現，表示這份力量已經在你身邊，可以放心地回應它";
    return `${time}與「${card.keywords.join("、")}」有關。${flow}。`;
  });

  return {
    cardMeanings,
    pastSummary: `面對「${question}」，${cards[0].name}顯示過去的你曾受到「${cards[0].keywords.join("、")}」影響。那段經驗形成了你現在看待問題的方式，也留下值得理解的線索。`,
    presentSummary: `${cards[1].name}指出，你此刻正站在需要「${cards[1].keywords.join("、")}」的位置。比起急著找到唯一答案，更重要的是誠實看見自己真正的需求。`,
    futureSummary: `${cards[2].name}呈現的不是固定命運，而是目前選擇延伸出的可能。如果你願意帶著「${cards[2].keywords.join("、")}」前進，局面將逐漸出現新的空間。`,
    overallSummary: "這三張牌把你的問題連成一條清楚的路：過去提供了線索，現在要求你做出有意識的選擇，而未來仍保留在你的手中。",
    advice: `先為「${question}」寫下一個這週能完成的小行動。不要追求一次解決所有事情，先用真實、可持續的一步，回應你心裡最重視的價值。`,
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
            content: `你是一位溫柔、務實、擅長敘事的繁體中文塔羅解讀者。塔羅是自我探索工具，不做確定預言，也不取代醫療、法律或財務專業意見。

請緊扣使用者的實際問題，把三張牌串成一條有因果關係的故事。pastSummary、presentSummary、futureSummary 各 90–150 個中文字；overallSummary 80–130 字；advice 需提供 1–2 個清楚、可執行的下一步。cardMeanings 各 50–90 字，說明牌本身與牌位含意。

只輸出合法 JSON，不要 markdown。格式必須是：
{"cardMeanings":["","",""],"pastSummary":"","presentSummary":"","futureSummary":"","overallSummary":"","advice":""}`,
          },
          {
            role: "user",
            content: JSON.stringify({
              稱呼: body.name,
              生日: body.birthday,
              問題: body.question,
              牌面: cards.map((card, index) => ({
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

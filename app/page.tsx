"use client";

import { FormEvent, useMemo, useState } from "react";

type TarotCard = {
  id: number;
  name: string;
  en: string;
  symbol: string;
  keywords: string[];
};

type PickedCard = TarotCard & { reversed: boolean };

type ReadingResult = {
  cardMeanings: string[];
  pastSummary: string;
  presentSummary: string;
  futureSummary: string;
  overallSummary: string;
  advice: string;
};

const majors: Omit<TarotCard, "id">[] = [
  ["愚者", "The Fool", "✦", ["啟程", "自由", "可能性"]],
  ["魔術師", "The Magician", "∞", ["創造", "意志", "行動"]],
  ["女祭司", "The High Priestess", "☾", ["直覺", "沉靜", "未知"]],
  ["皇后", "The Empress", "♀", ["滋養", "豐盛", "創造力"]],
  ["皇帝", "The Emperor", "♔", ["秩序", "責任", "穩定"]],
  ["教皇", "The Hierophant", "⚜", ["信念", "傳承", "指引"]],
  ["戀人", "The Lovers", "♡", ["選擇", "連結", "價值觀"]],
  ["戰車", "The Chariot", "✧", ["前進", "自律", "勝利"]],
  ["力量", "Strength", "♌", ["勇氣", "溫柔", "韌性"]],
  ["隱者", "The Hermit", "⌁", ["內省", "智慧", "獨處"]],
  ["命運之輪", "Wheel of Fortune", "⊕", ["轉折", "循環", "機會"]],
  ["正義", "Justice", "⚖", ["平衡", "真相", "抉擇"]],
  ["倒吊人", "The Hanged Man", "♆", ["停頓", "轉念", "放下"]],
  ["死神", "Death", "♏", ["結束", "蛻變", "重生"]],
  ["節制", "Temperance", "⚗", ["調和", "耐心", "療癒"]],
  ["惡魔", "The Devil", "♑", ["執著", "誘惑", "覺察"]],
  ["高塔", "The Tower", "ϟ", ["震盪", "解放", "重建"]],
  ["星星", "The Star", "✶", ["希望", "靈感", "信任"]],
  ["月亮", "The Moon", "☽", ["迷霧", "夢境", "感受"]],
  ["太陽", "The Sun", "☀", ["喜悅", "清晰", "活力"]],
  ["審判", "Judgement", "♬", ["覺醒", "回應", "更新"]],
  ["世界", "The World", "◎", ["完成", "整合", "圓滿"]],
].map(([name, en, symbol, keywords]) => ({
  name: name as string,
  en: en as string,
  symbol: symbol as string,
  keywords: keywords as string[],
}));

const suitInfo = [
  { name: "權杖", en: "Wands", symbol: "♨", words: ["熱情", "創意", "行動"] },
  { name: "聖杯", en: "Cups", symbol: "♧", words: ["情感", "關係", "直覺"] },
  { name: "寶劍", en: "Swords", symbol: "◇", words: ["思考", "真相", "挑戰"] },
  { name: "錢幣", en: "Pentacles", symbol: "⬡", words: ["資源", "穩定", "成果"] },
];
const ranks = [
  ["一", "Ace", "開始"], ["二", "Two", "平衡"], ["三", "Three", "成長"],
  ["四", "Four", "穩固"], ["五", "Five", "轉變"], ["六", "Six", "流動"],
  ["七", "Seven", "選擇"], ["八", "Eight", "進展"], ["九", "Nine", "累積"],
  ["十", "Ten", "完成"], ["侍者", "Page", "消息"], ["騎士", "Knight", "追尋"],
  ["皇后", "Queen", "成熟"], ["國王", "King", "掌握"],
];
const deck: TarotCard[] = [
  ...majors.map((card, id) => ({ ...card, id })),
  ...suitInfo.flatMap((suit, suitIndex) =>
    ranks.map(([rank, enRank, energy], rankIndex) => ({
      id: 22 + suitIndex * 14 + rankIndex,
      name: `${suit.name}${rank}`,
      en: `${enRank} of ${suit.en}`,
      symbol: suit.symbol,
      keywords: [energy, ...suit.words.slice(0, 2)],
    }))
  ),
];

const positions = ["過去", "現在", "未來"];

function seededShuffle(seed: string) {
  let value = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 811);
  return [...deck].sort(() => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280 - 0.5;
  });
}

export default function Home() {
  const [stage, setStage] = useState<"welcome" | "form" | "shuffling" | "draw" | "reading">("welcome");
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [question, setQuestion] = useState("");
  const [cards, setCards] = useState(deck);
  const [picked, setPicked] = useState<PickedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState<ReadingResult | null>(null);

  const stars = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    left: `${(i * 37) % 98}%`,
    top: `${(i * 53) % 96}%`,
    delay: `${(i % 7) * 0.4}s`,
  })), []);

  function beginShuffle(event: FormEvent) {
    event.preventDefault();
    setCards(seededShuffle(`${name}${birthday}${question}${Date.now()}`));
    setStage("shuffling");
    window.setTimeout(() => setStage("draw"), 3400);
  }

  function pickCard(card: TarotCard) {
    if (picked.length >= 3 || picked.some((item) => item.id === card.id)) return;
    const next = [...picked, { ...card, reversed: Math.random() > 0.72 }];
    setPicked(next);
    if (next.length === 3) window.setTimeout(() => createReading(next), 650);
  }

  async function createReading(selection: PickedCard[]) {
    setStage("reading");
    setLoading(true);
    try {
      const response = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, birthday, question, cards: selection }),
      });
      const data = await response.json();
      setReading(data.reading);
    } catch {
      setReading(fallbackResult(selection));
    } finally {
      setLoading(false);
    }
  }

  function fallbackReading(card: PickedCard, index: number) {
    const direction = card.reversed ? "這股能量目前較內斂，也提醒你留意卡住的地方" : "這股能量正在自然流動";
    const focus = index === 0 ? "曾經的經驗仍悄悄影響著你的選擇" : index === 1 ? "當下最重要的是看清真正的需求" : "未來會隨你此刻的選擇逐步展開";
    return `${card.name}帶來「${card.keywords.join("、")}」的訊息。${focus}；${direction}。`;
  }

  function fallbackResult(selection: PickedCard[]): ReadingResult {
    return {
      cardMeanings: selection.map((card, i) => fallbackReading(card, i)),
      pastSummary: `面對「${question}」，${selection[0].name}顯示過去的你曾受到「${selection[0].keywords.join("、")}」影響。那段經驗形成了你現在看待問題的方式，也留下值得理解的線索。`,
      presentSummary: `${selection[1].name}指出，你此刻正站在需要「${selection[1].keywords.join("、")}」的位置。比起急著找到唯一答案，更重要的是誠實看見自己真正的需求。`,
      futureSummary: `${selection[2].name}呈現的不是固定命運，而是目前選擇延伸出的可能。如果你願意帶著「${selection[2].keywords.join("、")}」前進，局面將逐漸出現新的空間。`,
      overallSummary: `這三張牌把你的問題連成一條清楚的路：過去提供了線索，現在要求你做出有意識的選擇，而未來仍保留在你的手中。`,
      advice: `先為「${question}」寫下一個這週能完成的小行動。不要追求一次解決所有事情，先用真實、可持續的一步，回應你心裡最重視的價值。`,
    };
  }

  function reset() {
    setPicked([]);
    setReading(null);
    setQuestion("");
    setStage("form");
  }

  return (
    <main className="site-shell">
      <div className="aurora" />
      <div className="stars" aria-hidden="true">
        {stars.map((star, i) => <i key={i} style={{ left: star.left, top: star.top, animationDelay: star.delay }} />)}
      </div>
      <header className="brand"><span>⚜</span> 可愛塔羅AI <span>⚜</span></header>

      {(stage === "welcome" || stage === "form") && (
        <section className="hero">
          <div className="hero-art">
            <img src="/lady-elara-medieval.png" alt="中古世紀占卜師艾拉女士在水晶球前迎接訪客" />
            <div className="orb-pulse" />
          </div>
          <div className="hero-copy">
            <p className="eyebrow">THE ORACLE OF THE OLD TOWER</p>
            <h1>歡迎來到<br /><em>艾拉的占卜室</em></h1>
            <div className="welcome-message">
              <span className="wax-seal">E</span>
              <p>「旅人，歡迎你。我是守護古塔星盤的占卜師<strong>艾拉女士</strong>。請坐到燭火旁，把困擾你的事交給我——今晚，牌會替你說出那些尚未被看見的線索。」</p>
            </div>
            <p className="intro">從完整的 78 張塔羅牌中親手選出三張，讓我們沿著過去、現在與未來，讀懂命運留下的暗號。</p>
            {stage === "welcome" ? (
              <button className="primary-button" onClick={() => setStage("form")}>接受艾拉的邀請 <span>⚜</span></button>
            ) : (
              <form className="question-card" onSubmit={beginShuffle}>
                <div className="two-fields">
                  <label>怎麼稱呼你？<input value={name} onChange={(e) => setName(e.target.value)} placeholder="名字或暱稱" required maxLength={30} /></label>
                  <label>你的生日<input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} required /></label>
                </div>
                <label>今晚，你想向命運詢問什麼？<textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="例如：我該如何面對目前工作上的轉變？" required maxLength={240} /></label>
                <button className="primary-button full" type="submit">請艾拉為我洗牌 <span>⚜</span></button>
                <small>你的資料只用於本次解讀。塔羅是自我探索的工具，不取代醫療、法律或財務建議。</small>
              </form>
            )}
          </div>
        </section>
      )}

      {stage === "shuffling" && (
        <section className="ritual centered">
          <p className="eyebrow">LISTENING TO YOUR QUESTION</p>
          <h2>星星正在聆聽⋯</h2>
          <div className="shuffle-stack" aria-label="正在洗牌">
            {Array.from({ length: 7 }, (_, i) => <div className="mini-card" key={i}><span>☾</span></div>)}
          </div>
          <p>深呼吸，讓「{question}」停留在心中。</p>
          <div className="progress"><i /></div>
        </section>
      )}

      {stage === "draw" && (
        <section className="draw-stage">
          <p className="eyebrow">CHOOSE WITH YOUR INTUITION</p>
          <h2>從 78 張牌中，選出你的三張牌</h2>
          <p className="draw-hint">不要想太久。哪張牌吸引你的目光，就輕輕點下它。</p>
          <div className="slots">
            {positions.map((position, i) => (
              <div className={`slot ${picked[i] ? "filled" : ""}`} key={position}>
                {picked[i] ? <div className="chosen-back"><span>☾</span></div> : <b>{i + 1}</b>}
                <span>{position}</span>
              </div>
            ))}
          </div>
          <div className="deck-count"><span>{picked.length}</span> / 3 已選擇</div>
          <div className="deck-scroll" aria-label="完整七十八張塔羅牌">
            <div className="deck-grid">
              {cards.map((card, i) => (
                <button
                  className={`tarot-back ${picked.some((item) => item.id === card.id) ? "picked" : ""}`}
                  key={card.id}
                  onClick={() => pickCard(card)}
                  aria-label={`選擇第 ${i + 1} 張牌`}
                  disabled={picked.some((item) => item.id === card.id)}
                >
                  <span className="corner">✦</span><strong>☾</strong><i>✧</i>
                </button>
              ))}
            </div>
          </div>
          <p className="scroll-note">← 左右滑動，探索完整牌陣 →</p>
        </section>
      )}

      {stage === "reading" && (
        <section className="reading-stage">
          <p className="eyebrow">YOUR THREE-CARD READING</p>
          <h2>{name}，這是星星此刻想告訴你的事</h2>
          <blockquote>「{question}」</blockquote>
          <div className="revealed-cards">
            {picked.map((card, i) => (
              <article className="reading-card" key={card.id} style={{ animationDelay: `${i * 0.25}s` }}>
                <div className={`card-face ${card.reversed ? "reversed" : ""}`}>
                  <span>{String(card.id).padStart(2, "0")}</span>
                  <b>{card.symbol}</b>
                  <h3>{card.name}</h3>
                  <small>{card.en}</small>
                </div>
                <p className="position-label">{positions[i]} · {card.reversed ? "逆位" : "正位"}</p>
                <div className="keywords">{card.keywords.map((word) => <span key={word}>{word}</span>)}</div>
                <p className="interpretation">{loading ? "星光正在聚成文字⋯" : reading?.cardMeanings[i] || fallbackReading(card, i)}</p>
              </article>
            ))}
          </div>
          <div className="journey-summary">
            <div className="summary-heading">
              <p className="eyebrow">YOUR STORY IN THREE MOMENTS</p>
              <h3>回到你的問題，這三張牌這樣說</h3>
            </div>
            {positions.map((position, i) => {
              const text = [reading?.pastSummary, reading?.presentSummary, reading?.futureSummary][i];
              return (
                <article className="summary-moment" key={position}>
                  <div className="moment-number">0{i + 1}</div>
                  <div>
                    <span>{position}</span>
                    <h4>{i === 0 ? "一路走來的影響" : i === 1 ? "此刻真正的課題" : "正在展開的可能"}</h4>
                    <p>{loading ? "正在讀取這段旅程⋯" : text}</p>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="synthesis">
            <span className="moon-mark">☾</span>
            <div>
              <p className="eyebrow">A NOTE FROM THE STARS</p>
              <h3>整體總結</h3>
              <p>{loading ? "正在串連三張牌的訊息⋯" : reading?.overallSummary}</p>
              <div className="advice-box">
                <b>✦ 給你的行動建議</b>
                <p>{loading ? "正在尋找最適合你的下一步⋯" : reading?.advice}</p>
              </div>
            </div>
          </div>
          <button className="primary-button" onClick={reset}>再問一個問題 <span>✦</span></button>
        </section>
      )}

      <footer>可愛塔羅AI · 免費為你的內心點一盞小燈 <span>✦</span> 僅供娛樂與自我探索</footer>
    </main>
  );
}

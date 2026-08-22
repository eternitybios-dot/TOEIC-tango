import { useState } from "react";
import { playSfx } from "../lib/feedback";

const SLIDES = [
  {
    kicker: "WELCOME",
    title: "フレーズで覚える。",
    body: "見出し語だけでなく、短い英語フレーズと日本語で覚えます。試験で出会う形に近づけます。",
  },
  {
    kicker: "CARDS",
    title: "めくって、スワイプ。",
    body: "カードをタップで裏面へ。右へ滑らせたら「覚えた」、左なら「もう一度」。発音も聴けます。",
  },
  {
    kicker: "QUIZ",
    title: "答え合わせまで一気に。",
    body: "4択のあとに正解・不正解と見出し語を表示。間隔反復で、忘れかけた語から出ます。",
  },
];

type Props = {
  sound: boolean;
  onDone: () => void;
};

export function Onboarding({ sound, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  function next() {
    playSfx("tap", sound);
    if (index + 1 >= SLIDES.length) {
      onDone();
      return;
    }
    setIndex((n) => n + 1);
  }

  return (
    <div className="onboard">
      <div className="onboard-mark">T</div>
      <p className="tiny gold">{slide.kicker}</p>
      <h1 className="onboard-title" key={slide.title}>
        {slide.title}
      </h1>
      <p className="onboard-body" key={slide.body}>
        {slide.body}
      </p>
      <div className="dots">
        {SLIDES.map((item, i) => (
          <i key={item.kicker} className={i === index ? "on" : ""} />
        ))}
      </div>
      <button className="cta" onClick={next}>
        {index + 1 >= SLIDES.length ? "はじめる" : "次へ"}
      </button>
      {index > 0 ? (
        <button className="text-btn" onClick={() => setIndex((n) => n - 1)}>
          戻る
        </button>
      ) : (
        <button className="text-btn" onClick={onDone}>
          スキップ
        </button>
      )}
    </div>
  );
}

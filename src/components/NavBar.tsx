import type { Route } from "../types";
import { IconCards, IconHome, IconList, IconQuiz, IconStats } from "./Icons";

const ITEMS: { name: Route["name"]; label: string; Icon: typeof IconHome }[] = [
  { name: "home", label: "ホーム", Icon: IconHome },
  { name: "study", label: "カード", Icon: IconCards },
  { name: "quiz", label: "クイズ", Icon: IconQuiz },
  { name: "list", label: "単語", Icon: IconList },
  { name: "stats", label: "記録", Icon: IconStats },
];

type Props = {
  current: Route["name"];
  onGo: (name: Route["name"]) => void;
};

export function NavBar({ current, onGo }: Props) {
  return (
    <nav className="nav" aria-label="メイン">
      {ITEMS.map(({ name, label, Icon }) => (
        <button
          key={name}
          className={current === name ? "active" : ""}
          onClick={() => onGo(name)}
        >
          <Icon size={21} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

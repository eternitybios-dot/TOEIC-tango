import type { Pos, Word } from "../types";
import { WORDS } from "../data";

export type MeaningNote = {
  gloss: string;
  sections: { title: string; body: string }[];
};

const POS_NAME: Record<Pos, string> = {
  名: "名詞",
  動: "動詞",
  形: "形容詞",
  副: "副詞",
  前: "前置詞",
  接: "接続詞",
  句: "句",
};

const POS_ROLE: Record<Pos, string> = {
  名: "人・物・事・抽象的な概念を指す語です。主語や目的語になり、a / the や所有格（one's）を伴うことがあります。",
  動: "動作・変化・関係を表す語です。誰が、何を、どんな状態にするのかを文の中心に置きます。",
  形: "名詞の性質や状態を足す語です。直後の名詞を飾るか、be 動詞のあとに置いて説明します。",
  副: "動詞・形容詞・文全体を修飾し、時・場所・程度・話し手の態度を添えます。",
  前: "名詞の前に置いて、場所・時・原因・手段などの関係を示します。",
  接: "語と語、文と文をつなぎ、理由・逆接・追加などの論理を作ります。",
  句: "複数の語がまとまって、一つの意味のかたまりとして働きます。",
};

const POS_REWRITE: Record<Pos, (gloss: string) => string[]> = {
  名: (g) => [
    `「${g}」という名で呼べるもの・ことそのものです。`,
    `数える対象でも、数えにくい抽象概念でも、指している実体は「${g}」です。`,
    `日本語に落とすときは、まず「何を指しているか」を「${g}」に固定してから訳します。`,
  ],
  動: (g) => [
    `核の動作は「${g}」です。単なる状態ではなく、働きかけや変化が含まれます。`,
    `主語が責任を持って、対象や状況に対して「${g}」という行為をしています。`,
    `訳語を迷ったら、「${g}」という動きが文中に残っているかを確かめてください。`,
  ],
  形: (g) => [
    `飾っている相手の性質が「${g}」です。見た目だけでなく、評価や程度も含みます。`,
    `「どの点で${g}のか」を残すと、日本語が自然になります。`,
    `be 動詞の後ろでも、名詞の前でも、意味の核は同じ「${g}」です。`,
  ],
  副: (g) => [
    `文に添える情報の核が「${g}」です。動作そのものではなく、その様子や条件です。`,
    `どこで・いつ・どの程度・どんな態度か、を「${g}」で限定します。`,
    `動詞を訳したあとで、「${g}」を必ず足すと意味がずれません。`,
  ],
  前: (g) => [
    `後ろの名詞との関係が「${g}」です。名詞単体の意味ではなく、結び方の意味です。`,
    `前置詞のあとに来る語を、「${g}」という関係で主語や動詞につなぎます。`,
  ],
  接: (g) => [
    `前後の内容を「${g}」という論理でつなぎます。`,
    `接続の意味を落とすと、文全体の主張が逆になったり弱くなったりします。`,
  ],
  句: (g) => [`句全体で「${g}」を表します。語をばらして訳すより、かたまりで意味を取ります。`],
};

const PART_NOTE = {
  1: "基礎語です。短い文でも、この核の意味が直接問われます。まず「いちばん短い日本語」を即答できるようにします。",
  2: "必修語です。会議・契約・報道などの文脈で、少し改まった意味として出やすいです。日常語より一段フォーマルに取るのが安全です。",
  3: "発展語です。抽象度が高く、文の主題（経済・研究・政策など）から意味を絞る必要があります。訳語を一つに固定しすぎないでください。",
} as const;

const BY_MEANING = new Map<string, Word[]>();
for (const item of WORDS) {
  const list = BY_MEANING.get(item.meaning) ?? [];
  list.push(item);
  BY_MEANING.set(item.meaning, list);
}

function pick<T>(word: Word, options: T[]): T {
  let n = 0;
  for (const ch of word.word) n += ch.charCodeAt(0);
  return options[n % options.length];
}

function complement(word: Word): { en: string; ja: string } {
  const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const en = word.phrase.replace(new RegExp(`\\b${escaped}\\b`, "i"), "〜").replace(/\s+/g, " ").trim();
  let ja = word.phraseJa;
  if (ja.includes(word.meaning)) ja = ja.replace(word.meaning, "〜");
  return { en, ja };
}

function affixNote(word: Word): string | null {
  const w = word.word.toLowerCase();
  const notes: string[] = [];
  if (/^(un|in|im|ir|il|dis|non)/.test(w)) {
    notes.push("接頭辞が否定・反対の方向に意味を傾けています。核の意味を取ったあとで、打ち消しがないか確認します。");
  }
  if (/^re/.test(w) && w.length > 4) notes.push("re- は「再び・戻して」の方向です。一度したことをもう一度する、または元に戻すニュアンスが混じることがあります。");
  if (/^pre/.test(w)) notes.push("pre- は「前もって」です。本番や本体の前に置く、先回りする意味が乗ることがあります。");
  if (/^over/.test(w)) notes.push("over- は「過度に・上回って」です。程度が大きすぎる、という評価が入りやすいです。");
  if (/^under/.test(w)) notes.push("under- は「下に・足りずに」です。不足や従属のニュアンスを残して訳します。");
  if (/(tion|sion|ment|ness|ity|ance|ence)$/.test(w)) {
    notes.push("名詞を作る語尾です。動作や性質が「もの・こと」として切り出されています。");
  }
  if (/(ize|ise|ate|ify|en)$/.test(w) && word.pos === "動") {
    notes.push("動詞らしい語尾です。「〜の状態にする／〜化する」と読むとしっくり来ることが多いです。");
  }
  if (/(able|ible|ous|ive|al|ent|ant|ful|less|ic|ary)$/.test(w) && word.pos === "形") {
    notes.push("形容詞らしい語尾です。人や物の性質として「その意味を帯びている」と取ると安定します。");
  }
  if (/(ly)$/.test(w) && word.pos === "副") {
    notes.push("-ly は副詞の目印です。動詞や文全体に意味を添える読み方を優先します。");
  }
  return notes.length ? notes.join("") : null;
}

function nearWords(word: Word): Word[] {
  return (BY_MEANING.get(word.meaning) ?? []).filter((item) => item.id !== word.id).slice(0, 3);
}

export function explainMeaning(word: Word): MeaningNote {
  const pos = POS_NAME[word.pos];
  const gloss = word.meaning;
  const { en, ja } = complement(word);
  const rewrites = POS_REWRITE[word.pos](gloss);
  const similar = nearWords(word);
  const affix = affixNote(word);

  const core = [
    `${word.word} は${pos}で、中心的な意味は「${gloss}」です。`,
    pick(word, rewrites),
    `試験では、まずこの最短訳「${gloss}」を思い出してください。そこから文脈に合わせて語感を伸ばします。`,
  ].join("");

  const detail = [
    `もう一段詳しく言うと、${POS_ROLE[word.pos]}`,
    pick(word, [
      `日本語の「${gloss}」は日常でも使いますが、英語の ${word.word} は書き言葉やニュースでもそのままの核で使われます。`,
      `「${gloss}」を、感情や程度の飾りとして薄めすぎないことが大切です。核を残したまま訳します。`,
      `ひとことで「${gloss}」と覚えたあと、主語と対象を足すと、意味が立体になります。`,
    ]),
    `この語が生きる典型は「${word.phraseJa}」という場面です。英語では ${word.phrase} の形で、${word.word} が担っているのはあくまで「${gloss}」の部分です。`,
    en.includes("〜")
      ? `残りの ${en}（日本語では「${ja}」）は、意味を具体化する相手や状況です。核の「${gloss}」と役割を分けて覚えると忘れにくいです。`
      : `結びつき全体を暗記するより、「${gloss}」が文のどこに効いているかを見る方が応用できます。`,
  ].join("");

  const useLead: Record<Pos, string> = {
    動: `文中では、主語が「${gloss}」という行為の責任者です。目的語があるなら、その目的語が「${gloss}」の対象です。否定なら「${gloss}していない」、疑問なら「${gloss}しているか」と置くと速く読めます。`,
    名: `文中では、話題の対象そのものが「${gloss}」です。前後の動詞は、その「${gloss}」をどう扱うかを説明しているだけです。冠詞や所有格、複数形が付いても、指している実体は「${gloss}」のままです。`,
    形: `文中では、どの名詞を「${gloss}」と言っているのかを先に見つけます。修飾先を外すと、意味が別の語に吸い取られます。比較級・最上級でも土台は「${gloss}」で、程度だけが動きます。`,
    副: `文中では、${word.word} を外しても文は残ることがありますが、「${gloss}」という限定が消えて主張がぼやけます。文頭でも文末でも、添えている意味は同じ「${gloss}」です。`,
    前: `後ろの名詞を「${gloss}」という関係で前文につなぎます。名詞だけ訳して ${word.word} を飛ばすと、意味の骨格が壊れます。`,
    接: `前後を「${gloss}」という論理でつなぎます。この意味を落とすと、逆接や理由が消えて文意が変わります。`,
    句: `句を分割して訳すより、「${gloss}」として一塊で取ります。語をばらすと核の意味が見えなくなります。`,
  };

  const use = [
    useLead[word.pos],
    affix ?? `語形が変わっても、意味の核「${gloss}」は維持されます。先に核を取り、そのあとで時制・数・程度を足してください。`,
  ].join("");

  const exam = [
    PART_NOTE[word.part],
    pick(word, [
      `選択肢に近い日本語が並んだら、「${gloss}」に一番まっすぐな語を残します。雰囲気で選ぶと、類義語に流れます。`,
      `長文では、${word.word} の直後と直前だけを見ず、主語と目的語をセットで取ると「${gloss}」が安定します。`,
      `空所補充では、文法（${pos}として置けるか）と意味（「${gloss}」で文が通るか）の両方を同時に見ます。`,
    ]),
    `発音して意味を定着させるなら、${word.word} と言いながら「${gloss}」を先に口に出してください。訳を後回しにすると、語形だけが残ります。`,
  ].join("");

  const sections: MeaningNote["sections"] = [
    { title: "核の意味", body: core },
    { title: "詳しく", body: detail },
    { title: "文の中での働き", body: use },
    { title: "試験での捉え方", body: exam },
  ];

  if (similar.length > 0) {
    const names = similar.map((item) => `${item.word}（${POS_NAME[item.pos]}）`).join("、");
    sections.push({
      title: "同じ訳になりやすい語",
      body: `「${gloss}」と訳せる語には ${names} もあります。訳語は同じでも、結びつきが違います。${word.word} を選ぶ根拠は、「${word.phraseJa}」のような場面で、核の「${gloss}」がこの語の品詞（${pos}）として自然かどうかです。暗記カードでは訳語を共有していても、試験では文の骨格で見分けます。`,
    });
  }

  return { gloss, sections };
}

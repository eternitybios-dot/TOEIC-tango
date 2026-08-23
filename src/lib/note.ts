import type { Pos, Word } from "../types";
import { ID_TIPS, MEANING_TIPS, WORD_TIPS } from "./noteTips.ts";

const ART = new Set([
  "a",
  "an",
  "the",
  "one's",
  "my",
  "your",
  "his",
  "her",
  "their",
  "our",
  "its",
  "this",
  "that",
  "these",
  "those",
  "some",
  "any",
  "no",
  "each",
  "every",
]);

const PREP = new Set([
  "about",
  "above",
  "across",
  "after",
  "against",
  "along",
  "among",
  "around",
  "as",
  "at",
  "before",
  "behind",
  "below",
  "beneath",
  "beside",
  "between",
  "beyond",
  "by",
  "despite",
  "down",
  "during",
  "except",
  "for",
  "from",
  "in",
  "inside",
  "into",
  "like",
  "near",
  "of",
  "off",
  "on",
  "onto",
  "out",
  "over",
  "through",
  "to",
  "toward",
  "towards",
  "under",
  "until",
  "up",
  "upon",
  "with",
  "within",
  "without",
]);

const LINK = new Set(["be", "am", "is", "are", "was", "were", "been", "being", "feel", "felt", "stay", "stayed", "keep", "kept", "remain", "remained", "look", "looked", "seem", "seemed", "become", "became"]);

const ADV = new Set([
  "fully",
  "well",
  "hard",
  "clearly",
  "quickly",
  "slowly",
  "easily",
  "carefully",
  "strongly",
  "widely",
  "highly",
  "closely",
  "directly",
  "finally",
  "recently",
  "usually",
  "often",
  "never",
  "always",
  "together",
  "apart",
  "away",
  "forth",
  "forward",
  "aside",
  "hardly",
  "nearly",
  "freely",
  "openly",
  "publicly",
]);

const IRREGULAR: Record<string, string[]> = {
  arise: ["arises", "arose", "arisen", "arising"],
  become: ["becomes", "became", "becoming"],
  begin: ["begins", "began", "begun", "beginning"],
  break: ["breaks", "broke", "broken", "breaking"],
  bring: ["brings", "brought", "bringing"],
  build: ["builds", "built", "building"],
  buy: ["buys", "bought", "buying"],
  catch: ["catches", "caught", "catching"],
  choose: ["chooses", "chose", "chosen", "choosing"],
  come: ["comes", "came", "coming"],
  cost: ["costs", "costing"],
  cut: ["cuts", "cutting"],
  deal: ["deals", "dealt", "dealing"],
  do: ["does", "did", "done", "doing"],
  draw: ["draws", "drew", "drawn", "drawing"],
  drive: ["drives", "drove", "driven", "driving"],
  eat: ["eats", "ate", "eaten", "eating"],
  fall: ["falls", "fell", "fallen", "falling"],
  feel: ["feels", "felt", "feeling"],
  find: ["finds", "found", "finding"],
  fly: ["flies", "flew", "flown", "flying"],
  forget: ["forgets", "forgot", "forgotten", "forgetting"],
  get: ["gets", "got", "gotten", "getting"],
  give: ["gives", "gave", "given", "giving"],
  go: ["goes", "went", "gone", "going"],
  grow: ["grows", "grew", "grown", "growing"],
  have: ["has", "had", "having"],
  hear: ["hears", "heard", "hearing"],
  hide: ["hides", "hid", "hidden", "hiding"],
  hit: ["hits", "hitting"],
  hold: ["holds", "held", "holding"],
  keep: ["keeps", "kept", "keeping"],
  know: ["knows", "knew", "known", "knowing"],
  lead: ["leads", "led", "leading"],
  leave: ["leaves", "left", "leaving"],
  lend: ["lends", "lent", "lending"],
  lose: ["loses", "lost", "losing"],
  make: ["makes", "made", "making"],
  mean: ["means", "meant", "meaning"],
  meet: ["meets", "met", "meeting"],
  pay: ["pays", "paid", "paying"],
  put: ["puts", "putting"],
  read: ["reads", "reading"],
  rise: ["rises", "rose", "risen", "rising"],
  run: ["runs", "ran", "running"],
  say: ["says", "said", "saying"],
  see: ["sees", "saw", "seen", "seeing"],
  sell: ["sells", "sold", "selling"],
  send: ["sends", "sent", "sending"],
  set: ["sets", "setting"],
  show: ["shows", "showed", "shown", "showing"],
  sit: ["sits", "sat", "sitting"],
  speak: ["speaks", "spoke", "spoken", "speaking"],
  spend: ["spends", "spent", "spending"],
  stand: ["stands", "stood", "standing"],
  take: ["takes", "took", "taken", "taking"],
  teach: ["teaches", "taught", "teaching"],
  tell: ["tells", "told", "telling"],
  think: ["thinks", "thought", "thinking"],
  throw: ["throws", "threw", "thrown", "throwing"],
  understand: ["understands", "understood", "understanding"],
  wear: ["wears", "wore", "worn", "wearing"],
  win: ["wins", "won", "winning"],
  write: ["writes", "wrote", "written", "writing"],
};

export type PhraseParse = {
  tokens: string[];
  index: number;
  length: number;
  left: string[];
  right: string[];
  frame: string;
  prep: string | null;
  article: string | null;
  partner: string;
};

function cleanTok(tok: string): string {
  return tok.toLowerCase().replace(/[^a-z'-]/g, "");
}

function tokenMatch(tok: string, head: string): boolean {
  const t = cleanTok(tok);
  const h = head.toLowerCase();
  if (!t || !h) return false;
  if (t === h) return true;
  if (IRREGULAR[h]?.includes(t)) return true;
  if (t === `${h}s` || t === `${h}es`) return true;
  if (t === `${h}ed` || t === `${h}d`) return true;
  if (t === `${h}ing`) return true;
  if (h.endsWith("e") && (t === `${h}d` || t === `${h.slice(0, -1)}ing`)) return true;
  if (h.endsWith("y") && (t === `${h.slice(0, -1)}ies` || t === `${h.slice(0, -1)}ied`)) return true;
  if (h.endsWith("ie") && t === `${h.slice(0, -2)}ying`) return true;
  if (t === `${h}${h.slice(-1)}ed` || t === `${h}${h.slice(-1)}ing`) return true;
  return false;
}

function findHead(tokens: string[], word: string): { index: number; length: number } | null {
  const parts = word.trim().split(/\s+/);
  for (let i = 0; i <= tokens.length - parts.length; i++) {
    if (parts.every((part, offset) => tokenMatch(tokens[i + offset], part))) {
      return { index: i, length: parts.length };
    }
  }
  return null;
}

function dropMarks(phrase: string): string[] {
  return phrase
    .replace(/[“”"'’?.!,;:()]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function lastContent(tokens: string[]): string {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = cleanTok(tokens[i]);
    if (t && !ART.has(t) && !PREP.has(t) && t !== "to") return t;
  }
  return cleanTok(tokens[tokens.length - 1] ?? "");
}

function firstContent(tokens: string[]): string {
  for (const raw of tokens) {
    const t = cleanTok(raw);
    if (t && !ART.has(t) && !PREP.has(t) && !LINK.has(t) && t !== "to" && t !== "not") return t;
  }
  return cleanTok(tokens[0] ?? "");
}

export function parsePhrase(word: Word): PhraseParse | null {
  const tokens = dropMarks(word.phrase);
  if (tokens.length === 0) return null;
  const hit = findHead(tokens, word.word);
  if (!hit) {
    return {
      tokens,
      index: -1,
      length: 1,
      left: [],
      right: tokens,
      frame: tokens.slice(0, 4).join(" "),
      prep: null,
      article: null,
      partner: firstContent(tokens),
    };
  }
  const left = tokens.slice(0, hit.index);
  const right = tokens.slice(hit.index + hit.length);
  const windowStart = Math.max(0, hit.index - 2);
  const windowEnd = Math.min(tokens.length, hit.index + hit.length + 2);
  const next = cleanTok(right[0] ?? "");
  const prep = PREP.has(next) ? next : PREP.has(cleanTok(left[left.length - 1] ?? "")) ? cleanTok(left[left.length - 1]!) : null;
  const article = ART.has(next) ? next : ART.has(cleanTok(right[1] ?? "")) && PREP.has(next) ? cleanTok(right[1]!) : null;
  const partner = right.length ? lastContent(right) : firstContent(left);
  return {
    tokens,
    index: hit.index,
    length: hit.length,
    left,
    right,
    frame: tokens.slice(windowStart, windowEnd).join(" "),
    prep,
    article,
    partner,
  };
}

function relatedForm(raw: string): string | null {
  const word = raw.toLowerCase();
  if (word.endsWith("ization")) return `${word.slice(0, -7)}ize`;
  if (word.endsWith("ness") && word.length > 5) return word.slice(0, -4);
  if (word.endsWith("ability")) return `${word.slice(0, -3)}le`;
  if (word.endsWith("ily") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("ly") && word.length > 5 && !word.endsWith("ally") && !word.endsWith("ely")) return word.slice(0, -2);
  return null;
}

function morphHint(word: string, pos: Pos): string | null {
  const w = word.toLowerCase();
  if (pos === "副" && w.endsWith("ly")) {
    const stem = relatedForm(w);
    return stem ? `形容詞 ${stem} の副詞` : "動詞や形容詞の前に置く副詞";
  }
  if (pos === "形" && w.startsWith("un") && !w.startsWith("under") && !w.startsWith("uni") && w.length > 5) {
    return "un- で打ち消す形容詞";
  }
  if (w.startsWith("over") && w.length > 6 && !["overt", "overture", "overall"].includes(w)) return "over- は「過度に・越えて」";
  if (w.startsWith("pre") && ["prevent", "predict", "prepare", "precede", "preview", "prefix", "prehistoric", "precaution"].includes(w)) {
    return "pre- は「前もって」";
  }
  if (w.endsWith("able") || w.endsWith("ible")) return "〜できる／されうる、の形容詞";
  if (pos === "形" && w.endsWith("ive")) return "そのような性質を持つ、の形容詞";
  if (pos === "形" && (w.endsWith("ous") || w.endsWith("ious"))) return "その性質が強い、の形容詞";
  if (pos === "名" && (w.endsWith("tion") || w.endsWith("sion"))) return "行為そのものを指す名詞";
  if (pos === "名" && w.endsWith("ment")) return "行為やその結果の名詞";
  if (pos === "名" && (w.endsWith("ness") || w.endsWith("ity"))) return "性質・状態を表す名詞";
  if (pos === "動" && (w.endsWith("ize") || w.endsWith("ise") || w.endsWith("ate"))) return "フォーマルな他動詞になりやすい";
  return null;
}

function clip(text: string, max = 88): string {
  const compact = text.replace(/\s+/g, " ").replace(/。。/g, "。").trim();
  if (compact.length <= max) return compact;
  const cut = compact.slice(0, max - 1);
  const at = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("、"), cut.lastIndexOf(" "));
  return `${(at > 24 ? cut.slice(0, at) : cut).replace(/[、。 ]+$/, "")}。`;
}

function joinTips(...parts: Array<string | null | undefined>): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    const bit = part.replace(/[。．]+$/g, "").trim();
    if (!bit || seen.has(bit)) continue;
    seen.add(bit);
    out.push(bit);
  }
  return out.length ? `${out.join("。")}。` : "";
}

function frameLead(word: Word, parsed: PhraseParse): string | null {
  const head = word.word;
  const partner = parsed.partner;
  const prep = parsed.prep;
  if (word.pos === "動" && prep && partner && partner !== prep) return `${head} ${prep} ${partner}`;
  if (word.pos === "動" && parsed.index === 0 && partner) return `${head} ＋${partner}`;
  if (word.pos === "形" && parsed.index === 0 && partner && !prep) return `${head} ＋${partner}`;
  if (word.pos === "形" && prep && partner) return `${head} ${prep} ${partner}`;
  if (word.pos === "名" && prep === "of" && partner) return `${head} of ${partner}`;
  if (word.pos === "名" && parsed.left.length && parsed.index + parsed.length === parsed.tokens.length) {
    return `${firstContent(parsed.left)} ${head}`;
  }
  if (parsed.frame && parsed.frame !== head) return parsed.frame;
  return null;
}

function composeFromParse(word: Word, parsed: PhraseParse, extra: string | null): string {
  const head = word.word;
  const pos = word.pos;
  const meaning = word.meaning;
  const partner = parsed.partner;
  const frame = parsed.frame;
  const prep = parsed.prep;
  const related = relatedForm(head);
  const morph = morphHint(head, pos);
  const nuance = MEANING_TIPS[meaning] ?? extra;
  const relatedBit =
    related && related !== head.toLowerCase() && related.length > 3 ? `形容詞/動詞は ${related}` : null;

  if (pos === "句" || head.includes(" ")) {
    return joinTips(`「${frame}」の語順で「${meaning}」`, "分解せずかたまりで覚える");
  }

  if (pos === "前") {
    return joinTips(`${head} ＋名詞で「${meaning}」`, frame !== head ? `定番は ${frame}` : extra);
  }

  if (pos === "接") {
    return joinTips(`${head} で文や語句をつなぎ「${meaning}」`, frame !== head ? `${frame} の形` : extra);
  }

  if (pos === "副") {
    const noPrep = ["abroad", "home", "here", "there", "downtown", "overseas"].includes(head.toLowerCase());
    return joinTips(
      `「${frame}」で「${meaning}」`,
      noPrep ? "前置詞は付けない" : extra && extra !== nuance ? extra : morph ?? "動詞の前後か文末",
    );
  }

  const headFirst = parsed.index === 0;
  const headLast = parsed.index + parsed.length === parsed.tokens.length && parsed.left.length > 0;
  const leftVerb = parsed.left.length > 0 && !ART.has(cleanTok(parsed.left[0]!)) && !PREP.has(cleanTok(parsed.left[0]!));
  const linking = parsed.left.some((tok) => LINK.has(cleanTok(tok)));

  if (pos === "動") {
    if (prep && partner && partner !== prep) {
      return joinTips(`${head} ${prep} ${partner} で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : `${prep} のあとに対象`);
    }
    if (headFirst && partner && ADV.has(partner)) {
      return joinTips(`${head} ${partner} で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : `${partner} が動詞を修飾`);
    }
    if (headFirst && partner) {
      return joinTips(`${head} ＋${partner} で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : morph);
    }
    if (!headFirst && parsed.left.length) {
      const subj = firstContent(parsed.left);
      return joinTips(`${subj} ${head} で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : "目的語を取らない用法");
    }
    return joinTips(`「${frame}」で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : morph);
  }

  if (pos === "形") {
    if (linking) {
      const link = parsed.left.filter((tok) => LINK.has(cleanTok(tok)))[0] ?? "be";
      return joinTips(`${link} ${head} で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : "補語に置く");
    }
    if (prep && partner) {
      return joinTips(`${head} ${prep} ${partner} で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : morph);
    }
    if (headFirst && partner) {
      return joinTips(`${head} ＋${partner} で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : morph);
    }
    return joinTips(`「${frame}」で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : morph);
  }

  if (prep === "of" && partner) {
    return joinTips(`${head} of ${partner} で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : relatedBit);
  }
  if (headLast && leftVerb) {
    const verb = firstContent(parsed.left);
    return joinTips(`${verb} ${head} で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : `${verb} とセットで覚える`);
  }
  if (headLast && parsed.left.length) {
    const mod = firstContent(parsed.left);
    return joinTips(`${mod} ${head} で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : relatedBit);
  }
  if (headFirst && partner) {
    return joinTips(`${head} ＋${partner} で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : morph);
  }
  return joinTips(`「${frame}」で「${nuance ?? meaning}」`, extra && extra !== nuance ? extra : morph ?? relatedBit);
}

export function buildLearnerNote(word: Word): string {
  const idTip = ID_TIPS[word.id];
  if (idTip) return clip(idTip);

  const wordTip = WORD_TIPS[word.word.toLowerCase()];
  const parsed = parsePhrase(word);

  if (wordTip && (wordTip.includes(word.word) || wordTip.includes("＋") || wordTip.startsWith("「"))) {
    return clip(wordTip);
  }

  if (wordTip) {
    const lead = parsed ? frameLead(word, parsed) : null;
    return clip(joinTips(lead, wordTip));
  }

  if (!parsed) {
    return clip(joinTips(MEANING_TIPS[word.meaning], `「${word.meaning}」`, morphHint(word.word, word.pos)));
  }

  return clip(composeFromParse(word, parsed, null));
}

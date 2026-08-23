import { readFileSync, writeFileSync } from "node:fs";

const { buildLearnerNote } = await import(new URL("../src/lib/note.ts", import.meta.url));
const teacherNotes = JSON.parse(readFileSync(new URL("../src/data/teacherNotes.json", import.meta.url), "utf8"));

function rewrite(path) {
  const words = JSON.parse(readFileSync(path, "utf8"));
  const next = words.map((word) => {
    const { note: _dropped, ...rest } = word;
    return { ...rest, note: teacherNotes[String(word.id)] || buildLearnerNote(word) };
  });
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

const files = ["src/data/words.json", "src/data/business.json", "src/data/travel.json"];
const all = files.flatMap(rewrite);
const unique = new Set(all.map((word) => word.note));
console.log(`wrote ${all.length} notes (${unique.size} unique)`);
for (const word of all.slice(0, 12)) {
  console.log(`${word.word}\t${word.note}`);
}

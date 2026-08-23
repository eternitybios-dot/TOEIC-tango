#!/usr/bin/env python3
"""Append living-abroad daily conversation words to the travel deck (part 3)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path("/workspace")
APOS = "\u2019"

LIFE = [
    ("apartment", "名", "アパート", "I rent an apartment nearby.", "近くにアパートを借りています。", "借家ではなく集合住宅。rent an apartment nearby。"),
    ("rent", "名", "家賃", "I pay the rent on Friday.", "金曜に家賃を払います。", "毎月の部屋代。pay the rent on Friday。"),
    ("landlord", "名", "大家", "Call the landlord about this.", "この件は大家に電話して。", "部屋の持ち主。call the landlord about this。"),
    ("neighbor", "名", "隣人", "My neighbor is very kind.", "隣人はとても親切です。", "隣に住む人。my neighbor is kind。"),
    ("mailbox", "名", "郵便受け", "Check the mailbox later.", "あとで郵便受けを見て。", "郵便物の箱。check the mailbox later。"),
    ("garbage", "名", "ごみ", "Take out the garbage tonight.", "今夜ごみを出して。", "捨てるごみ。take out the garbage tonight。"),
    ("recycle", "動", "再利用する", "Please recycle these bottles.", "この瓶は再利用してください。", "資源として出す。recycle these bottles。"),
    ("utilities", "名", "光熱費", "Utilities are not included.", "光熱費は含まれません。", "電気ガス水道。utilities are not included。"),
    ("electricity", "名", "電気", "The electricity went out.", "電気が消えました。", "停電は go out。the electricity went out。"),
    ("gas", "名", "ガス", "Turn off the gas first.", "まずガスを止めて。", "調理・暖房のガス。turn off the gas first。"),
    ("internet", "名", "ネット", "The internet is too slow.", "ネットが遅すぎます。", "回線。the internet is too slow。"),
    ("password", "名", "パスワード", "I forgot the wifi password.", "無線のパスワードを忘れました。", "暗証文字列。forgot the wifi password。"),
    ("lock", "動", "施錠する", "Lock the door behind you.", "出るときドアを施錠して。", "鍵をかける。lock the door behind you。"),
    ("doorbell", "名", "呼び鈴", "Ring the doorbell twice.", "呼び鈴を二度鳴らして。", "玄関のベル。ring the doorbell twice。"),
    ("upstairs", "副", "上の階に", "They live upstairs now.", "彼らは今上の階に住んでいます。", "上階へ。they live upstairs now。"),
    ("downstairs", "副", "下の階に", "The laundry is downstairs.", "洗濯場は下の階です。", "下階へ。the laundry is downstairs。"),
    ("furnished", "形", "家具付きの", "This room is fully furnished.", "この部屋は家具付きです。", "家具が最初からある。fully furnished。"),
    ("unfurnished", "形", "家具なしの", "The place is unfurnished.", "その物件は家具なしです。", "自分で家具を入れる。the place is unfurnished。"),
    ("deposit", "名", "敷金", "I already paid the deposit.", "敷金はもう払いました。", "入居時に預ける金。paid the deposit。"),
    ("lease", "名", "賃貸契約", "Sign the lease this week.", "今週賃貸契約にサインして。", "借りる契約書。sign the lease this week。"),
    ("move in", "句", "入居する", "I will move in on Sunday.", "日曜に入居します。", "荷物を入れて住み始める。move in on Sunday。"),
    ("move out", "句", "退去する", "We move out next month.", "来月退去します。", "部屋を空ける。move out next month。"),
    ("quiet hours", "句", "静粛時間", "Quiet hours start at ten.", "静粛時間は10時からです。", "騒音を控える時間。quiet hours start at ten。"),
    ("groceries", "名", "食料品", "I need to buy groceries.", "食料品を買う必要があります。", "日常の食材。buy groceries。"),
    ("supermarket", "名", "スーパー", "The supermarket closes at nine.", "スーパーは9時に閉まります。", "大型食品店。the supermarket closes at nine。"),
    ("produce", "名", "青果", "Fresh produce is over there.", "新鮮な青果はあちらです。", "野菜と果物。fresh produce is over there。"),
    ("frozen", "形", "冷凍の", "I need some frozen food.", "冷凍食品が要ります。", "凍らせた食品。some frozen food。"),
    ("cart", "名", "カート", "Get a shopping cart first.", "まず買い物カートを取って。", "店内の台車。get a shopping cart first。"),
    ("checkout", "名", "レジ", "The checkout line is long.", "レジの列が長いです。", "会計場。the checkout line is long。"),
    ("ATM", "名", "現金機", "Is there an ATM nearby?", "近くに現金機はありますか。", "現金の出し入れ。an ATM nearby。"),
    ("withdraw", "動", "引き出す", "I will withdraw some cash.", "現金を少し引き出します。", "口座から出す。withdraw some cash。"),
    ("bank account", "句", "銀行口座", "I opened a bank account.", "銀行口座を開きました。", "預金口座。opened a bank account。"),
    ("post office", "句", "郵便局", "The post office closes soon.", "郵便局はもうすぐ閉まります。", "郵便の窓口。the post office closes soon。"),
    ("package", "名", "小包", "I got a package today.", "今日小包が届きました。", "配達された箱。got a package today。"),
    ("mail", "名", "郵便", "Did I get any mail?", "郵便は届いていますか。", "手紙や通知。did I get any mail。"),
    ("address", "名", "住所", "What is your home address?", "自宅の住所はどこですか。", "居所の書き方。your home address。"),
    ("zip code", "句", "郵便番号", "Write the zip code here.", "ここに郵便番号を書いて。", "番地の数字。write the zip code here。"),
    ("clinic", "名", "診療所", "Go to the clinic today.", "今日診療所へ行って。", "小さな病院。go to the clinic today。"),
    ("insurance", "名", "保険", "Do you have health insurance?", "健康保険はありますか。", "医療などの保障。health insurance。"),
    ("prescription", "名", "処方箋", "I need this prescription filled.", "この処方箋を出してください。", "薬の指示書。this prescription filled。"),
    ("commute", "動", "通勤する", "I commute by train.", "電車で通勤しています。", "通いの移動。commute by train。"),
    ("office", "名", "事務所", "I am at the office now.", "今事務所にいます。", "仕事場の建物。at the office now。"),
    ("coworker", "名", "同僚", "Ask your coworker first.", "まず同僚に聞いて。", "同じ職場の人。ask your coworker first。"),
    ("boss", "名", "上司", "My boss is away today.", "上司は今日不在です。", "直属の上の人。my boss is away。"),
    ("salary", "名", "給料", "My salary is paid monthly.", "給料は毎月払われます。", "月ごとの報酬。salary is paid monthly。"),
    ("gym", "名", "ジム", "I go to the gym after work.", "仕事のあとジムへ行きます。", "体を動かす店。go to the gym after work。"),
    ("membership", "名", "会員資格", "I have a gym membership.", "ジムの会員資格があります。", "会費を払う資格。a gym membership。"),
    ("SIM card", "句", "SIMカード", "I need a new SIM card.", "新しいSIMカードが要ります。", "携帯の識別板。a new SIM card。"),
    ("data plan", "句", "通信プラン", "Change my data plan please.", "通信プランを変えてください。", "通信量の契約。change my data plan。"),
    ("trash bag", "句", "ごみ袋", "I need another trash bag.", "ごみ袋がもう一枚要ります。", "ごみを入れる袋。another trash bag。"),
    ("dishwasher", "名", "食洗機", "Run the dishwasher tonight.", "今夜食洗機を回して。", "皿を洗う機械。run the dishwasher tonight。"),
    ("detergent", "名", "洗剤", "We are out of detergent.", "洗剤が切れてます。", "洗う粉や液。out of detergent。"),
    ("plumber", "名", "配管工", "Call a plumber tomorrow.", "明日配管工を呼んで。", "水回りの職人。call a plumber tomorrow。"),
    ("repair", "動", "修理する", "Can you repair this sink?", "この流しは修理できますか。", "壊れた物を直す。repair this sink。"),
    ("broken", "形", "壊れた", "The heater is broken again.", "暖房がまた壊れています。", "動かない状態。the heater is broken。"),
    ("leak", "名", "漏水", "There is a leak under it.", "その下で漏水しています。", "水がにじむ。there is a leak。"),
    ("noisy", "形", "うるさい", "It is too noisy at night.", "夜はうるすぎます。", "音が大きい。too noisy at night。"),
    ("neighborhood", "名", "近所", "This neighborhood is quiet.", "この近所は静かです。", "周り一帯。this neighborhood is quiet。"),
    ("downtown", "名", "繁華街", "Let's walk downtown later.", "あとで繁華街を歩こう。", "街の中心。walk downtown later。"),
    ("parking", "名", "駐車", "Is parking free here?", "ここは駐車無料ですか。", "車を止めること。is parking free here。"),
    ("driver's license", "句", "運転免許", "Show your driver's license.", "運転免許を見せてください。", "運転の許可証。show your driver's license。"),
    ("ID card", "句", "身分証", "I need a photo ID card.", "顔写真付きの身分証が要ります。", "本人確認の札。a photo ID card。"),
    ("residence card", "句", "在留カード", "Bring your residence card.", "在留カードを持ってきて。", "滞在を示すカード。your residence card。"),
    ("city hall", "句", "市役所", "Go to city hall tomorrow.", "明日市役所へ行って。", "役所の本庁。go to city hall。"),
    ("library", "名", "図書館", "The library is free to use.", "図書館は無料で使えます。", "本を借りる場所。the library is free。"),
    ("convenience store", "句", "コンビニ", "There is a convenience store.", "コンビニがあります。", "昼夜開く小さな店。a convenience store。"),
    ("hardware store", "句", "金物店", "Try the hardware store first.", "まず金物店を当たって。", "工具や部品の店。the hardware store first。"),
    ("bike", "名", "自転車", "I commute by bike now.", "今は自転車で通っています。", "二輪の足。commute by bike now。"),
    ("parking ticket", "句", "駐車違反切符", "I got a parking ticket.", "駐車違反切符を切られました。", "止め方の罰金。got a parking ticket。"),
    ("recycling", "名", "資源ごみ", "Put this in recycling.", "これは資源ごみへ入れて。", "再利用のごみ。put this in recycling。"),
    ("water bill", "句", "水道料金", "Pay the water bill today.", "今日水道料金を払って。", "水道の請求。pay the water bill today。"),
    ("heating", "名", "暖房", "The heating is already on.", "暖房はもう入っています。", "部屋を温める装置。the heating is on。"),
    ("oven", "名", "オーブン", "Preheat the oven first.", "まずオーブンを予熱して。", "焼く箱。preheat the oven first。"),
    ("fridge", "名", "冷蔵庫", "The fridge is almost empty.", "冷蔵庫はほぼ空です。", "冷やす箱。the fridge is almost empty。"),
    ("sink", "名", "流し", "The sink is clogged again.", "流しがまた詰まっています。", "水を流す槽。the sink is clogged。"),
    ("toilet paper", "句", "トイレットペーパー", "We need more toilet paper.", "トイレットペーパーが足りません。", "便所の紙。more toilet paper。"),
    ("broom", "名", "ほうき", "Where is the broom?", "ほうきはどこですか。", "掃く道具。where is the broom。"),
    ("vacuum", "動", "掃除機をかける", "Vacuum the floor please.", "床に掃除機をかけて。", "吸い取る掃除。vacuum the floor please。"),
    ("light bulb", "句", "電球", "Change the light bulb.", "電球を替えて。", "明かりの球。change the light bulb。"),
    ("move-in date", "句", "入居日", "What is the move-in date?", "入居日はいつですか。", "住み始める日。the move-in date。"),
]

TALK = [
    ("how are you", "句", "元気ですか", "How are you today?", "今日は元気ですか。", "安否の定番。how are you today。"),
    (f"I{APOS}m fine", "句", "元気です", f"I{APOS}m fine, thank you.", "元気です、ありがとう。", "安否への返し。I'm fine thank you。"),
    (f"what{APOS}s up", "句", "どうしたの", f"What{APOS}s up with you?", "どうしたの。", "軽い安否。what's up with you。"),
    ("long time no see", "句", "久しぶり", "Long time no see, friend.", "久しぶりだね。", "久しぶりの再会。long time no see。"),
    ("of course", "句", "もちろん", "Of course I can help.", "もちろん助けます。", "当然だ、の返事。of course I can help。"),
    ("no problem", "句", "問題ない", "No problem at all.", "全く問題ないよ。", "気にするな、の返し。no problem at all。"),
    ("never mind", "句", "気にしないで", "Never mind about that.", "それは気にしないで。", "取り消しや慰め。never mind about that。"),
    ("I think so", "句", "そう思う", "I think so too.", "私もそう思う。", "同意の考え。I think so too。"),
    (f"I don{APOS}t think so", "句", "そうは思わない", f"I don{APOS}t think so.", "そうは思わない。", "穏やかな否定。I don't think so。"),
    ("I agree", "句", "同感だ", "I agree with you.", "あなたに同感です。", "意見が同じ。I agree with you。"),
    ("maybe", "副", "たぶん", "Maybe after work tonight.", "たぶん今夜仕事のあと。", "不確かな可能性。maybe after work。"),
    ("probably", "副", "おそらく", "I will probably go.", "おそらく行きます。", "高い見込み。I will probably go。"),
    ("because", "接", "なぜなら", "I stayed because it rained.", "雨だったから残った。", "理由をつなぐ。stayed because it rained。"),
    ("if", "接", "もし", "Call me if you need help.", "助けが要なら電話して。", "条件。call me if you need。"),
    ("want", "動", "欲しい", "I want some cold water.", "冷たい水が欲しい。", "欲求。I want some cold water。"),
    ("need", "動", "必要だ", "I need your help now.", "今あなたの助けが必要です。", "欠かせない。I need your help now。"),
    ("like", "動", "好き", "I like this song a lot.", "この歌がとても好き。", "好み。I like this song。"),
    ("prefer", "動", "むしろ好む", "I prefer tea to coffee.", "コーヒーより茶がいい。", "比べて選ぶ。prefer tea to coffee。"),
    ("borrow", "動", "借りる", "Can I borrow this pen?", "このペンを借りていい？", "返前提で借りる。borrow this pen。"),
    ("lend", "動", "貸す", "I can lend you one.", "一つ貸せます。", "相手に渡して貸す。lend you one。"),
    ("return", "動", "返す", "I will return it tomorrow.", "明日返します。", "借りた物を戻す。return it tomorrow。"),
    ("invite", "動", "誘う", "Can I invite you tonight?", "今夜誘っていい？", "集まりへ呼ぶ。invite you tonight。"),
    ("join", "動", "加わる", "Do you want to join us?", "私たちに加わる？", "仲間に入る。want to join us。"),
    ("hang out", "句", "遊ぶ", "Let's hang out later.", "あとで遊ぼう。", "気軽に過ごす。hang out later。"),
    ("birthday", "名", "誕生日", "Happy birthday to you.", "お誕生日おめでとう。", "生まれた日。happy birthday to you。"),
    ("party", "名", "集まり", "Come to my party Saturday.", "土曜の集まりに来て。", "祝いの集まり。come to my party。"),
    ("hobby", "名", "趣味", "What is your hobby?", "趣味は何ですか。", "楽しみの習い。what is your hobby。"),
    ("movie", "名", "映画", "Let's watch a movie tonight.", "今夜映画を見よう。", "映写作品。watch a movie tonight。"),
    ("music", "名", "音楽", "I like this music.", "この音楽が好きです。", "音の楽しみ。I like this music。"),
    ("tired", "形", "疲れた", "I am so tired today.", "今日はとても疲れた。", "体力が落ちた。so tired today。"),
    ("busy", "形", "忙しい", "I am busy until five.", "5時まで忙しい。", "手が空かない。busy until five。"),
    ("free time", "句", "空き時間", "I have free time Sunday.", "日曜は空き時間があります。", "予定のない時間。free time Sunday。"),
    ("hurry", "動", "急ぐ", "Please hurry up a bit.", "少し急いで。", "速度を上げる。please hurry up。"),
    ("remember", "動", "思い出す", "I cannot remember his name.", "彼の名前が思い出せない。", "記憶を引き出す。cannot remember his name。"),
    ("forget", "動", "忘れる", "Do not forget your keys.", "鍵を忘れないで。", "記憶から落とす。do not forget your keys。"),
    ("decide", "動", "決める", "Let's decide after lunch.", "昼のあとで決めよう。", "選択を固める。decide after lunch。"),
    ("choose", "動", "選ぶ", "You can choose first.", "先に選んでいいよ。", "候補から取る。you can choose first。"),
    ("explain", "動", "説明する", "Can you explain that again?", "もう一度説明してくれる？", "わかりやすく述べる。explain that again。"),
    ("repeat", "動", "繰り返す", "Please repeat that slowly.", "それをゆっくり繰り返して。", "同じことを言う。repeat that slowly。"),
    ("spell", "動", "綴る", "Could you spell your name?", "名前を綴ってもらえますか。", "文字を一つずつ。spell your name。"),
    ("write", "動", "書く", "Write it down for me.", "それを書き留めて。", "文字にする。write it down。"),
    ("send", "動", "送る", "I will send a message.", "伝言を送ります。", "先へ届ける。send a message。"),
    ("message", "名", "伝言", "Leave a message for me.", "伝言を残して。", "短い知らせ。leave a message。"),
    ("text me", "句", "メッセージして", "Text me after work.", "仕事のあとメッセージして。", "短い文を送る。text me after work。"),
    ("call me back", "句", "折り返して", "Please call me back soon.", "すぐ折り返して。", "かけ直す依頼。call me back soon。"),
    ("meet", "動", "会う", "Can we meet after work?", "仕事のあと会える？", "顔を合わせる。meet after work。"),
    ("introduce", "動", "紹介する", "Let me introduce my friend.", "友人を紹介させて。", "人を引き合わせる。introduce my friend。"),
    ("congratulations", "名", "おめでとう", "Congratulations on the job.", "就職おめでとう。", "祝いの言葉。congratulations on the job。"),
    ("good luck", "句", "幸運を", "Good luck tomorrow morning.", "明朝、幸運を。", "励まし。good luck tomorrow。"),
    ("cheers", "句", "乾杯", "Cheers to the weekend.", "週末に乾杯。", "杯を合わせる。cheers to the weekend。"),
    (f"I{APOS}m looking for", "句", "探している", f"I{APOS}m looking for the station.", "駅を探しています。", "探している、の切り出し。I'm looking for。"),
    ("is this seat taken", "句", "この席は空いてますか", "Is this seat taken?", "この席は空いてますか。", "席の確認。is this seat taken。"),
    ("could you hold this", "句", "持っててもらえますか", "Could you hold this bag?", "この袋を持っててもらえますか。", "一時預ける依頼。could you hold this。"),
    ("I have a meeting", "句", "会議がある", "I have a meeting at three.", "3時に会議があります。", "予定の会議。I have a meeting at three。"),
    ("can I leave early", "句", "早退していいか", "Can I leave early today?", "今日は早退していい？", "職場の早退。can I leave early。"),
    (f"I{APOS}ll send it", "句", "送ります", f"I{APOS}ll send it tonight.", "今夜送ります。", "後で届ける約束。I'll send it tonight。"),
    (f"what{APOS}s your number", "句", "番号は何番", f"What{APOS}s your number?", "番号は何番ですか。", "電話番号を聞く。what's your number。"),
    (f"what{APOS}s your email", "句", "メールは", f"What{APOS}s your email address?", "メールアドレスは何ですか。", "連絡先のメール。what's your email。"),
    (f"let{APOS}s grab coffee", "句", "コーヒーしよう", f"Let{APOS}s grab coffee after this.", "このあとコーヒーしよう。", "短い休憩の誘い。let's grab coffee。"),
    (f"I{APOS}ll check", "句", "確認する", f"I{APOS}ll check with my boss.", "上司に確認します。", "聞いてから返す。I'll check with my boss。"),
    ("can we talk later", "句", "後で話せる", "Can we talk later?", "後で話せますか。", "今は無理、の延期。can we talk later。"),
    (f"I{APOS}m running late", "句", "遅れている", f"I{APOS}m running late now.", "今遅れています。", "到着が遅れ気味。I'm running late now。"),
    (f"I{APOS}ll be there", "句", "行きます", f"I{APOS}ll be there at five.", "5時には行きます。", "到着の約束。I'll be there at five。"),
    ("sounds good", "句", "いいね", "That sounds good to me.", "それでいいね。", "提案への賛成。that sounds good。"),
    ("that works", "句", "それでいい", "That works for me.", "それで大丈夫です。", "都合が合う。that works for me。"),
    (f"I{APOS}m not sure", "句", "確信がない", f"I{APOS}m not sure yet.", "まだ確信がありません。", "決めきれない。I'm not sure yet。"),
    ("let me think", "句", "考えさせて", "Let me think about it.", "それについて考えさせて。", "即答しない。let me think about it。"),
    (f"sorry I{APOS}m late", "句", "遅れてごめん", f"Sorry I{APOS}m late again.", "また遅れてごめん。", "遅刻の詫び。sorry I'm late again。"),
    ("thanks for waiting", "句", "待たせてごめん", "Thanks for waiting.", "待たせてごめん。", "待たせた礼。thanks for waiting。"),
    ("after you", "句", "お先にどうぞ", "After you, please.", "お先にどうぞ。", "先を譲る。after you please。"),
    ("go ahead", "句", "どうぞ", "Please go ahead.", "どうぞ先に。", "先に進めて、の許可。please go ahead。"),
    ("take your time", "句", "急がなくていい", "Take your time with it.", "急がなくていいよ。", "急かさない。take your time。"),
    ("I got it", "句", "わかった", "I got it, thanks.", "わかった、ありがとう。", "理解した合図。I got it thanks。"),
    ("I made a mistake", "句", "間違えた", "I made a mistake there.", "そこで間違えました。", "誤りを認める。I made a mistake。"),
    ("no worries", "句", "気にするな", "No worries at all.", "全然気にするな。", "相手を安心させる。no worries at all。"),
    ("my pleasure", "句", "こちらこそ", "My pleasure to help.", "お役に立ててこちらこそ。", "礼への丁寧な返し。my pleasure to help。"),
    ("catch you later", "句", "またな", "Catch you later then.", "じゃあまたな。", "カジュアルな別れ。catch you later then。"),
    ("take it easy", "句", "気楽に", "Take it easy tonight.", "今夜は気楽にね。", "無理するな。take it easy tonight。"),
    ("keep in touch", "句", "連絡して", "Let's keep in touch.", "連絡しよう。", "縁を切らさない。keep in touch。"),
    ("of course not", "句", "もちろん違う", "Of course not.", "もちろん違います。", "否定を強める。of course not。"),
    (f"I{APOS}ll get it", "句", "取ってくる", f"I{APOS}ll get it.", "取ってくる。", "電話やドアへ行く。I'll get it。"),
]


def card(start_id: int, unit: int, rows: list[tuple[str, str, str, str, str, str]]) -> list[dict]:
    out = []
    for i, (word, pos, meaning, phrase, phrase_ja, note) in enumerate(rows):
        out.append(
            {
                "id": start_id + i,
                "word": word,
                "ipa": "",
                "pos": pos,
                "meaning": meaning,
                "phrase": phrase,
                "phraseJa": phrase_ja,
                "part": 3,
                "unit": unit,
                "note": note,
            }
        )
    return out


def main() -> None:
    travel_path = ROOT / "src/data/travel.json"
    teacher_path = ROOT / "src/data/teacherNotes.json"
    tips_path = ROOT / "src/lib/noteTips.ts"
    words_path = ROOT / "src/data/words.json"
    biz_path = ROOT / "src/data/business.json"

    travel = json.loads(travel_path.read_text())
    existing_heads = {w["word"].lower() for w in travel}
    new_cards = card(30219, 4, LIFE) + card(30219 + len(LIFE), 5, TALK)

    for w in new_cards:
        key = w["word"].lower()
        if key in existing_heads:
            raise SystemExit(f"duplicate headword: {w['word']}")
        existing_heads.add(key)
        if " " not in w["phrase"].strip():
            raise SystemExit(f"phrase needs a space: {w['word']}")
        if not (12 <= len(w["note"]) <= 96):
            raise SystemExit(f"bad note length {len(w['note'])}: {w['word']} {w['note']}")

    notes = []
    for path in (words_path, biz_path, travel_path):
        notes.extend(item["note"] for item in json.loads(path.read_text()) if item.get("note"))
    notes.extend(w["note"] for w in new_cards)
    if len(notes) != len(set(notes)):
        from collections import Counter
        dups = [n for n, c in Counter(notes).items() if c > 1]
        raise SystemExit(f"note collisions: {dups[:8]}")

    banned = [
        "とセットで覚える",
        "フォーマルな他動詞になりやすい",
        "のあとに対象",
        "結びつきやすい",
        "を指す名詞",
        "分解せずこの語順で覚える",
        "補語に置く",
        "人や物の性質・状態を表す",
    ]
    for w in new_cards:
        for phrase in banned:
            if phrase in w["note"]:
                raise SystemExit(f"banned in {w['word']}: {phrase}")

    travel.extend(new_cards)
    travel_path.write_text(json.dumps(travel, ensure_ascii=False, indent=2) + "\n")

    teacher = json.loads(teacher_path.read_text())
    for w in new_cards:
        teacher[str(w["id"])] = w["note"]
    teacher_path.write_text(json.dumps(teacher, ensure_ascii=False, separators=(",", ":")) + "\n")

    tips = tips_path.read_text()
    extra = ",\n".join(f'  {w["id"]}: {json.dumps(w["note"], ensure_ascii=False)}' for w in new_cards)
    needle = '  30218: "また後で。See you later。",\n};'
    if needle not in tips:
        raise SystemExit("noteTips anchor missing")
    tips_path.write_text(tips.replace(needle, f'  30218: "また後で。See you later。",\n{extra}\n}};'))

    print(f"added {len(new_cards)} words; travel now {len(travel)}")
    print(f"unit4={sum(1 for w in travel if w['unit']==4)} unit5={sum(1 for w in travel if w['unit']==5)}")


if __name__ == "__main__":
    main()

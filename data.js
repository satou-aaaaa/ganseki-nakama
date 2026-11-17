// 岩石なかま分けの問題を作る（ブラウザと node の両方で使う）。
// 中身は、産業技術総合研究所 地質調査総合センター（GSJ）の「岩石の分類」「岩石や地層のでき方」「日本の火山とマグマ」に書いてあることだけ（2026-11-17 に読んだ。下の SRC）。
// 1問は、岩石のでき方・もとになったものの説明を見て、岩石の名前を選ぶ。正解したら2段目「この岩石は、どのなかま？」（火成岩・堆積岩・変成岩）を選ぶ。
// 火砕岩（凝灰岩など）は、資料で火成岩とも堆積岩とも分けられるとあるので出さない。花こう岩と閃緑岩（どちらも深成岩）、泥岩とシルト岩は、
// 資料の言葉だけでは見分けられないので、閃緑岩・シルト岩は選び肢にも入れない。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・言い回しの並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];
  const BUNRUI = "https://www.gsj.jp/geology/fault-fold/formation/r-classification/index.html";
  const DEKIKATA = "https://www.gsj.jp/geology/fault-fold/formation/index.html";
  const KAZAN = "https://www.gsj.jp/geology/geology-japan/geology-volcano/index.html";

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    bunrui: ["産総研 地質調査総合センター「岩石の分類」", BUNRUI],
    dekikata: ["産総研 地質調査総合センター「岩石や地層のでき方」", DEKIKATA],
    kazan: ["産総研 地質調査総合センター「日本の火山とマグマ」", KAZAN],
  };

  // 選び肢になる岩石（14）
  const LEVELS = ["玄武岩", "流紋岩", "花こう岩", "礫岩", "砂岩", "泥岩", "石灰岩", "チャート", "ホルンフェルス", "大理石（結晶質石灰岩）", "片麻岩", "結晶片岩", "千枚岩", "蛇紋岩"];
  // 岩石 → なかま（資料「岩石の分類」の3つ）
  const GRP_OF = { "玄武岩": "kasei", "流紋岩": "kasei", "花こう岩": "kasei", "礫岩": "taiseki", "砂岩": "taiseki", "泥岩": "taiseki", "石灰岩": "taiseki", "チャート": "taiseki",
    "ホルンフェルス": "hensei", "大理石（結晶質石灰岩）": "hensei", "片麻岩": "hensei", "結晶片岩": "hensei", "千枚岩": "hensei", "蛇紋岩": "hensei" };
  // 2段目「この岩石は、どのなかま？」の3つ
  const GROUPS = {
    kasei: { name: "火成岩", sub: "マグマからかたまってできる" },
    taiseki: { name: "堆積岩", sub: "ふりつもったものがかたまってできる" },
    hensei: { name: "変成岩", sub: "強い熱や圧力をうけてできる" },
  };
  const GRP_WHY = {
    kasei: "火成岩は、マグマからかたまってできる岩石です。",
    taiseki: "堆積岩は、ふりつもったものがかたまってできる岩石です。",
    hensei: "変成岩は、もとの岩石が強い熱や圧力をうけてできる岩石です。",
  };

  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }

  // 選び肢：やさしいは3つ（まぎらわしい岩石 near を入れない）、ふつうは4つ、むずかしいは4つ（near を1つ必ず入れる）
  function distract(R, a, lv, near, same) {
    const all = LEVELS.map((_, i) => i).filter((i) => i !== a && !same.includes(i)); // same：資料の言葉ではこの説明にも当てはまりうる岩石。まちがいの選び肢にしない
    if (lv === 0) return pickN(R, all.filter((i) => !near.includes(i)), 2);
    if (lv === 1) return pickN(R, all, 3);
    const nb = all.filter((i) => near.includes(i)), rest = all.filter((i) => !near.includes(i));
    return [...pickN(R, nb, 1), ...pickN(R, rest, 2)];
  }
  function rockQ(a, sit, near, same) {
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), ds = distract(R, a, lv, near, same);
      const q = sit[si] + "　この岩石は？";
      return { type: "act", media: "岩石のでき方", q, opts: shuffle(R, [a, ...ds]).map((i) => LEVELS[i]), ans: LEVELS[a], rev: false, v: `${si}:${ds.join(".")}` };
    };
  }
  // id：種類、lv：難しさ、ans：答えの岩石、look：1回目のヒント、key：2回目のヒント（資料の言葉）、why：説明、sit：言い方、near：まぎらわしい岩石、src：出典
  const K = (id, lv, ans, look, key, why, sit, near = [], src = ["bunrui"], same = []) => {
    const a = LEVELS.indexOf(ans), nr = near.map((n) => LEVELS.indexOf(n)), sm = same.map((n) => LEVELS.indexOf(n));
    if (a < 0 || nr.some((i) => i < 0) || sm.some((i) => i < 0)) throw new Error("岩石の名前がちがう: " + id);
    return { id, lv, a, ans, grp: GRP_OF[ans], near: nr, same: sm, name: ans, look, key, why, src, make: rockQ(a, sit, nr, sm) };
  };

  const KINDS = [
    // ---- やさしい ----
    K("reki", 0, "礫岩", "つぶの大きさに注目しましょう。", "礫を主体とする岩石。",
      "礫岩は、礫（大きな石のつぶ）を主体とする堆積岩です。",
      ["礫（大きな石のつぶ）がふりつもって、かたまった。", "おもに礫でできている岩石。"], ["砂岩"], ["bunrui", "dekikata"]),
    K("sa", 0, "砂岩", "つぶの大きさに注目しましょう。", "砂を主体とする岩石。",
      "砂岩は、砂を主体とする堆積岩です。",
      ["砂がふりつもって、かたまった。", "おもに砂のつぶでできている岩石。"], ["礫岩", "泥岩"], ["bunrui", "dekikata"]),
    K("dei", 0, "泥岩", "とても細かいつぶです。", "シルトや粘土を主体とする岩石。",
      "泥岩は、シルトや粘土を主体とする堆積岩です。",
      ["粘土やシルトなどの、とても細かいつぶがふりつもって、かたまった。", "おもにシルトや粘土でできている岩石。"], ["砂岩"], ["bunrui", "dekikata"]),
    K("sekkai", 0, "石灰岩", "海の生き物の殻がもとです。", "石灰質の殻をもつ生物（サンゴ、有孔虫など）起源の岩石。",
      "石灰岩は、サンゴや有孔虫など、石灰質の殻をもつ生き物がもとになった堆積岩です。",
      ["サンゴや有孔虫など、石灰質の殻をもつ生き物がもとになった。", "石灰質の殻をもつ生き物の殻がふりつもって、かたまった。"], ["チャート", "大理石（結晶質石灰岩）"]),
    K("genbu", 0, "玄武岩", "マグマが地表に出てきました。", "高温のマグマが噴出してできた。",
      "玄武岩は、高温のマグマが噴出してできた火成岩です。低温のマグマからできる流紋岩とは、ふくむ結晶（鉱物の種類）がちがいます。",
      ["高温のマグマが、地表に噴き出してかたまった。", "火山から噴き出した、温度の高いマグマがかたまった。"], ["流紋岩"], ["bunrui", "dekikata"]),
    K("kakou", 0, "花こう岩", "地下深くでかたまったマグマです。", "花こう岩などの深成岩は、かつてその上に火山があった。",
      "花こう岩は深成岩の1つで、地下のマグマがかたまったものです。多くの場合、かつてはその上に火山がありました（閃緑岩も深成岩です）。",
      ["地下深くでマグマがかたまった深成岩。上の火山がけずられて、地表に出てきた。", "かつて上に火山があった、地下のマグマのかたまりが地表に出た深成岩。"], ["玄武岩", "流紋岩"], ["kazan", "bunrui"]),
    // ---- ふつう ----
    K("chert", 1, "チャート", "とても小さな生き物の殻がもとです。", "珪質の殻をもつ微生物（放散虫、珪藻など）起源の岩石。",
      "チャートは、放散虫や珪藻など、珪質の殻をもつ微生物がもとになった堆積岩です。",
      ["放散虫や珪藻など、珪質の殻をもつ小さな生き物がもとになった。", "珪質の殻をもつ微生物の殻がふりつもって、かたまった。"], ["石灰岩"]),
    K("ryumon", 1, "流紋岩", "マグマの温度に注目しましょう。", "玄武岩よりは低温のマグマからできた。",
      "流紋岩は、玄武岩をつくるマグマよりは低温のマグマからできた火成岩です。玄武岩とは、ふくむ結晶（鉱物の種類）がちがいます。",
      ["玄武岩をつくるマグマよりも、温度の低いマグマからできた。", "玄武岩とは、ふくむ結晶（鉱物の種類）がちがう。低温のマグマからできた火成岩。"], ["玄武岩"], ["dekikata", "bunrui"], ["花こう岩"]),
    K("horn", 1, "ホルンフェルス", "もとは泥岩で、熱だけを受けました。", "主に泥岩が熱を受けて緻密になった岩石。",
      "ホルンフェルスは、主に泥岩が熱を受けて緻密になった変成岩（熱変成岩・接触変成岩）です。",
      ["主に泥岩が強い熱を受けて、緻密（目がつまった状態）になった。", "泥岩がマグマなどの熱を受けてできた、熱変成岩（接触変成岩）。"], ["千枚岩"]),
    K("marble", 1, "大理石（結晶質石灰岩）", "もとは石灰岩です。", "石灰岩が再結晶して粗粒になった岩石。",
      "大理石（結晶質石灰岩）は、石灰岩が再結晶して、つぶが粗くなった変成岩です。",
      ["石灰岩が再結晶して、つぶが粗くなった。", "もとは石灰岩。熱などで結晶がつくり直され、粗いつぶになった変成岩。"], ["石灰岩"]),
    // ---- むずかしい ----
    K("henma", 2, "片麻岩", "とくに「熱」が高いです。", "高い熱と圧力を受けて縞状の組織を持つようになった岩石。",
      "片麻岩は、高い熱と圧力を受けて縞状の組織を持つようになった変成岩です。結晶片岩は、熱と高い圧力を受けてできます。",
      ["とくに高い熱と、圧力を受けて、縞もようの組織をもつようになった。", "高い熱と圧力で、縞状の組織になった変成岩。結晶片岩より熱が高い。"], ["結晶片岩"]),
    K("kessho", 2, "結晶片岩", "とくに「圧力」が高いです。", "熱と高い圧力を受けて縞状の組織を持つようになった岩石。",
      "結晶片岩は、熱と高い圧力を受けて縞状の組織を持つようになった変成岩です。片麻岩は、高い熱と圧力を受けてできます。",
      ["熱と、とくに高い圧力を受けて、縞もようの組織をもつようになった。", "熱と高い圧力で、縞状の組織になった変成岩。片麻岩より圧力が高い。"], ["片麻岩"]),
    K("senmai", 2, "千枚岩", "もとは泥岩で、熱と圧力を受けました。", "主に泥岩が熱と圧力により剥離性を持つようになった岩石。",
      "千枚岩は、主に泥岩が熱と圧力を受けて、うすくはがれやすい性質（剥離性）をもつようになった変成岩です。熱だけで緻密になるとホルンフェルスです。",
      ["主に泥岩が熱と圧力を受けて、うすくはがれやすくなった。", "泥岩がもとで、熱と圧力により剥離性（はがれやすさ）をもつようになった。"], ["ホルンフェルス", "泥岩"]),
    K("jamon", 2, "蛇紋岩", "もとは、かんらん岩です。", "かんらん岩が熱と圧力を受けた岩石。",
      "蛇紋岩は、かんらん岩が熱と圧力を受けた変成岩です。かんらん石や輝石が蛇紋石に変わってできます。",
      ["かんらん岩が熱と圧力を受けてできた。", "かんらん石や輝石が、蛇紋石に変わってできた。"], ["片麻岩", "結晶片岩"]),
    K("genbu2", 2, "玄武岩", "マグマの温度に注目しましょう。", "流紋岩よりも高温のマグマが噴出してできた。",
      "玄武岩は、高温のマグマが噴出してできた火成岩です。流紋岩は、それよりは低温のマグマからできます。",
      ["流紋岩をつくるマグマよりも、温度の高いマグマが噴き出してできた。", "流紋岩とは、ふくむ結晶（鉱物の種類）がちがう。高温のマグマが噴き出してできた。"], ["流紋岩"], ["dekikata", "bunrui"]),
  ];
  KINDS.find((k) => k.id === "genbu2").name = "玄武岩（流紋岩とくらべる）"; // 岩石帳で「玄武岩」と見分ける
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 1問を作る。tag は「種類|種」（例 "reki|2026-11-17:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = BY[kind];
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, gwhy: GRP_WHY[k.grp], src: k.src.map((s) => SRC[s]), ...p };
  }
  // 同じ問題かを見分ける鍵（種類・言い方・選び肢の組）
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const GNK = { KINDS, BY, GROUPS, GRP_OF, GRP_WHY, LV, SRC, LEVELS, ORGS: LEVELS, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = GNK; else root.GNK = GNK;
})(typeof self !== "undefined" ? self : this);

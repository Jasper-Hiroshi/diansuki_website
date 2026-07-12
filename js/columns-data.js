/**
 * diansss.com — 专栏数据
 *
 * 数据结构：
 *   left / right   — 左右两栏
 *     title         — 栏目标题
 *     articles      — 文章列表
 *       title       — 文章名称
 *       date        — 发布日期，格式 YYYY-MM-DD
 *       link        — 文章链接（左栏用）
 *       content     — 文章全文（右栏用，支持多行）
 */
var columnsData = {
  left: {
    title: "点酥的非严谨民俗小知识",
    articles: [{ title: "易文化", date: "2025-05-01", link: "https://www.bilibili.com/opus/1061853487713746962/?from=readlist" },
      { title: "萨满", date: "2025-05-01", link: "https://www.bilibili.com/opus/1062043991001792515/?from=readlist" },
      { title: "古代捉奸如何处置？——“登时杀死”", date: "2025-05-03", link: "https://www.bilibili.com/opus/1062425749160460289/?from=readlist" },
      { title: "四大判官", date: "2025-05-04", link: "https://www.bilibili.com/opus/1062978116323901445/?from=readlist" },
      { title: "夜叉与罗刹", date: "2025-05-06", link: "https://www.bilibili.com/opus/1063887249214537737/?from=readlist" },
      { title: "立夏习俗 称人·斗蛋", date: "2025-05-09", link: "https://www.bilibili.com/opus/1064840641734770696/?from=readlist" },
      { title: "大寒 与节气之“三候”", date: "2026-01-21", link: "https://www.bilibili.com/opus/1160016837858033668/?from=readlist" },
      { title: "“腊八”与“腊八粥”", date: "2026-01-27", link: "https://www.bilibili.com/opus/1162261602514239540/?from=readlist" },
      { title: "儒家五正色 与 道教五色缯", date: "2026-01-31", link: "https://www.bilibili.com/opus/1163724893554999315/?from=readlist" },
      { title: "虚岁", date: "2026-03-16", link: "https://www.bilibili.com/opus/1180052005566021638/?from=readlist" },
      { title: "公历、阳历、阴历、农历、干支历、老黄历、万年历", date: "2026-03-24", link: "https://www.bilibili.com/opus/1183052216353685513/?from=readlist" }
    ]
  },
  right: {
    title: "兵马酥的怪文书",
    articles: []
  }
};

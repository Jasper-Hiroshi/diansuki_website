# diansss.com

个人粉丝站静态网站（HTML + CSS + JavaScript）。

## 项目结构

```
diansss.com/
├── index.html          # 首页
├── css/
│   └── style.css       # 样式
├── js/
│   └── main.js         # 口头禅轮播、下拉滚动等
├── assets/
│   └── images/         # 图片资源（头像、背景等）
└── README.md
```

## 本地预览

用浏览器直接打开 `index.html`，或使用本地静态服务器：

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

## 当前状态

- 首页布局与基础样式已完成
- 链接与数据均为占位内容
- 尚未接入 bilibili / Twitter 等真实 API

## 后续可替换

- `assets/images/` 中放入真实头像与背景图
- `index.html` 中的链接与名称
- `js/main.js` 中的口头禅列表
- 接入 API 后更新粉丝数与动态卡片

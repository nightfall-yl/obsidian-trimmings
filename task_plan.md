# Task Plan

## Goal
为 `Homeboard` 增加可视化设置面板、更多卡片类型（`quote`、`links`、`dataview`），并把列布局升级为接近 `Simple Columns` 的可拖拽宽度版本。

## Phases
- [completed] 1. 研究现有实现与确认可复用模块
- [completed] 2. 设计设置数据结构、首页 schema 与拖拽宽度存储方式
- [completed] 3. 实现插件设置面板与可视化插入/编辑入口
- [completed] 4. 实现新卡片类型与主页渲染增强
- [completed] 5. 实现列宽拖拽与样式持久化
- [completed] 6. 构建验证并补示例

## Decisions
- 优先在现有 `homepage` YAML schema 上做增强，避免先引入复杂的所见即所得编辑器。
- 可视化设置面板先服务于“插入/生成 homepage block”，之后再考虑对已存在 block 的原位编辑。
- 列宽拖拽采用 CSS Grid 百分比列模板加绝对定位 resizer，而不是把卡片重新改造成固定列容器。

## Errors Encountered
- 直接用 `node` `require("./main.js")` 做运行时自检会失败，因为产物依赖 Obsidian 宿主环境中的 `obsidian` 模块；改为以 `npm run build` 作为主要验证方式。

# Findings

## Source Plugins
- `Contribution Graph` 的核心可复用部分已经迁入当前项目，主要包括 Dataview 查询、YAML 配置协调与热力图渲染。
- `Simple Columns` 的拖拽列宽关键资产较轻：`ColumnRenderer` 仅负责生命周期，真正可复用的是样式变量和 resizer 交互思路。

## Current Plugin
- 现有 `homepage` 代码块已经支持 `markdown` 和 `contributionGraph` 卡片。
- 当前实现还没有插件设置、卡片 schema 扩展、也没有宽度拖拽持久化。

## New Architecture
- 新增 `Homepage Builder` 弹窗，通过表单生成 `homepage` 代码块，避免手写 YAML。
- 新增全局设置页，支持默认列数、卡片样式、resizer 外观与最小列宽。
- `homepage` 现在支持 `quote`、`links`、`dataview`、`markdown`、`contributionGraph` 五类卡片。
- 列宽存储使用 `homeboard-widths-<blockId>` 形式的 localStorage；`id` 越稳定，拖拽结果越稳定。
- 新增“编辑已有 homepage block”的能力：把光标放进现有 ` ```homepage ` 代码块中，即可通过命令重新打开 Builder 并回写。

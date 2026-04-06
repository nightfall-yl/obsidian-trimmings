# Homeboard

`Homeboard` 是一个 Obsidian 插件，用来把你的首页笔记做成“可配置的导航仪表盘”。

当前版本聚焦于：
- `homeboard` 多列布局
- `links` 导航卡片
- 可视化 `Homepage Builder`

## 功能特点

- 支持 `homeboard` 代码块渲染首页卡片布局
- 支持多列卡片排版
- 支持拖拽调整列宽，并自动记住宽度
- 支持可视化 `Homepage Builder`
- 支持编辑已有 `homeboard` 代码块并回填到 Builder
- 当前只保留 `links` 卡片
- 已恢复 `heatmap` 代码块渲染、创建与编辑能力

## 安装

### 方式一：直接安装编译产物

已经编译好的安装文件在：

- [release/main.js](/Users/yanfan/Documents/Codex/homeboard/release/main.js)
- [release/manifest.json](/Users/yanfan/Documents/Codex/homeboard/release/manifest.json)
- [release/styles.css](/Users/yanfan/Documents/Codex/homeboard/release/styles.css)

把这 3 个文件复制到你的 Obsidian 插件目录：

```text
.obsidian/plugins/obsidian-homeboard/
```

然后在 Obsidian 里启用 `Homeboard`。

### 方式二：本地开发构建

```bash
npm install
npm run build
```

`npm run build` 会同时更新根目录产物和 `release/` 下的安装文件。

## 使用方法

### 1. 打开可视化 Builder

插件启用后，可以通过以下方式打开：

- 命令面板运行 `Open Homeboard builder`

Builder 现在会直接绑定当前 `homeboard` 代码块，调整即生效。

### 2. 编辑已有 homeboard 代码块

把光标放在一个现有的 `homeboard` 代码块内部，然后运行命令：

```text
Edit Homeboard block at cursor
```

插件会自动读取当前配置，打开 Builder，并在保存后直接回写原代码块。

### 3. 使用 homeboard 代码块

示例：

```homeboard
id: homepage-main
title: 我的首页
columns: 2
gap: 16
cards:
  - type: links
    title: CODE信息管理
    span: 1
    linksLayout: inline
    links:
      - label: 收件箱
        url: 00.收件箱-Index
      - label: 快速捕获
        url: QuickCap
      - label: 日记
        url: 00.Daily Index

  - type: links
    title: PARA组织管理
    span: 1
    linksLayout: inline
    links:
      - label: 项目
        url: 00.项目 Index
      - label: 领域
        url: 00.领域 Index
      - label: 资源
        url: 00.资源 Index
```

## 卡片类型说明

### `links`

适合放常用页面、项目入口、外部网站。

```yaml
- type: links
  title: Quick Links
  links:
    - label: Inbox
      url: obsidian://open?vault=YourVault&file=Inbox
    - label: GitHub
      url: https://github.com/
      external: true
```

## 列布局与拖拽

- `columns` 控制首页列数，范围 1 到 4
- `gap` 控制卡片间距
- 每张卡片可以通过 `span` 跨列
- 预览模式下可以拖动列分隔条调整列宽
- 宽度会保存在本地 localStorage 中

为了让拖拽结果稳定，建议给每个 `homeboard` 代码块设置固定的 `id`：

```yaml
id: homepage-main
```

## 插件命令

- `Insert Homeboard block`
- `Open Homeboard builder`
- `Edit Homeboard block at cursor`

在任意 Markdown 文档编辑区右键，可以选择“新增Homeboard组件”，再从二级菜单里点“新建热力图”或“新建分栏”。

## 设置项

插件设置页入口已移除，当前主要通过命令面板、右键菜单和区块内编辑按钮操作。

## 当前状态

当前版本：`2026.3`

已经实现：
- 可视化 Builder
- 已有 block 回填编辑
- Links 导航卡片
- 列宽拖拽持久化

后续可以继续增强：
- 继续收敛热力图与 Homeboard 的交互整合
- 点击预览卡片自动定位到对应编辑区
- 更多导航样式

## 开发

项目目录：

- [src/main.ts](/Users/yanfan/Documents/Codex/homeboard/src/main.ts)
- [src/builderModal.ts](/Users/yanfan/Documents/Codex/homeboard/src/builderModal.ts)
- [src/homepageProcessor.ts](/Users/yanfan/Documents/Codex/homeboard/src/homepageProcessor.ts)
- [src/settings.ts](/Users/yanfan/Documents/Codex/homeboard/src/settings.ts)

构建命令：

```bash
npm run build
```

# WTT Timezone Converter

[English](README_EN.md) | [简体中文](README.md)

自动将 WTT (World Table Tennis) 官网赛程与签表中的比赛时间转换为本地时间或指定时区。

## 功能

- **时区转换**：自动将场馆当地时间转换为本机当前时区（默认）或手动指定的时区。
- **跨日计算**：根据时差自动计算跨午夜的比赛日期顺延或前移。
- **国际化**：根据浏览器语言自动显示中文、日文或英文界面。
- **界面设置**：页面右下角显示当前时区指示器，点击可打开设置面板切换时区。

## 安装与使用

### 准备工作

安装用户脚本管理器（任选其一）：
- [Tampermonkey](https://www.tampermonkey.net/)
- [Violentmonkey](https://violentmonkey.github.io/)

### 安装步骤

1. 打开脚本管理器面板，点击新建脚本。
2. 将 [`src/wtt-timezone-converter.user.js`](src/wtt-timezone-converter.user.js) 中的代码复制粘贴进去并保存。
3. 访问 [WTT 赛事页面](https://worldtabletennis.com/)。
4. 页面右下角显示时区徽标，点击可打开时区设置面板。

## 目录结构

```text
wtt-timezone-converter/
├── .gitignore
├── README.md                          # 项目说明（中文）
├── README_EN.md                       # 项目说明（英文）
├── AGENTS.md                          # 开发规范与 API 说明
└── src/
    └── wtt-timezone-converter.user.js # 用户脚本源码
```

## 许可证

MIT License

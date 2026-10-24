# WTT Timezone Converter

[English](README_EN.md) | [简体中文](README.md)

Automatically converts match schedule and bracket times on the World Table Tennis (WTT) official website to local or user-selected timezone.

## Features

- **Timezone Conversion**: Converts venue local time to device local timezone (default) or a manually selected timezone.
- **Date Rollover Handling**: Automatically shifts match dates across midnight according to timezone difference.
- **Internationalization**: Follows browser language, supporting Chinese, Japanese, and English.
- **In-Page Settings**: Compact timezone indicator at the bottom-right corner; click to open the settings panel.

## Installation & Usage

### Prerequisites

Install a userscript manager extension:
- [Tampermonkey](https://www.tampermonkey.net/)
- [Violentmonkey](https://violentmonkey.github.io/)

### Installation Steps

1. Open the userscript manager dashboard and click Create a new script.
2. Copy and paste the code from [`src/wtt-timezone-converter.user.js`](src/wtt-timezone-converter.user.js), then save (`Ctrl + S`).
3. Navigate to any [WTT event page](https://worldtabletennis.com/).
4. A timezone indicator will appear at the bottom-right corner; click it to open the settings modal.

## Directory Structure

```text
wtt-timezone-converter/
├── .gitignore
├── README.md                          # Project documentation (Chinese)
├── README_EN.md                       # Project documentation (English)
├── AGENTS.md                          # AI development guidelines & API specs
└── src/
    └── wtt-timezone-converter.user.js # Userscript source code
```

## License

MIT License

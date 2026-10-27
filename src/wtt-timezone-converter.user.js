// ==UserScript==
// @name         WTT Timezone Converter
// @namespace    https://github.com/wtt-tools/wtt-timezone-converter
// @version      1.0.0
// @description  Converts match schedules and bracket dates/times on World Table Tennis (WTT) to local or selected timezone with multi-language (zh/ja/en) support.
// @author       Open Source Contributor
// @match        https://worldtabletennis.com/*
// @match        https://www.worldtabletennis.com/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY_MODE = 'wtt_tz_mode'; // 'auto' | 'manual'
    const STORAGE_KEY_OFFSET = 'wtt_tz_offset'; // number (hours), e.g. 8

    // Internationalization (i18n): zh / ja / en
    function getLocale() {
        const lang = (navigator.language || (navigator.languages && navigator.languages[0]) || 'en').toLowerCase();
        if (lang.startsWith('zh')) return 'zh';
        if (lang.startsWith('ja')) return 'ja';
        return 'en';
    }

    const I18N = {
        zh: {
            badge_local: '(本地)',
            badge_title: '点击设置赛程时区',
            modal_title: '赛程时区设置',
            auto_label: '跟随本机时区',
            manual_label: '手动选择时区',
            btn_cancel: '取消',
            btn_save: '保存',
            menu_settings: '⚙️ 赛程时区设置',
            menu_reset: '🔄 恢复为跟随本机时间'
        },
        ja: {
            badge_local: '(ローカル)',
            badge_title: 'クリックして試合日程のタイムゾーンを設定',
            modal_title: '試合日程のタイムゾーン設定',
            auto_label: '端末のタイムゾーンに合わせる',
            manual_label: '手動でタイムゾーンを選択',
            btn_cancel: 'キャンセル',
            btn_save: '保存',
            menu_settings: '⚙️ 試合日程のタイムゾーン設定',
            menu_reset: '🔄 端末のタイムゾーンに戻す'
        },
        en: {
            badge_local: '(Local)',
            badge_title: 'Click to set schedule timezone',
            modal_title: 'Schedule Timezone Settings',
            auto_label: 'Follow device timezone',
            manual_label: 'Select timezone manually',
            btn_cancel: 'Cancel',
            btn_save: 'Save',
            menu_settings: '⚙️ Schedule Timezone Settings',
            menu_reset: '🔄 Reset to Device Timezone'
        }
    };

    function t(key) {
        const loc = getLocale();
        return (I18N[loc] && I18N[loc][key]) || I18N.en[key] || '';
    }

    // Standard timezone list with zh/ja/en labels
    const TIMEZONES = [
        { value: -12, zh: 'UTC-12:00 (贝克岛)', ja: 'UTC-12:00 (ベーカー島)', en: 'UTC-12:00 (Baker Island)' },
        { value: -11, zh: 'UTC-11:00 (萨摩亚)', ja: 'UTC-11:00 (サモア)', en: 'UTC-11:00 (Samoa)' },
        { value: -10, zh: 'UTC-10:00 (夏威夷)', ja: 'UTC-10:00 (ハワイ)', en: 'UTC-10:00 (Hawaii)' },
        { value: -9, zh: 'UTC-9:00 (阿拉斯加)', ja: 'UTC-9:00 (アラスカ)', en: 'UTC-9:00 (Alaska)' },
        { value: -8, zh: 'UTC-8:00 (美国太平洋时间: 洛杉矶/旧金山)', ja: 'UTC-8:00 (太平洋標準時: ロサンゼルス/サンフランシスコ)', en: 'UTC-8:00 (Pacific Time: Los Angeles, San Francisco)' },
        { value: -7, zh: 'UTC-7:00 (美国山地时间: 丹佛/凤凰城)', ja: 'UTC-7:00 (山岳部標準時: デンバー/フェニックス)', en: 'UTC-7:00 (Mountain Time: Denver, Phoenix)' },
        { value: -6, zh: 'UTC-6:00 (美国中部时间: 芝加哥/墨西哥城)', ja: 'UTC-6:00 (中部標準時: シカゴ/メキシコシティ)', en: 'UTC-6:00 (Central Time: Chicago, Mexico City)' },
        { value: -5, zh: 'UTC-5:00 (美国东部时间: 纽约/多伦多)', ja: 'UTC-5:00 (東部標準時: ニューヨーク/トロント)', en: 'UTC-5:00 (Eastern Time: New York, Toronto)' },
        { value: -4, zh: 'UTC-4:00 (大西洋时间: 智利/加拉加斯)', ja: 'UTC-4:00 (大西洋標準時: サンティアゴ/カラカス)', en: 'UTC-4:00 (Atlantic Time: Santiago, Caracas)' },
        { value: -3.5, zh: 'UTC-3:30 (纽芬兰)', ja: 'UTC-3:30 (ニューファンドランド)', en: 'UTC-3:30 (Newfoundland)' },
        { value: -3, zh: 'UTC-3:00 (巴西利亚/布宜诺斯艾利斯)', ja: 'UTC-3:00 (ブラジリア/ブエノスアイレス)', en: 'UTC-3:00 (Brasilia, Buenos Aires)' },
        { value: -2, zh: 'UTC-2:00 (中大西洋)', ja: 'UTC-2:00 (中央大西洋)', en: 'UTC-2:00 (Mid-Atlantic)' },
        { value: -1, zh: 'UTC-1:00 (佛得角/亚速尔)', ja: 'UTC-1:00 (カーボベルデ/アゾレス)', en: 'UTC-1:00 (Cape Verde, Azores)' },
        { value: 0, zh: 'UTC±0:00 (伦敦/都柏林/里斯本/格林威治)', ja: 'UTC±0:00 (ロンドン/ダブリン/リスボン/グリニッジ)', en: 'UTC±0:00 (London, Dublin, Lisbon, GMT)' },
        { value: 1, zh: 'UTC+1:00 (中欧标准 CET: 柏林/巴黎/罗马/马德里)', ja: 'UTC+1:00 (中央ヨーロッパ標準時 CET: ベルリン/パリ/ローマ/マドリード)', en: 'UTC+1:00 (Central European Time: Berlin, Paris, Rome)' },
        { value: 2, zh: 'UTC+2:00 (东欧/欧洲夏令时 CEST: 雅典/开罗/赫尔辛基)', ja: 'UTC+2:00 (東ヨーロッパ時/夏時間 CEST: アテネ/カイロ/ヘルシンキ)', en: 'UTC+2:00 (Eastern European Time: Athens, Cairo, Helsinki)' },
        { value: 3, zh: 'UTC+3:00 (莫斯科/多哈/利雅得/伊斯坦布尔)', ja: 'UTC+3:00 (モスクワ/ドーハ/リヤド/イスタンブール)', en: 'UTC+3:00 (Moscow, Doha, Riyadh, Istanbul)' },
        { value: 3.5, zh: 'UTC+3:30 (德黑兰)', ja: 'UTC+3:30 (テヘラン)', en: 'UTC+3:30 (Tehran)' },
        { value: 4, zh: 'UTC+4:00 (迪拜/阿布扎比/巴库)', ja: 'UTC+4:00 (ドバイ/アブダビ/バクー)', en: 'UTC+4:00 (Dubai, Abu Dhabi, Baku)' },
        { value: 4.5, zh: 'UTC+4:30 (喀布尔)', ja: 'UTC+4:30 (カブール)', en: 'UTC+4:30 (Kabul)' },
        { value: 5, zh: 'UTC+5:00 (伊斯兰堡/卡拉奇/塔什干)', ja: 'UTC+5:00 (イスラマバード/カラチ/タシュケント)', en: 'UTC+5:00 (Islamabad, Karachi, Tashkent)' },
        { value: 5.5, zh: 'UTC+5:30 (印度标准 IST: 新德里/孟买)', ja: 'UTC+5:30 (インド標準時 IST: ニューデリー/ムンバイ)', en: 'UTC+5:30 (India Standard Time: New Delhi, Mumbai)' },
        { value: 5.75, zh: 'UTC+5:45 (加德满都)', ja: 'UTC+5:45 (カトマンズ)', en: 'UTC+5:45 (Kathmandu)' },
        { value: 6, zh: 'UTC+6:00 (达卡/阿拉木图)', ja: 'UTC+6:00 (ダッカ/アルマトイ)', en: 'UTC+6:00 (Dhaka, Almaty)' },
        { value: 6.5, zh: 'UTC+6:30 (仰光)', ja: 'UTC+6:30 (ヤンゴン)', en: 'UTC+6:30 (Yangon)' },
        { value: 7, zh: 'UTC+7:00 (曼谷/雅加达/河内)', ja: 'UTC+7:00 (バンコク/ジャカルタ/ハノイ)', en: 'UTC+7:00 (Bangkok, Jakarta, Hanoi)' },
        { value: 8, zh: 'UTC+8:00 (中国标准 CST: 北京/香港/新加坡/台北)', ja: 'UTC+8:00 (中国標準時 CST: 北京/香港/シンガポール/台北)', en: 'UTC+8:00 (China Standard Time: Beijing, Singapore, Hong Kong)' },
        { value: 9, zh: 'UTC+9:00 (日本/韩国 JST/KST: 东京/首尔)', ja: 'UTC+9:00 (日本標準時/韓国 JST/KST: 東京/ソウル)', en: 'UTC+9:00 (Japan/Korea: Tokyo, Seoul)' },
        { value: 9.5, zh: 'UTC+9:30 (阿德莱德/达尔文)', ja: 'UTC+9:30 (アデレード/ダーウィン)', en: 'UTC+9:30 (Adelaide, Darwin)' },
        { value: 10, zh: 'UTC+10:00 (澳大利亚东部 AEST: 悉尼/墨尔本)', ja: 'UTC+10:00 (東部オーストラリア標準時 AEST: シドニー/メルボルン)', en: 'UTC+10:00 (Australian Eastern Time: Sydney, Melbourne)' },
        { value: 10.5, zh: 'UTC+10:30 (豪勋爵岛)', ja: 'UTC+10:30 (ロード・ハウ島)', en: 'UTC+10:30 (Lord Howe Island)' },
        { value: 11, zh: 'UTC+11:00 (所罗门群岛)', ja: 'UTC+11:00 (ソロモン諸島)', en: 'UTC+11:00 (Solomon Islands)' },
        { value: 12, zh: 'UTC+12:00 (新西兰 NZST: 奥克兰/惠灵顿)', ja: 'UTC+12:00 (ニュージーランド標準時 NZST: オークランド/ウェリントン)', en: 'UTC+12:00 (New Zealand: Auckland, Wellington)' },
        { value: 13, zh: 'UTC+13:00 (萨摩亚/汤加)', ja: 'UTC+13:00 (サモア/トンガ)', en: 'UTC+13:00 (Samoa, Tonga)' },
        { value: 14, zh: 'UTC+14:00 (莱恩群岛)', ja: 'UTC+14:00 (ライン諸島)', en: 'UTC+14:00 (Line Islands)' }
    ];

    // WTT TimeZoneId to UTC offset in minutes
    const WTT_TIMEZONE_MAP = {
        '3': -720, '4': -660, '5': -600, '6': -540, '7': -480, '8': -420, '9': -480, '10': -420,
        '11': -420, '12': -420, '13': -360, '14': -360, '15': -360, '16': -360, '17': -300, '18': -300,
        '19': -300, '20': -270, '21': -240, '22': -240, '23': -240, '24': -240, '25': -240, '26': -210,
        '27': -180, '28': -180, '29': -180, '30': -180, '31': -180, '32': -180, '33': -120, '34': -120,
        '35': -60, '36': -60, '37': 0, '38': 0, '39': 0, '40': 60, '41': 0, '42': 0,
        '43': 60, '44': 60, '45': 60, '46': 60, '47': 60, '48': 60, '49': 120, '50': 120,
        '51': 120, '52': 120, '53': 120, '54': 120, '55': 120, '56': 180, '57': 120, '58': 120,
        '59': 180, '60': 180, '61': 120, '62': 180, '63': 180, '64': 180, '65': 240, '66': 210,
        '67': 240, '68': 240, '69': 240, '70': 240, '71': 240, '72': 270, '73': 300, '74': 300,
        '75': 300, '76': 330, '77': 330, '78': 345, '79': 360, '80': 360, '81': 390, '82': 420,
        '83': 420, '84': 480, '85': 480, '86': 480, '87': 480, '88': 480, '89': 480, '90': 480,
        '91': 540, '92': 540, '93': 570, '94': 570, '95': 600, '96': 600, '97': 600, '98': 600,
        '99': 540, '100': 660, '101': 660, '102': 720, '103': 720, '104': 720, '105': 720,
        '106': 720, '107': 780, '108': 780
    };

    let detectedVenueOffsetMinutes = null;

    function getSystemInfo() {
        const offsetMin = -new Date().getTimezoneOffset();
        const sign = offsetMin >= 0 ? '+' : '-';
        const abs = Math.abs(offsetMin);
        const h = Math.floor(abs / 60);
        const m = abs % 60;
        const formatted = m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${String(m).padStart(2, '0')}`;
        let tzName = '';
        try {
            tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        } catch (e) {}
        return {
            offsetMinutes: offsetMin,
            formatted: formatted,
            name: tzName
        };
    }

    function getTargetOffsetMinutes() {
        const mode = GM_getValue(STORAGE_KEY_MODE, 'auto');
        if (mode === 'manual') {
            const h = GM_getValue(STORAGE_KEY_OFFSET, 8);
            return Math.round(Number(h) * 60);
        }
        return -new Date().getTimezoneOffset();
    }

    // Clear WTT schedule localStorage cache so that fresh transformed data is always loaded
    function clearWttScheduleCache() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('event_schedule_v2_') || key.startsWith('event_schedule_upcoming_only_v2_'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) {}
    }
    clearWttScheduleCache();

    function getVenueOffsetMinutes() {
        if (detectedVenueOffsetMinutes !== null) {
            return detectedVenueOffsetMinutes;
        }
        try {
            const match = location.search.match(/eventId=(\d+)/);
            if (match) {
                const cached = sessionStorage.getItem('wtt_venue_offset_' + match[1]);
                if (cached !== null) {
                    return Number(cached);
                }
            }
        } catch (e) {}
        return 120; // Default: Europe CEST (UTC+2)
    }

    function calculateDiffMinutes() {
        return getTargetOffsetMinutes() - getVenueOffsetMinutes();
    }

    function formatOffset(minutes) {
        const sign = minutes >= 0 ? '+' : '-';
        const abs = Math.abs(minutes);
        const h = Math.floor(abs / 60);
        const m = abs % 60;
        return m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${String(m).padStart(2, '0')}`;
    }

    function convertDateAndTime(dateStr, timeStr, diffMinutes) {
        if (!dateStr || !timeStr) return { date: dateStr, time: timeStr };
        try {
            const [y, m, d] = dateStr.split('-').map(Number);
            const [hh, mm] = timeStr.split(':').map(Number);
            if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(hh) || isNaN(mm)) {
                return { date: dateStr, time: timeStr };
            }

            const utcTime = Date.UTC(y, m - 1, d, hh, mm + diffMinutes, 0);
            const resDate = new Date(utcTime);

            const resY = resDate.getUTCFullYear();
            const resM = String(resDate.getUTCMonth() + 1).padStart(2, '0');
            const resD = String(resDate.getUTCDate()).padStart(2, '0');
            const resHH = String(resDate.getUTCHours()).padStart(2, '0');
            const resMM = String(resDate.getUTCMinutes()).padStart(2, '0');

            return {
                date: `${resY}-${resM}-${resD}`,
                time: `${resHH}:${resMM}`
            };
        } catch (e) {
            return { date: dateStr, time: timeStr };
        }
    }

    function convertIsoString(isoStr, diffMinutes) {
        if (!isoStr || typeof isoStr !== 'string' || !isoStr.includes('T')) return isoStr;
        try {
            const parts = isoStr.split('T');
            const datePart = parts[0];
            const timePart = parts[1].slice(0, 5);
            const secPart = parts[1].length > 5 ? parts[1].slice(5) : ':00';

            const converted = convertDateAndTime(datePart, timePart, diffMinutes);
            return `${converted.date}T${converted.time}${secPart}`;
        } catch (e) {
            return isoStr;
        }
    }

    function transformPayload(obj, diffMinutes) {
        if (!obj || typeof obj !== 'object') return;

        if (obj.timeZoneId !== undefined && obj.timeZoneId !== null) {
            const baseMin = WTT_TIMEZONE_MAP[String(obj.timeZoneId)];
            if (baseMin !== undefined) {
                let offset = baseMin;
                if (obj.startDateTime) {
                    const month = new Date(obj.startDateTime).getUTCMonth();
                    if (Number(obj.timeZoneId) >= 40 && Number(obj.timeZoneId) <= 55 && month >= 2 && month <= 9) {
                        offset += 60;
                    }
                }
                detectedVenueOffsetMinutes = offset;
                try {
                    const match = location.search.match(/eventId=(\d+)/);
                    if (match) {
                        sessionStorage.setItem('wtt_venue_offset_' + match[1], String(offset));
                    }
                } catch (e) {}
                updateBadge();
            }
        }

        if (typeof obj.Date === 'string' && typeof obj.Time === 'string') {
            if (/^\d{4}-\d{2}-\d{2}$/.test(obj.Date) && /^\d{2}:\d{2}$/.test(obj.Time)) {
                const converted = convertDateAndTime(obj.Date, obj.Time, diffMinutes);
                obj.Date = converted.date;
                obj.Time = converted.time;
            }
        }

        if (typeof obj.StartDate === 'string' && obj.StartDate.includes('T')) {
            obj.StartDate = convertIsoString(obj.StartDate, diffMinutes);
        }
        if (typeof obj.EndDate === 'string' && obj.EndDate.includes('T')) {
            obj.EndDate = convertIsoString(obj.EndDate, diffMinutes);
        }
        if (typeof obj.StartDate_Orignal === 'string' && obj.StartDate_Orignal.includes('T')) {
            obj.StartDate_Orignal = convertIsoString(obj.StartDate_Orignal, diffMinutes);
        }

        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                transformPayload(obj[i], diffMinutes);
            }
        } else {
            for (const key of Object.keys(obj)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    transformPayload(obj[key], diffMinutes);
                }
            }
        }
    }

    // Network Interception Target Checker
    function isTargetUrl(url) {
        if (!url || typeof url !== 'string') return false;
        return url.includes('GetBrackets') ||
               url.includes('GetEventSchedule') ||
               url.includes('GetAllLiveOrActiveEventsDetails') ||
               url.includes('websitestaticapifiles') ||
               url.includes('websitecacheddata') ||
               url.includes('GetOfficialMatches') ||
               url.includes('GetEventSubEventForMatch');
    }

    // Network Interception
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._wttUrl = typeof url === 'string' ? url : (url && url.toString ? url.toString() : '');
        return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        const self = this;
        const url = this._wttUrl || '';

        if (isTargetUrl(url)) {
            this.addEventListener('readystatechange', function () {
                if (self.readyState === 4 && self.status === 200) {
                    try {
                        const rawText = self.responseText;
                        if (rawText && (rawText.startsWith('{') || rawText.startsWith('['))) {
                            const data = JSON.parse(rawText);
                            const diffMinutes = calculateDiffMinutes();
                            transformPayload(data, diffMinutes);

                            const modifiedText = JSON.stringify(data);
                            Object.defineProperty(self, 'responseText', { value: modifiedText, writable: true });
                            Object.defineProperty(self, 'response', { value: modifiedText, writable: true });
                        }
                    } catch (err) {}
                }
            });
        }

        return origSend.apply(this, arguments);
    };

    if (window.fetch) {
        const origFetch = window.fetch;
        window.fetch = async function (...args) {
            const response = await origFetch.apply(this, args);
            const url = args[0] && typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');

            if (isTargetUrl(url)) {
                try {
                    const clone = response.clone();
                    const data = await clone.json();
                    const diffMinutes = calculateDiffMinutes();
                    transformPayload(data, diffMinutes);

                    return new Response(JSON.stringify(data), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                } catch (e) {
                    return response;
                }
            }
            return response;
        };
    }

    // Settings Modal
    function openSettingsModal() {
        if (document.getElementById('wtt-modal-backdrop')) {
            document.getElementById('wtt-modal-backdrop').remove();
        }

        const sys = getSystemInfo();
        const loc = getLocale();
        let curMode = GM_getValue(STORAGE_KEY_MODE, 'auto');
        let curOffset = Number(GM_getValue(STORAGE_KEY_OFFSET, 8));

        const backdrop = document.createElement('div');
        backdrop.id = 'wtt-modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans", "Meiryo", sans-serif;
            padding: 16px;
            box-sizing: border-box;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #181c24;
            color: #f3f4f6;
            width: 380px;
            max-width: 100%;
            border-radius: 8px;
            border: 1px solid #2d3340;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
            padding: 18px 20px;
            box-sizing: border-box;
            position: relative;
        `;

        const curTzObj = TIMEZONES.find(z => z.value === curOffset) || TIMEZONES.find(z => z.value === 8);
        const currentTzLabel = (curTzObj && (curTzObj[loc] || curTzObj.en)) || '';

        modal.innerHTML = `
            <style>
                .wtt-opt-row:hover { background: #262c3b !important; }
            </style>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="font-size: 15px; font-weight: 600; color: #ffffff;">${t('modal_title')}</div>
                <button id="wtt-btn-close" style="background: none; border: none; color: #9ca3af; font-size: 18px; cursor: pointer; line-height: 1; padding: 2px;">✕</button>
            </div>

            <div style="margin-bottom: 14px;">
                <!-- Mode: Auto -->
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 12px; user-select: none;">
                    <input type="radio" name="wtt_tz_mode" id="wtt-radio-auto" value="auto" ${curMode === 'auto' ? 'checked' : ''} style="cursor: pointer;">
                    <span style="font-size: 13px; color: #f3f4f6;">${t('auto_label')}</span>
                    <span style="font-size: 12px; color: #9ca3af;">(${sys.formatted}${sys.name ? ' ' + sys.name : ''})</span>
                </label>

                <!-- Mode: Manual -->
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px; user-select: none;">
                    <input type="radio" name="wtt_tz_mode" id="wtt-radio-manual" value="manual" ${curMode === 'manual' ? 'checked' : ''} style="cursor: pointer;">
                    <span style="font-size: 13px; color: #f3f4f6;">${t('manual_label')}</span>
                </label>

                <!-- Constrained dropdown -->
                <div style="position: relative; margin-left: 20px;">
                    <div id="wtt-tz-trigger" style="
                        background: #222733;
                        color: #f3f4f6;
                        border: 1px solid #2d3340;
                        border-radius: 6px;
                        padding: 7px 10px;
                        font-size: 12.5px;
                        cursor: pointer;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        user-select: none;
                    ">
                        <span id="wtt-tz-trigger-text" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px;">${currentTzLabel}</span>
                        <span style="color: #9ca3af; font-size: 10px; flex-shrink: 0;">▼</span>
                    </div>

                    <div id="wtt-tz-menu" style="
                        display: none;
                        position: absolute;
                        top: calc(100% + 4px);
                        left: 0;
                        width: 100%;
                        max-height: 180px;
                        overflow-y: auto;
                        background: #1f242d;
                        border: 1px solid #374151;
                        border-radius: 6px;
                        box-shadow: 0 8px 20px rgba(0,0,0,0.45);
                        z-index: 10;
                        box-sizing: border-box;
                    ">
                        ${TIMEZONES.map(z => `
                            <div class="wtt-opt-row" data-val="${z.value}" style="
                                padding: 7px 10px;
                                font-size: 12px;
                                color: ${curOffset === z.value ? '#93c5fd' : '#e5e7eb'};
                                background: ${curOffset === z.value ? '#1e3a5f' : 'transparent'};
                                cursor: pointer;
                                user-select: none;
                            ">${z[loc] || z.en}</div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Footer actions -->
            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px;">
                <button id="wtt-btn-cancel" style="
                    background: #282e3a;
                    color: #cbd5e1;
                    border: 1px solid #374151;
                    border-radius: 6px;
                    padding: 6px 14px;
                    font-size: 12.5px;
                    cursor: pointer;
                ">${t('btn_cancel')}</button>
                <button id="wtt-btn-save" style="
                    background: #2563eb;
                    color: #ffffff;
                    border: none;
                    border-radius: 6px;
                    padding: 6px 16px;
                    font-size: 12.5px;
                    font-weight: 500;
                    cursor: pointer;
                ">${t('btn_save')}</button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const radioAuto = modal.querySelector('#wtt-radio-auto');
        const radioManual = modal.querySelector('#wtt-radio-manual');
        const trigger = modal.querySelector('#wtt-tz-trigger');
        const triggerText = modal.querySelector('#wtt-tz-trigger-text');
        const menu = modal.querySelector('#wtt-tz-menu');
        const optRows = modal.querySelectorAll('.wtt-opt-row');

        function updateRadioState() {
            if (radioAuto.checked) {
                trigger.style.opacity = '0.5';
                trigger.style.pointerEvents = 'none';
                menu.style.display = 'none';
            } else {
                trigger.style.opacity = '1';
                trigger.style.pointerEvents = 'auto';
            }
        }
        updateRadioState();

        radioAuto.addEventListener('change', updateRadioState);
        radioManual.addEventListener('change', updateRadioState);

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        });

        optRows.forEach(row => {
            row.addEventListener('click', (e) => {
                e.stopPropagation();
                curOffset = Number(row.getAttribute('data-val'));
                triggerText.textContent = row.textContent;
                menu.style.display = 'none';

                optRows.forEach(r => {
                    const active = Number(r.getAttribute('data-val')) === curOffset;
                    r.style.background = active ? '#1e3a5f' : 'transparent';
                    r.style.color = active ? '#93c5fd' : '#e5e7eb';
                });

                radioManual.checked = true;
                updateRadioState();
            });
        });

        const close = () => backdrop.remove();

        modal.addEventListener('click', (e) => {
            if (!trigger.contains(e.target) && !menu.contains(e.target)) {
                menu.style.display = 'none';
            }
        });

        modal.querySelector('#wtt-btn-close').addEventListener('click', close);
        modal.querySelector('#wtt-btn-cancel').addEventListener('click', close);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) close();
        });

        modal.querySelector('#wtt-btn-save').addEventListener('click', () => {
            const isAuto = radioAuto.checked;
            GM_setValue(STORAGE_KEY_MODE, isAuto ? 'auto' : 'manual');
            if (!isAuto) {
                GM_setValue(STORAGE_KEY_OFFSET, curOffset);
            }
            close();
            clearWttScheduleCache();
            updateBadge();
            location.reload();
        });
    }

    // Trigger Badge
    function createUIBadge() {
        if (document.getElementById('wtt-tz-badge')) return;

        const badge = document.createElement('div');
        badge.id = 'wtt-tz-badge';
        badge.style.cssText = `
            position: fixed;
            bottom: 12px;
            right: 12px;
            background: rgba(17, 24, 39, 0.85);
            backdrop-filter: blur(4px);
            color: #d1d5db;
            border: 1px solid #374151;
            border-radius: 12px;
            padding: 3px 8px;
            font-size: 11px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans", "Meiryo", sans-serif;
            font-weight: 500;
            cursor: pointer;
            z-index: 999999;
            display: flex;
            align-items: center;
            gap: 4px;
            user-select: none;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
            transition: all 0.15s ease;
        `;
        badge.title = t('badge_title');

        badge.addEventListener('mouseenter', () => {
            badge.style.color = '#60a5fa';
            badge.style.borderColor = '#60a5fa';
        });
        badge.addEventListener('mouseleave', () => {
            badge.style.color = '#d1d5db';
            badge.style.borderColor = '#374151';
        });
        badge.addEventListener('click', openSettingsModal);

        document.documentElement.appendChild(badge);
        updateBadge();
    }

    function updateBadge() {
        const badge = document.getElementById('wtt-tz-badge');
        if (!badge) return;

        const targetOffset = getTargetOffsetMinutes();
        const isAuto = GM_getValue(STORAGE_KEY_MODE, 'auto') === 'auto';
        badge.innerHTML = `<span>🕒</span><span>${formatOffset(targetOffset)}</span>${isAuto ? `<span style="color:#9ca3af;font-size:10px;">${t('badge_local')}</span>` : ''}`;
    }

    GM_registerMenuCommand(t('menu_settings'), openSettingsModal);
    GM_registerMenuCommand(t('menu_reset'), () => {
        GM_setValue(STORAGE_KEY_MODE, 'auto');
        clearWttScheduleCache();
        location.reload();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUIBadge);
    } else {
        createUIBadge();
    }
})();

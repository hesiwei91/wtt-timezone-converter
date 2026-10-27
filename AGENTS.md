# AI Development Guidelines (`AGENTS.md`)

This document serves as the technical context and operational guide for development on the **WTT Timezone Converter** codebase.

---

## 1. Project Overview & Constraints

- **Goal**: Intercept and convert match times and dates on [worldtabletennis.com](https://worldtabletennis.com/) from venue local time to user-specified or device-local timezone.
- **Implementation**: Single-file userscript (`src/wtt-timezone-converter.user.js`).
- **Language Support (i18n)**: Exclusively supports Chinese (`zh`), Japanese (`ja`), and English (`en`), detected via `navigator.language` (defaulting to `en`).
- **Privacy & Cleanliness**:
  - Never commit personal information, local filesystem paths, machine usernames, or AI self-identity.
  - Do not add conversational, promotional, or subjective comments (e.g. calling UI "minimalist"). Keep comments strictly technical.

---

## 2. Target Platform Architecture (WTT)

The target website is an **Angular SPA**:

1. **Client-Side Rendering**:
   - Navigation between tabs (`Draws`, `Matches`, `Results`) does not trigger page reloads.
   - Match data is fetched via Angular's `HttpClient` (`XMLHttpRequest`).
2. **API Endpoints**:
   - **Bracket Matches (`Draws` Tab)**:
     - URL Pattern: `cms/GetBrackets/{eventId}/{subEventCode}`
     - Fields: `Date` (`YYYY-MM-DD`), `Time` (`HH:mm`)
   - **Schedule Matches (`Matches` Tab)**:
     - URL Pattern: `websitecacheddata/{eventId}/schedule/schedule.json` or `cms/GetEventSchedule/{eventId}`
     - Fields: `StartDate`, `EndDate`, `StartDate_Orignal` (ISO 8601 strings)
   - **Event Metadata**:
     - URL Pattern: `websitestaticapifiles/{eventId}/{eventId}_active_live_event_details.json` or `cms/GetAllLiveOrActiveEventsDetails`
     - Fields: `timeZoneId`, `venueId`, `countryCode`, `city`, `startDateTime`

---

## 3. Core Architectural Rules

### Rule 1: Network Layer Interception Over DOM Mutation
- Intercept at `XMLHttpRequest.prototype.send` and `window.fetch` at `document-start`.
- Modify response JSON before Angular renders to prevent flicker and race conditions.

### Rule 2: UTC Timestamp Date Rollover Calculation
- Always calculate date and time shifts using UTC milliseconds:
  ```javascript
  const utc = Date.UTC(year, month - 1, day, hours, minutes + diffMinutes, 0);
  const result = new Date(utc);
  ```
- Handles date changes across midnight (both forward and backward).

### Rule 3: UI Design Constraints
- Bottom-right indicator (`#wtt-tz-badge`) must remain compact and unobtrusive.
- Dropdown menus in the settings modal must use height-constrained containers with scrolling (`overflow-y: auto`) rather than native `<select>` to avoid viewport overflow.

---

## 4. Verification Requirements

Before committing changes:
- Verify `Date` and `Time` conversion in Draws and Schedule tabs.
- Verify date rollover across midnight (both forward and backward).
- Verify UI rendering across supported languages (`zh`, `ja`, `en`).
- Verify timezone indicator does not obstruct page content.
- Verify settings persistence across page reloads via `GM_setValue`.
- Verify no personal machine paths, names, or conversational comments exist in the diff.

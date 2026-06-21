# Weapon V1 — Refactor Checklist

> SPA tĩnh: **1 entry point thật = `index.html`** (~2580 dòng HTML + inline CSS + inline JS).  
> Các file `app.js`, `styles.css`, `_new.css`, `_body.html`, `index.backup-*.html` **không được load** bởi `index.html` hiện tại — coi là legacy / backup khi refactor.

---

## 0. Kiến trúc tổng thể

- [ ] **Routing:** bottom nav 5 tab (`data-t`: workout | goals | home | report | avatar) — không có URL router
- [ ] **Sub-routing Workout:** segment Workout | History + swipe ngang (`wkPage`)
- [ ] **State:** object `db` in-memory, persist qua `localStorage` key `gymtracker_v3`
- [ ] **Cloud (optional):** Supabase `@supabase/supabase-js@2` → `env.js` → `database/sync.js` → user picker inline cuối `index.html`
- [ ] **Deploy:** GitHub Actions `.github/workflows/deploy.yml` → GitHub Pages, generate `env.js` từ secrets
- [ ] **PWA:** đăng ký `sw.js` — **file không tồn tại trong repo**
- [ ] **Fonts:** Inter (Google Fonts, trong `<head>`)
- [ ] **Toàn bộ CSS:** inline trong `<style>` của `index.html` (~610 dòng)
- [ ] **Toàn bộ app logic:** inline `<script>` trong `index.html` (~1600 dòng)

---

## 1. Global / Shared (mọi trang)

### 1.1 Shell components

- [ ] `<header>` — menu hamburger (`#menuBtn`), logo (`#brand`, tap → `cycleLogo()`)
- [ ] `.bottomnav` — 5 nút nav + badge `LV UP` trên tab Profile
- [ ] `#speedDial` — FAB draggable (Record / Challenges / Friends)
- [ ] `#restBar` — rest timer cố định bottom
- [ ] `#recBar` — mini bar khi record minimize
- [ ] `#recFull` — fullscreen record overlay
- [ ] `#ptr` — pull-to-refresh indicator (chỉ tab Profile)
- [ ] `#toast` — toast notification
- [ ] `#mainMenuBg` / `#mainMenuPanel` — drawer menu trái

### 1.2 Modals / overlays (global)

- [ ] `#modalBg` — Add exercise
- [ ] `#recSummary` — Session complete (+ Share)
- [ ] `#ranksModal` — Rank ladder
- [ ] `#recExModal` — Log exercise trong lúc record
- [ ] `#setModal` — Settings / Profile form
- [ ] `#plannerModal` — Workout planner placeholder

### 1.3 Global animations & transitions

- [ ] Tab switch: `fade`, `slideInL`, `slideInR` (`.tab.active`, `.nav-fwd`, `.nav-back`)
- [ ] Dropdown: `ddin` (group menu, day menu)
- [ ] Log set: `exwipe`, `exstamp`, `lbswipe`, `chkin`, `prflash`
- [ ] Level ring: `lvnumpulse`
- [ ] Recording dot: `blink`
- [ ] Pull refresh: `ptrspin`
- [ ] Workout pager: `fade` / `slideInL` / `slideInR` (`.wk-page`)
- [ ] CSS transitions: stepper press, logbtn, xpbar, recbar, restbar, modals, menu drawer, speed-dial, sport chips, cards dense/comfortable
- [ ] `@media (prefers-reduced-motion: reduce)` — gần như tắt animation
- [ ] Haptic: `navigator.vibrate` (log, undo, drag, PR, rest done, cover adjust)

### 1.4 Global logic

- [ ] Storage: `load()`, `save()`, `lsGet`/`lsSet`, fallback `memStore`
- [ ] Migration local: `gymtracker_v2`, `gymtracker_v1` → v3
- [ ] Sport model: `ensureSports()`, `S()`, `curSport()`, 9 sports (`SPORT_IDS`)
- [ ] Theme: `applyTheme()`, `toggleTheme()` — dark / light
- [ ] Layout: `applyLayout()`, `toggleLayout()` — comfortable / dense
- [ ] Accent: `applyColors()`, `ACCENT_SET` (Gold default)
- [ ] Units: `curUnit()` kg/lb, `dispW()`, `toKgDisp()`, `wStep()`
- [ ] Sets per log: `curSets()`, `cycleSetMode()` (1→5→1)
- [ ] Rest timer: `startRest`, `tickRest`, `adjustRest`, `skipRest`, `stopRest`
- [ ] XP / level (global all sports): `logXP`, `totalXP`, `levelInfo`, `rankFor`, `checkLevelUp`
- [ ] e1RM: `e1RM`, `bestE1RM` (Epley)
- [ ] Charts engine: `setupCanvas`, `drawWeek`, `drawSplit`, `lineChart`, `drawRadar`, `drawGauge`, `animNum`, `animRadar`
- [ ] Nav: `switchTab`, `renderActive`, `activeTab`
- [ ] Menu: `openMainMenu`, `closeMainMenu`
- [ ] Speed dial: `toggleSpeedDial`, `sdAction`, `initFabDrag`, `applyFabPos`
- [ ] Pull refresh: `initPullRefresh` (tab avatar only)
- [ ] Share: `shareSession` (Web Share API / clipboard)
- [ ] User cloud: `WeaponSync.*`, `WeaponRefreshUsers`, event `wpn-user-changed`

### 1.5 Global data shape (`db`)

- [ ] `sport` — sport đang active
- [ ] `sports[id]` — per sport: `{ logs[], custom[], removed[], order{}, seenLevel? }`
- [ ] `bw` — bodyweight kg
- [ ] `profile` — name, job, height, bio, spotify, photo, cover, coverPos
- [ ] `goals[sportId]` — `{ target }` weekly goal
- [ ] `theme`, `layout`, `unit`, `setsPerEntry`, `restDefault`, `bar`, `logo`
- [ ] `display` — bright, surfaceA (legacy từ app.js cũ — **không thấy UI slider trong settings hiện tại**)
- [ ] `dev` — `{ on, lvl, color }` dev preview
- [ ] `fab` — `{ side, y }` FAB position

### 1.6 Log entry schema (mỗi item trong `S().logs`)

- [ ] Common: `id`, `date`, `ex`, `sets`, `type` (warm|work|drop), `rpe`, `note`
- [ ] Weight: `kg`, `reps`
- [ ] Other metrics: `m`, `v1`, `v2`, `u1`, `u2` (dist|time|rounds|hold|reps)

---

## 2. Tab WORKOUT (`#tab-workout`)

### 2.1 Components

- [ ] `#sportBar` — horizontal sport chips (9 sports)
- [ ] `#wkSeg` — toggle Workout | History
- [ ] `#wkPager` / `#wkPageWorkout` / `#wkPageHistory`
- [ ] `#groupDd`, `#ddLabel`, `#groupMenu` — category dropdown
- [ ] `#wkSearchBtn`, `#wkSearchBar`, `#wkSearchInput` — search exercises
- [ ] `#groupView` — danh sách exercise cards (render động)
- [ ] `#wkHistoryView` — calendar + history list (render động)
- [ ] Per exercise card (`.ex`): head, trend, undo, quick-fill chip, steppers, logbtn, plate bar, detail panel

### 2.2 Animations (tab này)

- [ ] Swipe Workout ↔ History (`initWkSwipe`, `slideTo`)
- [ ] Search bar expand (`max-height` transition)
- [ ] Drag reorder ghost (`.drag-ghost`, `.dragging`, `.drag-over`)
- [ ] Log animation suite (wipe, swipe, PR flash, checkmark)
- [ ] Card selection highlight (`.selected`)
- [ ] Primary exercise highlight (`.primary`)

### 2.3 Tính năng

- [ ] Chọn sport → đổi catalogue + goals metric
- [ ] Chọn muscle/category group
- [ ] Log set (weight + multi-metric sports)
- [ ] Set type: Warm-up / Working / Drop set
- [ ] RPE 7–10 (0.5 steps)
- [ ] Note per pending set
- [ ] Plate calculator visual (`plates`, `plateHTML`) — gym only
- [ ] Quick fill “Repeat last”
- [ ] Undo last set (today first)
- [ ] Expand detail: sparkline + mini history + remove exercise
- [ ] Add custom exercise modal
- [ ] Remove exercise from list (giữ history)
- [ ] Search cross-category
- [ ] Drag reorder exercises trong group (`S().order`)
- [ ] Auto rest timer sau log (trừ dist/time metrics)
- [ ] PR detection + toast + vibration pattern
- [ ] Toast action “Undo” sau log
- [ ] “Today · X of Y logged” counter
- [ ] History sub-tab: month calendar + day detail + chronological list + delete log

### 2.4 Logic functions

- [ ] `renderWorkoutTab`, `renderSportBar`, `setSport`
- [ ] `setWkPage`, `slideTo`, `initWkSwipe`
- [ ] `buildDropdown`, `setGroup`, `toggleGroupMenu`
- [ ] `renderGroup`, `exCardHTML`, `controlsHTML`, `trendHTML`
- [ ] `toggleSearch`, `onSearchInput`
- [ ] `initDragReorder`, `setGroupOrder`
- [ ] `bump`, `setVal`, `quickFill`, `logTap`, `logEx`, `playLogAnim`
- [ ] `pendingFor`, `setSetType`, `setRPE`, `setNote`, `setEditorHTML`
- [ ] `toggleDetail`, `removeEx`, `undoLast`, `unlogEx`
- [ ] `openModal`, `closeModal`, `saveCustom`
- [ ] `renderWkHistory`, `renderCalendar`, `calNav`, `selectCalDay`, `renderCalDetail`, `renderHistoryList`, `delLog`
- [ ] `openCalendar`, `closeCalendar` (redirect → history tab)

### 2.5 DB / storage

- [ ] Read/write: `db.sports[curSport].logs|custom|removed|order`
- [ ] Cloud: mỗi `save()` → debounced `WeaponSync.saveUserData()` (whole `db` blob)
- [ ] **Không** map sang normalized tables `workouts` / `workout_logs` trong Supabase hiện tại

### 2.6 Sports catalogue (refactor data)

- [ ] `gym` — PRESETS ~60+ exercises, 6 categories, metric weight
- [ ] `run` — dist+time categories
- [ ] `calisthenics` — reps/hold
- [ ] `hyrox` — mixed
- [ ] `swimming` — dist m + min
- [ ] `boxing` — time/rounds/reps
- [ ] `bodyweight` — reps/hold
- [ ] `trail` — dist km + elev
- [ ] `trekking` — dist km + elev

---

## 3. Tab GOALS (`#tab-goals`)

### 3.1 Components

- [ ] `#goalView` (render động)
- [ ] Weekly day strip (`.goal-week`, `.goal-day`)
- [ ] `#goalGauge` canvas — semicircle gauge
- [ ] `#goalTargetInput` — editable weekly target
- [ ] `.goal-grid` — 4 stat tiles

### 3.2 Animations

- [ ] Gauge segments fill (canvas, no keyframe)
- [ ] Card tap → navigate calendar (no transition)

### 3.3 Tính năng

- [ ] Per-sport weekly goal (kind: cal | dist | dist_m | elev | time | sessions)
- [ ] Default target từ `sportDef().goal.def`
- [ ] Custom target lưu `db.goals[sportId].target`
- [ ] Tap week card / day → `openCalendar(date)`
- [ ] Stats: value this week, days trained, bodyweight, % of target

### 3.4 Logic

- [ ] `renderGoals`, `weeklyGoalValue`, `goalTargetVal`, `setGoalTarget`
- [ ] `drawGauge`, `goalStat`

### 3.5 DB

- [ ] `db.goals[sportId].target`
- [ ] Derived từ `S().logs` tuần hiện tại (`weekDates`)

---

## 4. Tab HOME (`#tab-home`)

### 4.1 Components

- [ ] `#homeView` (render động)
- [ ] `.home-hero` — date, greeting, rank, XP bar
- [ ] `.home-stats` — 3 cards (streak, sessions, volume)
- [ ] `.home-today` — logged today + CTA

### 4.2 Animations

- [ ] `.hh-xpbar i` width transition
- [ ] `.ht-cta` press scale

### 4.3 Tính năng

- [ ] Time-based greeting
- [ ] Global level + rank display
- [ ] Streak / sessions / volume (sport hiện tại qua `S()`)
- [ ] “Start training” → `switchTab('workout')`

### 4.4 Logic

- [ ] `renderHome`, `avStats`, `avName`, `fmtVol`, `fmtK`

### 4.5 DB

- [ ] Read-only aggregate từ `S().logs`, `db.profile`, `levelInfo()`

---

## 5. Tab REPORT (`#tab-report`)

### 5.1 Components

- [ ] `#repReport`
- [ ] `#weekLabel`, `#chWeek` — workout days this week
- [ ] `#chSplit`, `#splitLegend` — muscle/category focus 30 days
- [ ] `#dayBtn`, `#dayMenu`, `#dayLabel`, `#dayDetail` — day picker
- [ ] `#progEx`, `#chProg`, `#progStats` — weight/metric progress

### 5.2 Animations

- [ ] `animNum` on prog stats (First / Now / Best / Growth %)
- [ ] Day menu `ddin`

### 5.3 Tính năng

- [ ] 7-day trained dots (Mon–Sun)
- [ ] 30-day split bar chart by category
- [ ] Pick any logged day → summary list
- [ ] Per-exercise line chart + animated stats
- [ ] Metric-aware: `logPrimary(l)` cho non-weight sports

### 5.4 Logic

- [ ] `renderReport`, `fillProgSelect`, `renderDayProgress`
- [ ] `weekDates`, `loggedDates`, `toggleDayMenu`, `selectDay`
- [ ] `drawWeek`, `drawSplit`, `lineChart`

### 5.5 DB

- [ ] Read `S().logs` only (sport active)

---

## 6. Tab PROFILE / AVATAR (`#tab-avatar`)

### 6.1 Components

- [ ] `#idCard` — WEAPON ID card (cover, avatar, stats, Spotify iframe)
- [ ] `.av-hero` — ring SVG `#ringArc`, `#avLevelNum`, rank, `#xpFill`, `#xpText`
- [ ] `#rankCard`, `#avRank`, `#avRankNext`, ranks button
- [ ] `.p2-stats` — `#stStreak`, `#stSessions`, `#stVolume`
- [ ] `#chRadar` — strength/category radar
- [ ] `#achGrid`, `#achSum` — achievements grid
- [ ] `#devSwitch`, `#devPanel`, `#devLvl` — dev mode preview

### 6.2 Animations

- [ ] Ring arc stroke-dashoffset transition
- [ ] `#xpFill` width transition
- [ ] `animNum` on level + stats
- [ ] `lvpulse` on level number
- [ ] `animRadar` animated radar fill
- [ ] Pull-to-refresh spin on this tab
- [ ] Cover photo drag reposition (pointer, long-press 420ms)
- [ ] Nav `.leveled` + `.lvup-badge` when level up unseen

### 6.3 Tính năng

- [ ] ID card setup CTA → settings
- [ ] Profile photo upload (base64 jpeg)
- [ ] Cover photo upload + drag to reposition
- [ ] Spotify embed từ track URL
- [ ] 21 ranks (`STR_RANKS`), rank ladder modal
- [ ] XP bar + next rank XP remaining
- [ ] Radar: sets/logs per category (sport active)
- [ ] 8 achievements: First set, 10 sessions, 100k vol, 100kg, All-rounder, 7-day streak, Lv10, Triple plate
- [ ] Dev mode: preview any level 1–21
- [ ] Mark `S().seenLevel` on visit (clear LV UP badge)

### 6.4 Logic

- [ ] `renderAvatar`, `renderIDCard`, `renderProfileStats`, `renderAchievements`, `renderDevPanel`
- [ ] `openRanks`, `closeRanks`, `showRankInfo` (removed in current — ladder list only)
- [ ] `spotifyEmbed`, `readImg`, `setPhoto`, `setCover`, `pickPhoto`, `attachCoverAdjust`
- [ ] `openSettings`, `closeSettings`, `saveSettings`
- [ ] `toggleDev`, `devSetLvl`, `devReset`
- [ ] `achList`, `pickAccent`, `renderAppearance` (**#acSet không có trong HTML — dead code?**)

### 6.5 DB

- [ ] `db.profile.*`, `db.bw`, `S().seenLevel`
- [ ] Cloud profile push: `WeaponSync.pushProfile()` on save settings/photos

---

## 7. Record session (cross-tab overlay)

### 7.1 Components

- [ ] Speed dial → Record
- [ ] `#recFull` — timer, kcal, XP, minimize, stop
- [ ] `#recBar` — compact metrics
- [ ] `#recSummary` — post-session modal
- [ ] `#recExModal` / `#recExBody` — log while recording

### 7.2 Animations

- [ ] `.rec-btn.recording` / `.sd-fab.recording` dot → square
- [ ] `#recFull.open` scale + opacity
- [ ] `#recBar.show` slide up
- [ ] `blink` on recording dots

### 7.3 Tính năng

- [ ] Live timer, kcal/min, session XP rollup
- [ ] Log exercises mid-session (mirrors workout controls)
- [ ] Stop → summary modal
- [ ] Share session text (Web Share / clipboard)
- [ ] Minimize ↔ fullscreen

### 7.4 Logic

- [ ] `toggleRecord`, `startRecord`, `stopRecord`, `maximizeRecord`, `minimizeRecord`
- [ ] `updateRecBar`, `showRecSummary`, `closeRecSummary`
- [ ] `openRecEx`, `closeRecEx`, `renderRecLogger`, `recLog`, `recBump`, `recSet`
- [ ] `calForLog`, `calForVals` — multi-metric calorie estimate

### 7.5 DB

- [ ] Logs vẫn ghi vào `S().logs` real-time
- [ ] `rec.items` chỉ in-memory cho session summary

---

## 8. Menu drawer (`#mainMenuBg`)

### 8.1 Components

- [ ] `#mmGreet`
- [ ] Toggle rows: Appearance, Layout, Units, Set logging
- [ ] Links: Planner, Settings, History & calendar
- [ ] `#wpn-user-list`, `#wpn-add` — switch/add cloud user

### 8.2 Animations

- [ ] Panel slide `translateX(-104%)` → open
- [ ] `.mm-toggle` pill animation

### 8.3 Tính năng

- [ ] Theme / layout / unit / sets-per-log cycle
- [ ] Open planner placeholder
- [ ] Open settings modal
- [ ] Open calendar → workout history tab
- [ ] Multi-user cloud picker (no password)

### 8.4 Logic

- [ ] `toggleTheme`, `toggleLayout`, `toggleUnit`, `cycleSetMode`
- [ ] `syncThemeUI`, `syncLayoutUI`, `syncUnitUI`, `syncSetUI`
- [ ] User picker IIFE + `WeaponRefreshUsers`

### 8.5 DB

- [ ] Local `db.*` prefs
- [ ] Supabase `app_users` list/select/add

---

## 9. Database & cloud layer

### 9.1 Local

- [ ] `localStorage['gymtracker_v3']` — full app state JSON
- [ ] `localStorage['weapon_user_id']` — current cloud user
- [ ] `localStorage['weapon_legacy_imported']` — one-time legacy import flag

### 9.2 Supabase — **`database/sync.js` (đang dùng)**

- [ ] Client: `WeaponSync.listUsers`, `addUser`, `selectUser`, `loadUserData`, `saveUserData`, `pushProfile`
- [ ] Table expected: `app_users` với cột **`data` JSONB** (whole `db` blob)
- [ ] Wrap `window.save()` → debounce 600ms cloud save
- [ ] `applyBlob()` / `freshDb()` / legacy import từ `gymtracker_v3`
- [ ] Event: `wpn-user-changed`

### 9.3 Supabase — **`database/setup.sql` (schema file trong repo)**

- [ ] Tables: `app_users`, `exercises`, `workouts`, `workout_logs`, `follows`, `workout_likes`, `workout_comments`, `personal_records`
- [ ] Views: `v_feed`, `v_leaderboard`, `v_profile_stats`
- [ ] Trigger: `maintain_pr` on `workout_logs`
- [ ] RLS: open `anon` (no auth)
- [ ] Seed: 30 preset exercises
- [ ] **⚠️ THIẾU cột `app_users.data`** — không khớp `sync.js`

### 9.4 `DATABASE-PLAN.md` (kế hoạch, chưa implement UI)

- [ ] P1–P6 roadmap (auth, migration, sync, social, leaderboard)
- [ ] Files `00_schema.sql`…`04_views.sql` **không có trong repo** (chỉ có `setup.sql`)
- [ ] Social UI: feed, kudos, comments, follow — **chưa có front-end**

### 9.5 External embeds

- [ ] Spotify iframe (`open.spotify.com/embed/track/...`)
- [ ] Supabase CDN
- [ ] Google Fonts

---

## 10. Placeholder / Coming soon (đừng quên khi refactor)

- [ ] Workout planner modal (`openPlanner`) — UI placeholder
- [ ] Speed dial → Challenges — toast only
- [ ] Speed dial → Friends — toast only
- [ ] `DATABASE-PLAN` social features — schema có, UI không
- [ ] Service worker `sw.js` — registered but missing file
- [ ] `renderAppearance` / `#acSet` — accent picker referenced in JS, no DOM
- [ ] `app.js` endurance/strength toggle — **replaced by multi-sport** in index.html
- [ ] `styles.css` — standalone stylesheet, unused by current index

---

## 11. File inventory (refactor scope)

| File | Vai trò | Ghi chú |
|------|---------|---------|
| `index.html` | **Production app** | HTML+CSS+JS monolith |
| `database/sync.js` | Cloud sync | Whole-state blob |
| `database/setup.sql` | DB schema | Mismatch với sync.js |
| `database/user-picker.html` | Snippet mẫu | Đã embed vào index + menu |
| `env.js` / `env.js.example` | Supabase keys | Generated on deploy |
| `app.js` | Legacy | Strength/endurance only |
| `styles.css`, `_new.css` | Legacy CSS | Not linked |
| `_body.html` | Fragment? | Not linked |
| `index.backup-*.html` | Backups | |
| `.github/workflows/deploy.yml` | CI/CD | |

---

## 12. Checklist hành vi cần regression test sau refactor

- [ ] Log set → rest timer → undo toast
- [ ] PR detection + flash animation
- [ ] Switch sport → catalogue + goals + reports đúng metric
- [ ] Drag reorder persist sau reload
- [ ] Search + add custom + remove exercise
- [ ] Calendar history + delete log
- [ ] Record session full flow + share
- [ ] Profile photo/cover + Spotify
- [ ] Level up badge + achievements unlock
- [ ] Theme / layout / unit / sets mode persist
- [ ] Cloud: add user → switch user → data isolated
- [ ] Cloud: save debounce → reload → data intact
- [ ] Offline / no Supabase → local-only fallback message
- [ ] `prefers-reduced-motion`
- [ ] Mobile safe-area (bottom nav, FAB, bars)

---

## 13. THÔNG TIN CẦN BẠN CUNG CẤP NGAY

Các mục dưới đây **không suy luận được từ code** — cần bạn xác nhận trước khi refactor sâu:

1. **Source of truth:** Refactor từ `index.html` monolith hay tách ra framework (React/Vue/Svelte)? Target stack là gì?
2. **Supabase production:** Project đã deploy chưa? Schema thực tế có cột `app_users.data` không? (repo hiện **mâu thuẫn** giữa `sync.js` và `setup.sql`)
3. **Multi-user model:** Giữ user-picker không login, hay chuyển sang auth theo `DATABASE-PLAN.md`?
4. **Normalized DB:** Có migrate từ JSON blob sang `workouts`/`workout_logs` không, hay giữ blob?
5. **Legacy files:** Xóa `app.js`, `styles.css`, backups sau refactor, hay giữ?
6. **PWA:** Có cần `sw.js` / offline không?
7. **Sports scope:** 9 sports đều production-ready, hay chỉ `gym` cần polish?
8. **Social / Challenges / Friends / Planner:** Có trong scope refactor v1 không?
9. **Deploy URL:** GitHub Pages URL hiện tại? Secrets `SUPABASE_URL` / `SUPABASE_ANON` đã set chưa?
10. **Design:** Có Figma/spec mới, hay giữ UI hiện tại 1:1?

---

*Generated from codebase scan — Weapon @ Project/Weapon*

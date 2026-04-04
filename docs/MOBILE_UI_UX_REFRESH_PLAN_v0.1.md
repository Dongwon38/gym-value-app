# Gym Value App — Mobile UI/UX Refresh Plan v0.1

## 문서 정보
- 문서명: Mobile UI/UX Refresh Plan
- 버전: v0.1
- 상태: Draft
- 작성 기준일: 2026-04-04
- 참고 기준:
  - 사용자 공유 스크린샷 세트 (2026-04-04)
  - `IMPLEMENTATION_CHECKLIST_v0.1.md`
  - `POST_MVP_LOCAL_EXPANSION_PLAN_v0.1.md`
  - `PRODUCT_SPEC_v0.1.md`
- 목적: 현재 mobile 앱의 화면 밀도, 입력 흐름, 시각 계층, 정보 구조를 재정리하고, 구현 전에 필요한 결정과 권장 방향을 한 문서에 묶는다.

## 현재 상태 메모
- 2026-04-04 기준으로 아래 결정은 확정되었다.
  - Costs는 list-first + add/edit bottom sheet 구조로 전환
  - Visits 편집은 bottom sheet quick edit 방향 채택
  - Settings debug/diagnostic copy는 기본 화면에서 숨기고 collapse 처리
  - 전체 visual tone은 더 밝은 neutral white + soft green 방향으로 이동
- 구현 진행 상태:
  - `UIR-01` 착수
  - `UIR-02` 1차 구현 완료
  - `UIR-03` 1차 구현 완료
  - `UIR-04` 1차 구현 진행 중
  - `UIR-05` 1차 구현 완료

---

## 1. 왜 이 문서가 필요한가

현재 구현은 기능 연결은 많이 끝났지만, mobile UX 관점에서는 아래 문제가 남아 있다.

- screen별 정보 구조가 아직 "기능이 연결된 상태"에 가깝고, "사용자가 빠르게 읽고 행동하는 화면"까지는 정리되지 않았다.
- Costs는 현재 inline setup/editor 성격이 강해서 phone viewport에서 압박감이 크다.
- Visits는 list는 있으나, period filter, heatmap, edit flow, add entry의 시각적 구조가 약하다.
- Home은 KPI는 있으나 hero metric, quick action, active visit, supporting stats 간 위계가 더 명확해질 필요가 있다.
- Settings는 setup/config 화면으로는 맞지만 row layout, segmented actions, permission/defaults grouping이 더 native-like하게 정리될 필요가 있다.
- 입력 컴포넌트는 compact하게 가고 있으나, floating label, dropdown, bottom sheet, inline metadata의 규칙이 아직 통일되지 않았다.

즉, 다음 단계는 새 기능 추가보다 먼저 **기존 기능을 "작동하는 화면"에서 "좋은 모바일 제품"으로 끌어올리는 UI/UX 재설계**다.

---

## 2. 목표

이번 refresh의 목표는 아래 네 가지다.

1. 한 화면에서 사용자가 해야 할 행동이 즉시 보이게 한다.
2. 입력/편집은 더 짧고 더 예측 가능하게 만든다.
3. screen별 위계와 밀도를 통일해 전체 앱이 하나의 제품처럼 느껴지게 한다.
4. 현재 local-first 구조와 도메인 규칙은 유지하되, surface만 더 명확하게 바꾼다.

이번 문서는 UI polish가 아니라 아래 범위를 함께 다룬다.

- visual system 정리
- screen IA 재정리
- edit surface 표준화
- compact input/dropdown/sheet 패턴 정리
- implementation ordering

---

## 3. 권장 디자인 방향

### 3.1 전체 톤
- neutral warm background + white card + green accent 조합으로 정리한다.
- 현재 warm tone은 유지하되 대비를 더 분명하게 만든다.
- 전체 인상은 "clean, light, fitness utility" 쪽으로 가져간다.

### 3.2 레이아웃 원칙
- screen 상단은 항상 `title + 1차 행동` 구조로 정리한다.
- 주요 숫자는 큰 hero card 1개로 요약한다.
- supporting stats는 동일한 작은 card/grid 패턴으로 통일한다.
- 설정/편집 화면은 full page form보다 `row list + sheet editor`를 우선한다.

### 3.3 상호작용 원칙
- add/edit는 기본적으로 bottom sheet 우선.
- 위험하거나 긴 편집만 full screen으로 보낸다.
- compact selector는 tap-to-cycle보다 dropdown/sheet picker를 우선한다.
- 빈 상태(empty)는 문장 설명보다 action CTA를 먼저 보이게 한다.

### 3.4 타이포와 밀도
- section subtitle 설명문은 줄이고, label과 값의 구조를 더 분명히 한다.
- card 내부 간격은 촘촘하게 하되, section 간 간격은 더 확실히 둔다.
- long explanation copy는 Settings fallback, QA/debug surface에서만 제한적으로 유지한다.

---

## 4. Screen-by-Screen Target State

## 4.1 Home

### 목표 상태
- 첫 화면에서 앱 가치가 한 번에 보여야 한다.
- 사용자는 아래를 즉시 읽을 수 있어야 한다.
  - 내 gym value 핵심 숫자
  - 현재 active visit 여부
  - 바로 할 수 있는 행동
  - supporting stats

### 권장 구조
1. 상단 app title
2. hero KPI card
3. 3-up summary stats row
4. active visit card
5. primary actions row
6. secondary metric cards

### 권장 UI
- hero card는 `cost per visit`를 크게 고정
- active visit card는 현재 gym, elapsed time, primary action을 명확히 표시
- quick action은 `Check In`, `Add Visit` 두 개를 우선
- supporting cards는 `Cost per hour`, `This month`, `Avg duration`, `Recent visit`

### 구현 메모
- 현재 empty/error state는 유지하되, 시각 배치만 이 구조에 맞게 이동
- home loading도 단순 문장 대신 skeleton/card placeholder로 가는 것이 좋다

---

## 4.2 Visits

### 목표 상태
- 방문 기록을 "타임라인 + 패턴" 둘 다 읽을 수 있게 한다.
- list + edit flow가 더 빠르고 자연스러워야 한다.

### 권장 구조
1. title + add button
2. period segmented control (`Month / Year / All`)
3. mini heatmap / activity calendar
4. count summary line
5. visit list
6. edit visit bottom sheet

### 권장 UI
- list row는 `date / time range / duration / source(auto/manual)` 중심
- edit icon은 trailing action으로 유지 가능
- quick edit는 bottom sheet에서 처리
- long-form edit가 필요하면 2차 화면으로 확장

### 구현 메모
- 현재 Visits는 CRUD가 이미 있으므로 surface만 정리하면 된다
- heatmap은 실제 완성도보다 시각적 consistency가 우선

---

## 4.3 Costs

### 현재 문제
- 현재 screen은 setup editor 성격이 강하다.
- phone viewport에서 여러 필드를 한 번에 보여주려다 보니 읽기보다 편집 부담이 먼저 온다.
- starter line 구조는 유효하지만, 상시 inline editing은 list UX보다 무겁다.

### 권장 목표 상태
- Costs는 기본적으로 `summary + saved list + add/edit sheet` 구조로 바꾼다.
- setup은 “항상 펼쳐진 에디터”가 아니라 “빠른 추가/수정 흐름”으로 바꾼다.

### 권장 구조
1. title + add button
2. monthly recurring summary card
3. saved cost list
4. row tap -> edit bottom sheet
5. add -> cost add sheet

### 권장 UI
- row는 `icon / label / subtype / amount / cadence suffix` 중심
- tax, cadence, dates, anchor는 sheet 내부에서 편집
- starter presets는 add flow에서 quick template로 제시
- inactive history는 기본 화면 하단이 아니라 별도 collapsed section 또는 secondary screen으로 이동

### 중요 판단
현재 inline grid editor는 compact하게 개선할 수는 있지만, screenshot 기준의 목표 experience와는 다르다.

권장 방향은 아래다.
- current inline editor를 더 polish하는 대신
- Costs screen을 `list-first`, `sheet-edit` 중심으로 재설계한다.

이 방향이 맞는 이유:
- phone에서 읽기/수정/스캔이 더 쉽다
- 저장된 비용을 "내 현재 비용 구조"로 읽기 좋다
- starter line logic은 add flow 안으로 숨길 수 있다
- 이후 onboarding과 settings/gym flow 재사용이 쉽다

---

## 4.4 Settings

### 목표 상태
- setup 정보를 "설정 값 목록"처럼 읽게 만든다.
- 각 섹션이 명확해야 한다: gym / permissions / tracking / tax defaults

### 권장 구조
1. Gym section
2. Permissions section
3. Tracking section
4. Tax defaults section

### 권장 UI
- gym은 row list + trailing value
- gym search/manual은 segmented action 또는 dual CTA row
- permission state는 status pill로 표시
- toggles는 tracking section에만 사용
- tax defaults는 region preset first 구조로 가는 것이 맞다

### 구현 메모
- current verbose debug copy는 개발용으로는 유용하지만, 기본 surface에서는 축소 필요
- device QA/debug info는 collapsible debug panel로 분리하는 것이 좋다

---

## 5. Shared Component Rules

## 5.1 Bottom Sheet Standard
- Add/Edit Visit
- Add/Edit Cost
- quick config editor

권장 규칙:
- primary action은 오른쪽
- cancel은 왼쪽
- destructive는 inline secondary action 또는 confirm step
- summary-only field는 read-only row로 표시

## 5.2 Floating Input Standard
- label은 placeholder로 시작
- focus/value 시 내부 상단으로 이동
- label이 박스 밖으로 튀어나가지 않음
- narrow mobile width에서도 텍스트가 잘리지 않아야 함

## 5.3 Selector Standard
- small finite options: segmented or dropdown
- 4개 이상 옵션: dropdown or sheet picker
- tax/cadence처럼 compact row 안에서 쓰는 값은 dropdown 우선

## 5.4 Card Standard
- white surface
- subtle border
- minimal shadow 또는 no-shadow
- 하나의 card는 하나의 역할만 가짐

---

## 6. Proposed Implementation Order

### Phase U1 — Shared UI primitives
- floating field 정리
- compact dropdown / sheet pattern 정리
- card / header / segmented / status pill 표준화

### Phase U2 — Home redesign
- hero KPI
- summary metrics grid
- quick action row
- active visit card 정리

### Phase U3 — Visits redesign
- screen header + add CTA
- segmented period filter
- heatmap card
- visit row redesign
- edit visit sheet

### Phase U4 — Costs redesign
- summary card
- saved list
- add/edit cost sheet
- starter presets in add flow
- inactive history secondary treatment

### Phase U5 — Settings redesign
- section grouping 정리
- row list surface
- permission status pills
- preset-first tax defaults
- gym search/manual entry surface

### Phase U6 — QA and polish
- spacing
- keyboard
- bottom sheet safe area
- long text overflow
- disabled/loading state consistency

---

## 7. PR-Sized Task Draft

### `UIR-01` design tokens and shared mobile chrome
- Goal: overall visual hierarchy를 먼저 통일한다.
- Scope: background/surface/border/text scale, header spacing, status pill, segmented, bottom sheet scaffold
- Acceptance: 모든 screen이 같은 card rhythm과 section spacing을 쓴다.
- 상태 메모:
  - screen header trailing action과 bottom sheet scaffold는 1차 반영됨
  - token/lightening, status pill, screen-wide spacing harmonization은 추가 작업 필요

### `UIR-02` Home information hierarchy refresh
- Goal: Home을 KPI-first dashboard로 재구성한다.
- Scope: hero card, stats grid, active visit card, quick actions
- Acceptance: 첫 화면에서 value와 next action이 즉시 보인다.
- 상태 메모:
  - hero KPI, 3-up summary grid, active visit card, quick actions, 2x2 supporting stats가 1차 반영됨
  - skeleton polish와 quick action semantics는 후속 polish 대상

### `UIR-03` Visits list and sheet refresh
- Goal: Visits를 tracking timeline처럼 보이게 한다.
- Scope: period filter, heatmap, visit row, edit sheet
- Acceptance: add/edit flow가 screen 밀도를 해치지 않는다.
- 상태 메모:
  - segmented period filter, activity heatmap, compact visit rows, quick edit bottom sheet가 1차 반영됨
  - active visit treatment, visual polish, edit sheet density QA는 후속 polish 대상

### `UIR-04` Costs list-first redesign
- Goal: Costs를 list + sheet 중심으로 바꾼다.
- Scope: recurring summary, saved list, add/edit sheet, quick templates
- Acceptance: 사용자가 비용 구조를 읽고 수정하기 쉬워진다.
- 상태 메모:
  - recurring summary card, active list, quick template sheet, edit sheet가 1차 반영됨
  - inactive secondary treatment, iconography polish, final spacing/copy polish는 후속 보완 필요

### `UIR-05` Settings structural refresh
- Goal: Settings를 setup dashboard처럼 정리한다.
- Scope: grouped sections, gym row list, permission pills, tracking toggles, tax defaults selector
- Acceptance: 설정 읽기와 편집 진입이 더 짧아진다.
- 상태 메모:
  - gym summary + edit sheet, permissions/status pills, tracking toggles, tax defaults sheet, collapsed diagnostics가 1차 반영됨
  - preset-first selector와 search-assisted gym entry는 후속 feature work와 함께 보완 예정

### `UIR-06` keyboard, modal, and state polish
- Goal: 실제 mobile interaction friction을 줄인다.
- Scope: input focus, scroll into view, modal actions, long text, loading/disabled state
- Acceptance: mobile real-device에서 입력과 편집이 자연스럽다.

---

## 8. 결정이 필요한 항목

아래 항목은 구현 전에 사용자 확인을 받는 것이 좋다.

### Q1. Costs 화면을 list-first 구조로 전환할 것인가
- 선택지 A: 현재 inline editor 유지 후 polish
- 선택지 B: summary + saved list + add/edit bottom sheet로 재설계
- 권장: 선택지 B

이유:
- screenshot target과 더 가깝다
- mobile에서 훨씬 읽기 쉽다
- starter line logic을 숨겨서 더 깔끔하게 만들 수 있다

### Q2. Visits 편집 기본 surface를 bottom sheet로 할 것인가
- 선택지 A: 계속 full page editor 중심
- 선택지 B: quick edit는 bottom sheet, 필요한 경우만 full screen
- 권장: 선택지 B

이유:
- 단순 수정은 sheet가 더 빠르다
- list context를 잃지 않는다

### Q3. Settings의 debug/diagnostic copy를 기본 화면에서 숨길 것인가
- 선택지 A: 지금처럼 항상 노출
- 선택지 B: 기본은 product copy만 노출하고 debug info는 collapse
- 권장: 선택지 B

이유:
- 제품 화면의 집중도를 크게 해친다
- 실제 사용자는 permission/debug internals를 항상 볼 필요가 없다

### Q4. visual direction을 screenshot에 더 가깝게 가져갈 것인가
- 선택지 A: 현재 warm-paper 톤 유지
- 선택지 B: 더 밝은 neutral white + soft green 중심으로 정리
- 권장: 선택지 B

이유:
- metrics/app chrome/readability가 더 좋아진다
- screenshots와도 더 자연스럽게 맞는다

---

## 9. 권장 결론

현재 기준의 가장 합리적인 진행 순서는 아래다.

1. shared primitives 정리
2. Home
3. Visits
4. Costs
5. Settings
6. QA polish

다만 실제 사용자 임팩트는 Costs와 Visits가 가장 크다.

따라서 사용자가 원하면 구현 시작 순서를 아래처럼 조정할 수 있다.

1. shared primitives
2. Costs
3. Visits
4. Home
5. Settings
6. QA polish

내 권장 방향은 **shared primitives 먼저, 그 다음 Costs부터 재설계**다.

이유:
- 지금 friction이 가장 큰 화면이 Costs다
- current inline editor를 더 밀기보다 interaction model 자체를 바꾸는 편이 낫다
- 이후 onboarding과 settings/gym flow 연결도 쉬워진다

---

## 10. Out of Scope

이번 문서는 아래를 직접 다루지 않는다.

- backend/sync/auth
- 온라인 확장
- estimator/advisor
- catalog/marketplace
- release signing 세부 절차

다만 mobile UI refresh 이후, release polish와 onboarding 계획에는 직접 영향을 준다.

# Gym Value App — IMPLEMENTATION_CHECKLIST v0.1

## 문서 정보
- 문서명: Implementation Checklist
- 버전: v0.1
- 상태: Active Working Doc
- 상위 문서:
  - Master Plan v0.1
  - Delivery Plan v0.1
  - Phase 0 / Phase 1 Implementation Kickoff v0.1
- 목적: `v0.1` 구현을 PR-sized 작업 단위로 쪼개고, 각 작업의 범위·완료 기준·검증 기준을 한 문서에서 추적한다.

---

## 1. 문서 역할

이 문서는 Gym Value App의 **실행 트래커 문서**다.

역할은 아래와 같다.
- 코어 스펙 문서의 결정을 실제 작업 단위로 풀어 쓴다.
- 작업 상태를 `todo / doing / blocked / done`으로 관리한다.
- 각 작업에 수용 기준과 검증 기준을 붙여, 다른 엔지니어도 바로 실행할 수 있게 한다.
- Milestone 수준 계획은 `DELIVERY_PLAN_v0.1.md`에 남기고, 이 문서는 **세부 task 추적**만 담당한다.

이 문서는 규범 문서를 대체하지 않는다.
- 제품/UX 결정: `PRODUCT_SPEC_v0.1.md`
- 기술 구조: `TECH_ARCHITECTURE_v0.1.md`
- 데이터/계산 규칙: `DATA_MODEL_AND_CALCULATION_v0.1.md`
- 마일스톤/QA/릴리즈: `DELIVERY_PLAN_v0.1.md`

---

## 2. 사용 규칙

### 2.1 상태값
- `todo`: 아직 시작하지 않음
- `doing`: 현재 진행 중
- `blocked`: 외부 결정 또는 선행 작업 때문에 진행 불가
- `done`: 수용 기준과 검증 기준을 만족함

### 2.2 작업 항목 형식
모든 task는 아래 형식을 따른다.
- `Task ID`
- `Status`
- `Goal`
- `Depends on`
- `Scope`
- `Acceptance`
- `Verification`
- `Out of scope`

### 2.3 업데이트 원칙
- 스펙이 바뀌면 먼저 코어 문서를 수정한 뒤 이 문서를 갱신한다.
- 작업 상태만 바뀌면 이 문서만 갱신한다.
- PR 제목, 브랜치 이름, 커밋 메시지에는 가능하면 `Task ID`를 포함한다.

---

## 3. 현재 저장소 Baseline

### 이미 완료된 상태
- 저장소 루트가 npm workspaces 기반 monorepo로 구성되어 있다.
- React Native 앱이 `apps/mobile`에 bootstrap 되어 있다.
- `apps/mobile/android`, `apps/mobile/ios` 네이티브 프로젝트가 생성되어 있다.
- `apps/mobile/metro.config.js`가 monorepo root `node_modules`를 보도록 설정되어 있다.
- 저장소 루트 `package.json`에 모바일 실행용 workspace scripts가 있다.
- `apps/mobile/src` 루트와 최소 app shell/provider 구조가 생성되어 있다.
- `App.tsx`가 RN 템플릿 대신 `src` 기반 app entry를 사용한다.
- React Navigation 기반 `RootNavigator` / `TabNavigator`와 4개 placeholder screen이 연결되어 있다.
- iOS pod install이 새 navigation native dependency 상태까지 반영했다.

### 아직 미완료인 상태
- theme tokens와 재사용 공통 UI base가 없다.
- SQLite dependency, DB client, migration runner가 없다.
- repositories, form types, validation, CRUD 화면/플로우가 없다.
- Home KPI와 calculation layer가 없다.

---

## 4. 추적 기준 문서 맵

각 task는 아래 문서 결정을 구현 단위로 옮긴 것이다.

### `DOC-*`
- `MASTER_PLAN_v0.1.md` §15, §17
- `DELIVERY_PLAN_v0.1.md` §1, §4, §22
- `PHASE_0_1_IMPLEMENTATION_KICKOFF_v0.1.md` §1, §2, §23

### `FND-*`
- `TECH_ARCHITECTURE_v0.1.md` §3, §6, §7, §8
- `DELIVERY_PLAN_v0.1.md` §5
- `PHASE_0_1_IMPLEMENTATION_KICKOFF_v0.1.md` §8, §9, §10

### `DB-*`
- `INITIAL_DB_SCHEMA_SQL_v0.1.md` §2 ~ §10
- `DATA_MODEL_AND_CALCULATION_v0.1.md` §4 ~ §7, §20, §23
- `TECH_ARCHITECTURE_v0.1.md` §3.4, §12

### `DOM-*`
- `DATA_MODEL_AND_CALCULATION_v0.1.md` §7, §10, §21, §22
- `TECH_ARCHITECTURE_v0.1.md` §13, §14, §15

### `GYM-*`
- `PRODUCT_SPEC_v0.1.md` §9, §12, §18.7
- `DATA_MODEL_AND_CALCULATION_v0.1.md` §4.1
- `PHASE_0_1_IMPLEMENTATION_KICKOFF_v0.1.md` §11.4

### `COST-*`
- `PRODUCT_SPEC_v0.1.md` §8, §11
- `DATA_MODEL_AND_CALCULATION_v0.1.md` §4.4, §7.3, §9, §10, §13
- `PHASE_0_1_IMPLEMENTATION_KICKOFF_v0.1.md` §11.5

### `VISIT-*`
- `PRODUCT_SPEC_v0.1.md` §7, §10, §14, §18
- `DATA_MODEL_AND_CALCULATION_v0.1.md` §4.2, §7.1, §8, §12, §16
- `PHASE_0_1_IMPLEMENTATION_KICKOFF_v0.1.md` §11.6

### `SET-*`
- `PRODUCT_SPEC_v0.1.md` §9
- `DATA_MODEL_AND_CALCULATION_v0.1.md` §4.5
- `PHASE_0_1_IMPLEMENTATION_KICKOFF_v0.1.md` §11.8

### `KPI-*`
- `PRODUCT_SPEC_v0.1.md` §6, §15, §17, §22
- `DATA_MODEL_AND_CALCULATION_v0.1.md` §12 ~ §19, §24 ~ §26
- `DELIVERY_PLAN_v0.1.md` §7

### `AUTO-*`
- `PRODUCT_SPEC_v0.1.md` §13
- `TECH_ARCHITECTURE_v0.1.md` §9, §11, §18, §19, §20
- `DELIVERY_PLAN_v0.1.md` §8

---

## 5. Immediate Next 5 Tasks

아래 5개는 현재 저장소 상태에서 바로 시작 가능한 첫 작업들이다.

1. `FND-03` AppProviders, theme, 공통 UI 베이스 추가
2. `DB-01` SQLite dependency 및 DB client bootstrap
3. `DB-02` migration runner와 `001_initial_schema` 추가
4. `DB-03` settings bootstrap과 DB readiness logging
5. `DOM-01` Domain enums/models와 상수 정의

---

## 6. Task Checklist

### `DOC-01` Implementation checklist 문서 추가
- Status: `done`
- Goal: 세부 실행 추적의 단일 기준 문서를 만든다.
- Depends on: `none`
- Scope: 본 문서 생성, 상태 체계 정의, baseline/track/phase gate/decision lock 정리
- Acceptance: `docs/IMPLEMENTATION_CHECKLIST_v0.1.md`가 존재하고, 전체 v0.1 작업 단위를 추적할 수 있다.
- Verification: 문서 내에 `DOC/FND/DB/DOM/GYM/COST/VISIT/SET/KPI/AUTO` 트랙과 phase gate가 모두 존재한다.
- Out of scope: 코드 구현, 라이브러리 설치, 화면 변경

### `DOC-02` 코어/companion 문서 교차 참조 정렬
- Status: `done`
- Goal: 코어 문서와 companion 문서의 역할 경계를 명확히 한다.
- Depends on: `DOC-01`
- Scope: `MASTER_PLAN`, `DELIVERY_PLAN`, `PHASE_0_1_IMPLEMENTATION_KICKOFF`에 새 체크리스트 문서 역할과 참조를 추가
- Acceptance: 세 문서 모두 milestone 수준 계획과 task 수준 추적의 책임이 분리되어 있다.
- Verification: 각 문서에서 `IMPLEMENTATION_CHECKLIST_v0.1.md`를 companion 또는 실행 추적 문서로 참조한다.
- Out of scope: 신규 제품 결정, Phase 2+ 세부 스펙 추가

### `DOC-03` 문서 위생 후속 정리
- Status: `todo`
- Goal: 문서/템플릿 잔여물을 정리해 실행 문서 세트를 더 깔끔하게 만든다.
- Depends on: `DOC-02`
- Scope: 문서 제목 톤 점검, 템플릿성 문구 제거 후보 정리, `.DS_Store` 같은 잡파일 정리
- Acceptance: 남은 문서 정리 작업 목록이 명확하고, 실행과 무관한 노이즈가 식별되어 있다.
- Verification: follow-up diff 또는 이슈 목록으로 정리된다.
- Out of scope: 앱 로직 구현, 문서 대규모 재작성

### `FND-01` App shell entry와 `src` 루트 생성
- Status: `done`
- Goal: RN 템플릿 진입점을 프로젝트 구조로 교체한다.
- Depends on: `DOC-02`
- Scope: `apps/mobile/src` 기본 디렉터리 생성, `App.tsx`를 `AppProviders` 기반 프로젝트 엔트리로 전환
- Acceptance: RN 기본 `NewAppScreen`이 제거되고, 프로젝트 shell이 앱 시작점으로 연결된다.
- Verification: `apps/mobile/App.tsx`가 `src` 기반 entry를 사용하고, smoke test가 통과한다.
- Out of scope: 실제 CRUD 화면 구현, DB 연결

### `FND-02` Navigation shell과 4개 탭 구성
- Status: `done`
- Goal: Home, Visits, Costs, Settings 탭 이동 골격을 만든다.
- Depends on: `FND-01`
- Scope: navigation dependency 연결, RootNavigator/TabNavigator 생성, 4개 placeholder screen 추가
- Acceptance: 4개 탭이 전환 가능하고 앱 shell에서 navigation tree가 정상 렌더링된다.
- Verification: navigation shell 코드가 연결되어 있고, Jest smoke test와 iOS `pod install`이 모두 통과한다.
- Out of scope: modal routes, 상세 화면, form UX

### `FND-03` AppProviders, theme, 공통 UI 베이스
- Status: `todo`
- Goal: 이후 화면 작업에 필요한 공통 provider와 최소 UI 토대를 만든다.
- Depends on: `FND-02`
- Scope: `AppProviders`, theme tokens, `ScreenContainer`, `Card`, `PrimaryButton`, `EmptyState` 정도의 최소 컴포넌트 추가
- Acceptance: 새 화면이 공통 container와 theme를 통해 일관된 기본 레이아웃을 사용할 수 있다.
- Verification: placeholder screens가 공통 theme/components를 사용하도록 교체된다.
- Out of scope: 디자인 polish, animation, 고급 컴포넌트 시스템

### `DB-01` SQLite dependency와 DB client bootstrap
- Status: `todo`
- Goal: SQLite를 앱의 source of truth로 연결할 준비를 한다.
- Depends on: `FND-01`
- Scope: `react-native-nitro-sqlite` 설치, DB open 유틸과 client module scaffold 작성
- Acceptance: 앱 코드에서 DB open 함수를 안전하게 호출할 수 있는 구조가 생긴다.
- Verification: 개발 로그에서 DB open 성공/실패를 구분할 수 있다.
- Out of scope: schema 생성, repository 구현

### `DB-02` Migration runner와 `001_initial_schema`
- Status: `todo`
- Goal: 문서에 정의된 초기 스키마를 코드로 고정한다.
- Depends on: `DB-01`
- Scope: migration 목록, runner, `001_initial_schema.ts`, `schema_migrations` 기록, 전체 DDL 반영
- Acceptance: 첫 실행 시 6개 테이블과 인덱스가 생성되고, 재실행 시 중복 적용 에러가 없다.
- Verification: migration 로그와 SQLite inspection으로 테이블/인덱스 존재를 확인한다.
- Out of scope: CRUD 화면, Home KPI

### `DB-03` Settings bootstrap과 DB readiness logging
- Status: `todo`
- Goal: `app_settings` 기본 row와 app ready 흐름을 만든다.
- Depends on: `DB-02`
- Scope: `id = 'default'` upsert, BC/Canada 기본값 seed, app ready/logging 처리
- Acceptance: 앱 부팅 후 기본 설정 row가 존재하고 DB readiness 상태가 앱에서 구분된다.
- Verification: 재실행 후 동일 settings row가 유지되고 중복 생성되지 않는다.
- Out of scope: Settings UI, tax editing UX

### `DOM-01` Domain enums/models와 상수 정의
- Status: `todo`
- Goal: DB row와 화면/도메인 모델의 경계를 초기에 고정한다.
- Depends on: `DB-02`
- Scope: `Gym`, `Visit`, `FeeItem`, `AppSettings`, enum/constants, limits/defaults 정의
- Acceptance: repository와 UI가 공용으로 쓸 타입 집합이 존재한다.
- Verification: 타입 import 경로가 생기고, 상태값/enum이 문서 결정과 일치한다.
- Out of scope: validation, mapper 구현 디테일

### `DOM-02` Form value types와 validation utilities
- Status: `todo`
- Goal: manual-first 입력 규칙을 코드 수준에서 막는다.
- Depends on: `DOM-01`
- Scope: `GymFormValues`, `VisitFormValues`, `FeeItemFormValues`, validation helpers 또는 schema 작성
- Acceptance: 잘못된 시간, 금액, 반경, 날짜 범위를 저장 전에 차단할 수 있다.
- Verification: unit test 또는 직접 호출로 invalid input이 오류를 반환하는지 확인한다.
- Out of scope: 실제 form UI wiring

### `GYM-01` Gym Setup form shell과 primary gym 조회
- Status: `todo`
- Goal: gym 기본 정보 입력 흐름의 첫 UI를 만든다.
- Depends on: `FND-03`, `DOM-02`
- Scope: Gym Setup 화면/모달 shell, `name/latitude/longitude/radius/timezone` 입력, primary gym read path
- Acceptance: 저장 전후 상태를 고려한 Gym Setup 화면이 존재한다.
- Verification: gym 없음 상태에서 setup 진입, existing primary gym 있을 때 초기값 로드 확인
- Out of scope: 지도 선택, 현재 위치 기반 자동 입력

### `GYM-02` Gym persistence와 edit flow
- Status: `todo`
- Goal: gym 생성/수정이 실제 DB와 연결되도록 한다.
- Depends on: `GYM-01`, `DB-03`
- Scope: `GymRepository`, create/update, primary gym 유지 규칙, 성공/실패 피드백
- Acceptance: 단일 primary gym을 생성하고 다시 열어 수정할 수 있다.
- Verification: 앱 재실행 후 동일 gym이 유지되고, primary gym query가 일관된다.
- Out of scope: multi-gym UI, geofence sync

### `COST-01` Costs list와 empty state
- Status: `todo`
- Goal: 비용 화면의 기본 탐색 구조를 만든다.
- Depends on: `FND-03`, `DB-03`
- Scope: cost list query, empty state, active 우선 정렬, add CTA
- Acceptance: 비용이 없을 때와 있을 때의 리스트 상태가 모두 보인다.
- Verification: seed 없이 empty state 확인 후, 항목 추가 시 list refresh가 가능하다.
- Out of scope: add/edit form 세부 입력

### `COST-02` Add/Edit Cost Item form
- Status: `todo`
- Goal: 비용 항목 생성/수정 폼을 구현한다.
- Depends on: `COST-01`, `DOM-02`
- Scope: `label/category/amount_pre_tax/cadence/start_date/end_date/tax_mode/gst_rate/pst_rate/is_active` 입력
- Acceptance: `one_time`, `monthly`, `annual` 비용을 생성/수정할 수 있고 `cadence = custom`은 UI에 노출되지 않는다.
- Verification: 각 cadence별 저장 후 row 값과 validation 결과를 확인한다.
- Out of scope: KPI 반영, 고급 cost insight

### `COST-03` Inactive/delete flow와 list refresh
- Status: `todo`
- Goal: 비용 항목 삭제 정책을 soft-delete 기준으로 고정한다.
- Depends on: `COST-02`
- Scope: `is_active = 0` 처리, list refresh, 사용자 피드백, inactive row 표시 정책
- Acceptance: UI에서는 삭제처럼 동작하되 데이터 레벨에서는 inactive로 관리된다.
- Verification: 비활성화 후 재실행해도 항목이 계산 대상에서 제외되고, raw row는 남아 있다.
- Out of scope: hard delete, archive/history UI

### `VISIT-01` Visits list와 empty state
- Status: `todo`
- Goal: 방문 기록 화면의 기본 리스트 구조를 만든다.
- Depends on: `FND-03`, `DB-03`
- Scope: visit list query, empty state, 최신순 정렬, add CTA
- Acceptance: 방문 없음 상태와 방문 존재 상태를 모두 렌더링할 수 있다.
- Verification: 첫 진입 시 empty state, 저장 후 list refresh 동작 확인
- Out of scope: filter chips, recovery candidates

### `VISIT-02` Add/Edit Visit form과 duration derivation
- Status: `todo`
- Goal: 수동 방문 추가/수정의 핵심 입력 흐름을 완성한다.
- Depends on: `VISIT-01`, `DOM-02`, `GYM-02`
- Scope: `date/started_at/ended_at/gym_id/notes` 입력, derived `duration_minutes`, form validation
- Acceptance: 시작/종료 입력으로만 visit를 저장/수정할 수 있고 duration은 자동 계산된다.
- Verification: 저장 후 DB row의 `status = completed`, `duration_minutes > 0`, invalid time 차단 확인
- Out of scope: active visit timer, auto check-in

### `VISIT-03` Cancel flow, duplicate active guard, list refresh
- Status: `todo`
- Goal: visit 삭제 정책과 active visit 무결성을 고정한다.
- Depends on: `VISIT-02`
- Scope: UI delete action, 내부 `cancelled` 처리, single active visit guard, update after write
- Acceptance: visit 삭제는 `cancelled`로 처리되고, 중복 active visit 생성 시도가 차단된다.
- Verification: cancelled visit는 기본 리스트/집계에서 빠지고 partial unique guard가 동작한다.
- Out of scope: hard delete, overlap conflict resolution UX

### `SET-01` Minimal settings screen과 upsert
- Status: `todo`
- Goal: tax default와 locale/currency를 UI에서 다룰 최소 기반을 만든다.
- Depends on: `DB-03`, `FND-03`
- Scope: `currency`, `locale`, `default_gst_rate`, `default_pst_rate` read/update
- Acceptance: settings row를 읽고 수정한 뒤 재실행해도 유지된다.
- Verification: 초기값 `CAD / en-CA / BC_CA / GST+PST`가 로드되고 수정 후 upsert가 반영된다.
- Out of scope: permission toggles, tracking settings, about/help

### `KPI-01` Fee occurrence expansion과 tax calculator
- Status: `todo`
- Goal: 비용 계산의 핵심 순수 함수를 먼저 완성한다.
- Depends on: `COST-03`, `SET-01`
- Scope: effective tax resolution, one-time/monthly/annual occurrence expansion, total paid calculation
- Acceptance: BC 기본 preset과 custom tax override가 문서 규칙대로 계산된다.
- Verification: example scenario tests로 monthly/annual/one-time 총액이 문서 예시와 맞는지 확인한다.
- Out of scope: UI formatting, chart, forecast

### `KPI-02` Dashboard stats assembly
- Status: `todo`
- Goal: visits와 fee_items를 결합해 Home용 stats를 조립한다.
- Depends on: `VISIT-03`, `KPI-01`
- Scope: `totalVisits`, `totalDuration`, `uniqueVisitDays`, `averageVisitLength`, `costPerVisit`, `costPerHour`, `latestVisitAt`
- Acceptance: 기본 range `current_year` 기준 `DashboardStats`를 일관되게 계산할 수 있다.
- Verification: 비용 없음/방문 없음/active visit 존재/연도 경계 시나리오를 테스트한다.
- Out of scope: filters UI, month switcher

### `KPI-03` Home KPI screen과 empty/error states
- Status: `todo`
- Goal: 제품 핵심 가치인 Home KPI를 UI로 완성한다.
- Depends on: `KPI-02`
- Scope: primary metric card, summary cards, gym/cost/visit empty states, latest visit 표시
- Acceptance: Home이 `cost per visit`를 메인 KPI로 렌더링하고 `null`과 `0`을 구분해 표시한다.
- Verification: empty state별 CTA와 populated state의 숫자 표시를 수동 확인한다.
- Out of scope: active visit live timer, location-driven states

### `KPI-04` Manual MVP exit QA pass
- Status: `todo`
- Goal: 위치 기능 없이도 usable MVP가 되는지 수동 QA로 잠근다.
- Depends on: `KPI-03`
- Scope: manual CRUD, persistence, calculation, empty state, invalid input 시나리오 점검
- Acceptance: `Manual MVP Exit` 조건을 모두 만족한다.
- Verification: 본 문서 §7의 `Manual MVP Exit` gate를 체크리스트로 실행한다.
- Out of scope: geofence, notification actions, release signing

### `AUTO-01` Platform service interfaces만 먼저 추가
- Status: `todo`
- Goal: 위치/알림 구현 전에 인터페이스와 경계를 고정한다.
- Depends on: `KPI-04`
- Scope: `PermissionService`, `LocationService`, `NotificationService`, `AppLifecycleService` 타입/계약 정의
- Acceptance: application layer가 SDK 구체 구현 없이 service contract를 참조할 수 있다.
- Verification: mock/stub service로 compile path와 handler 시그니처를 확인한다.
- Out of scope: 실제 geofence 라이브러리 연결

### `AUTO-02` Prompt persistence와 active visit orchestration
- Status: `todo`
- Goal: assisted flow에 필요한 application layer orchestration을 준비한다.
- Depends on: `AUTO-01`
- Scope: `location_prompts` repository/use case, `startVisitFromPrompt`, `completeActiveVisit`, session restore skeleton
- Acceptance: prompt와 visit를 연결하는 application 흐름이 코드 구조상 존재한다.
- Verification: stub event 입력으로 prompt row 생성과 visit transition을 확인한다.
- Out of scope: 실제 background event 수신

### `AUTO-03` Geofence/notification wiring
- Status: `todo`
- Goal: prompt 기반 check-in/check-out 제안을 실제 플랫폼과 연결한다.
- Depends on: `AUTO-02`
- Scope: permission flow, geofence register/remove, enter/exit event handling, notification action wiring
- Acceptance: 실제 기기에서 enter -> suggestion -> check-in, exit -> suggestion 흐름이 동작한다.
- Verification: Android 우선 수동 QA로 알림 표시와 action handling을 확인한다.
- Out of scope: 완전자동 visit 생성

### `AUTO-04` Assisted flow QA와 fallback polish
- Status: `todo`
- Goal: 자동화 실패 시에도 manual-only 가치가 무너지지 않게 다듬는다.
- Depends on: `AUTO-03`
- Scope: permission denied UX, fallback copy, active visit restore, weird duration/recovery 후보 점검
- Acceptance: 자동화가 실패해도 앱 전체 흐름이 usable하고 데이터 무결성이 유지된다.
- Verification: 권한 거부, 알림 미수신, app restart, duplicate active visit 시나리오를 점검한다.
- Out of scope: release build, analytics integration

---

## 7. Phase Gates

### Foundation Exit
진입 조건:
- `DOC-02` 완료

완료 조건:
- `FND-01`, `FND-02`, `FND-03`, `DB-01`, `DB-02`, `DB-03` 완료
- 앱이 Android/iOS에서 shell + navigation + DB readiness 상태로 실행된다.
- migration 재실행 시 중복 에러가 없다.

### Manual MVP Exit
진입 조건:
- `Foundation Exit` 완료

완료 조건:
- `DOM-01`, `DOM-02`, `GYM-01`, `GYM-02`, `COST-01`, `COST-02`, `COST-03`, `VISIT-01`, `VISIT-02`, `VISIT-03`, `SET-01` 완료
- 위치 권한 없이도 gym/cost/visit 데이터를 끝까지 쌓을 수 있다.
- visit는 `cancelled`, fee item은 `inactive` 정책으로 동작한다.
- 앱 재실행 후 모든 manual data가 유지된다.

### KPI MVP Exit
진입 조건:
- `Manual MVP Exit` 완료

완료 조건:
- `KPI-01`, `KPI-02`, `KPI-03`, `KPI-04` 완료
- Home이 `current year` 기준 `cost per visit`를 메인 KPI로 보여준다.
- `null`과 `0` 구분이 문서 정책대로 반영된다.
- 수동 입력만으로도 usable MVP라고 판정할 수 있다.

---

## 8. Decision Lock

아래 항목은 v0.1 기본값으로 잠근다.

- 기본 시장: `BC/Canada`
- 기본 설정: `CAD`, `en-CA`, `BC_CA`
- Gym Setup Phase 1 입력 방식: `manual coordinates`
- 삭제 정책: `visit = cancelled`, `fee_item = inactive`
- KPI 기본 기간: `current year`
- `cadence = custom`: 스키마 enum으로만 존재, v0.1 UI/계산에서는 제외

---

## 9. 최종 메모

이 문서는 task 추적 문서다.

따라서 아래를 항상 지킨다.
- 결정 변경은 코어 문서에서 먼저 처리한다.
- 구현 진행률 추적은 이 문서에서 처리한다.
- milestone 판단은 `DELIVERY_PLAN_v0.1.md`
- Phase 0 / 1 범위 설명은 `PHASE_0_1_IMPLEMENTATION_KICKOFF_v0.1.md`

즉, **무엇을 만들지**는 코어 문서가 말하고, **어떤 순서와 단위로 만들지**는 이 문서가 말한다.

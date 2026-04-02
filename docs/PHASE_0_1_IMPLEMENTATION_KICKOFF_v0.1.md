# Gym Value App — Phase 0 / Phase 1 Implementation Kickoff v0.1

## 문서 정보
- 문서명: Phase 0 / Phase 1 Implementation Kickoff
- 버전: v0.1
- 상태: Draft
- 상위 문서:
  - Master Plan v0.1
  - Product Spec v0.1
  - Tech Architecture v0.1
  - Data Model and Calculation v0.1
  - Delivery Plan v0.1
- 목적: 실제 구현 시작을 위한 초기 작업 범위, 파일 구조, 선행 작업, 체크리스트, 우선순위를 정리하는 엔지니어링 킥오프 문서
- 목적 보완: 현재 저장소 baseline과 Phase 0 / Phase 1 범위를 설명하고, 세부 task 추적은 `IMPLEMENTATION_CHECKLIST_v0.1.md`에 연결

---

## 1. 문서 목적

이 문서는 Gym Value App의 **실제 구현 시작용 문서**다.

기존 문서들이 제품 방향, 기술 구조, 데이터 모델, 실행 계획을 정의했다면,
이 문서는 그 내용을 바탕으로 **무엇을 먼저 만들고, 어떤 순서로 파일을 만들고, 어디까지를 Phase 0 / Phase 1 완료로 볼 것인지**를 명확히 하는 것이 목적이다.

이 문서는 특히 아래 질문에 답한다.
- 첫 커밋 이후 어떤 구조를 먼저 만들 것인가?
- 어떤 파일을 먼저 생성해야 하는가?
- DB는 어떤 순서로 붙일 것인가?
- UI는 어느 수준까지만 먼저 만들 것인가?
- 어느 시점에 “Phase 0 완료”, “Phase 1 완료”라고 판단할 것인가?

**Milestone 대응:** 본 문서의 **Phase 0 / Phase 1**은 Delivery Plan의 **Milestone 1 (Foundation) / Milestone 2 (Core Data & Manual Tracking)** 과 같은 구간을 엔지니어링 관점에서 부른 것이다. 상세 매핑 표는 **Delivery Plan §4.1**을 따른다.

세부 작업 단위, 상태값, acceptance/verification 기준은 companion 문서인 **`IMPLEMENTATION_CHECKLIST_v0.1.md`** 에서 추적한다.

---

## 2. 이번 문서의 범위

이 문서는 아래 범위만 다룬다.

### 포함
- Phase 0: Foundation
- Phase 1: Core Data & Manual Tracking
- 초기 폴더 구조
- 초기 dependency 방향
- 선행 작업 순서
- 구현 체크리스트
- 완료 기준
- QA 기준

### 제외
- 위치/알림 자동화 상세 구현
- geofence 라이브러리 세부 통합
- release signing 상세 절차
- Phase 2 이후 polish 세부 항목

즉, 이 문서는 **앱을 실행 가능하고, 로컬 DB 기반 수동 기록이 가능한 상태까지 빠르게 만드는 실행 문서**다.

### 현재 저장소 baseline

이미 완료된 상태:
- 저장소 루트가 npm workspaces 기반 monorepo로 구성되어 있다.
- React Native 앱이 `apps/mobile`에 bootstrap 되어 있다.
- `apps/mobile/android`, `apps/mobile/ios` 네이티브 프로젝트가 생성되어 있다.
- `apps/mobile/metro.config.js`가 monorepo root 의존성을 보도록 설정되어 있다.
- `apps/mobile/src` 루트와 최소 app shell/provider 구조가 생성되어 있다.
- `App.tsx`가 RN 템플릿 대신 `src` 기반 entry를 사용한다.
- React Navigation 기반 navigation shell과 4개 탭 placeholder가 연결되어 있다.
- 공통 theme 토큰과 재사용 UI base가 추가되어 placeholder screen들이 같은 레이아웃 베이스를 사용한다.
- `react-native-nitro-sqlite`와 `react-native-nitro-modules`가 설치되어 있다.
- DB client module과 app startup bootstrap 경로가 연결되어 있다.
- migration runner와 `001_initial_schema` startup execution path가 연결되어 있다.
- `app_settings` default seed와 DB readiness `booting / ready / error` gate가 연결되어 있다.
- `domain/models`와 `domain/constants`에 공용 app model, enum, defaults, limits가 추가되어 있다.
- `domain/forms`와 `utils/validation`에 form value types, validation message constants, 순수 validator가 추가되어 있다.
- Settings 탭에 Gym Setup shell과 primary gym read path가 연결되어 있다.
- primary gym create/update persistence와 저장 성공/실패 피드백이 Settings 탭에 연결되어 있다.
- Costs 탭에 fee item read path, active-first list shell, empty state, add CTA entry point가 연결되어 있다.
- Costs 탭에 fee item add/edit form과 create/update persistence가 연결되어 있다.
- Costs 탭에 fee item inactive/delete path와 inactive history 표시 정책이 연결되어 있다.

아직 미완료인 상태:
- visit / settings repositories와 remaining CRUD
- Home KPI / calculation layer

---

## 3. 핵심 목표 요약

## 3.1 Phase 0 목표
앱의 기술적 뼈대를 만들고, 개발 가능한 상태를 안정적으로 확보한다.

## 3.2 Phase 1 목표
위치 기능 없이도 아래가 가능해야 한다.
- gym 등록
- 비용 항목 등록
- 방문 수동 추가/수정/삭제
- 로컬 DB 저장
- 앱 재실행 후 데이터 유지

즉, **수동 입력만으로도 앱의 핵심 데이터가 정상적으로 쌓이는 상태**가 목표다.

---

## 4. Phase 0 정의

## 4.1 목표
- 앱 부트스트랩
- 개발 환경 안정화
- navigation / theme / DB / state의 최소 골격 생성
- 이후 Phase 1 작업이 막히지 않는 기본 기반 확보

## 4.2 Phase 0 완료 후 기대 상태
아래가 가능해야 한다.
- Android에서 앱 실행
- iOS에서 앱 실행
- 탭 구조 렌더링
- SQLite DB 초기화
- migrations 실행
- 기본 store/provider 연결
- 빈 상태 화면 표시

---

## 5. Phase 1 정의

## 5.1 목표
- gym, visit, fee item 데이터를 직접 입력할 수 있음
- CRUD가 로컬 DB와 연결됨
- validation이 최소 수준으로 동작함
- 아직 Home KPI 계산은 완성 전이어도, 계산 가능한 데이터가 정상적으로 쌓임

## 5.2 Phase 1 완료 후 기대 상태
아래가 가능해야 한다.
- 사용자가 gym을 등록할 수 있다.
- 사용자가 fee item을 추가/수정/삭제할 수 있다.
- 사용자가 visit를 수동 추가/수정/삭제할 수 있다.
- DB에 데이터가 정상 저장된다.
- 앱 재시작 후 데이터가 유지된다.
- validation이 최소 수준으로 동작한다.

---

## 6. 구현 전략 요약

이번 구현은 아래 순서로 진행한다.

1. 프로젝트와 구조를 먼저 안정화한다.
2. DB를 먼저 연결한다.
3. 엔티티별 repository를 만든다.
4. 수동 입력 form을 붙인다.
5. 리스트와 저장 흐름을 연결한다.
6. 이후 dashboard 계산으로 넘어간다.

### 왜 이 순서인가
이 앱은 위치 기능보다 **데이터 모델과 계산 규칙**이 본질이다.
따라서 Phase 0 / 1에서는 “나중에 KPI를 계산할 수 있는 데이터가 정확히 쌓이느냐”가 가장 중요하다.

---

## 7. 권장 초기 의존성 방향

아래는 Phase 0 / 1에서 우선 검토할 라이브러리 목록이다.

### 필수
- React Native CLI
- TypeScript
- React Navigation
- Zustand
- SQLite 라이브러리 (`react-native-nitro-sqlite` 우선)
- dayjs

### 강한 권장
- React Hook Form
- zod 또는 유사 validation 도구

### Phase 0 / 1에서는 아직 optional
- Notifee
- background geolocation library

### 원칙
- 위치/알림 dependency는 설치만 미리 해도 되고, 실제 연결은 뒤로 미뤄도 된다.
- DB/폼/기본 네비게이션이 우선이다.

### Monorepo / npm workspaces (선택)

문서의 레이어·폴더 구조 결정은 **단일 패키지든** 저장소 루트에 `apps/mobile` 같은 **워크스페이스**를 두든 동일하게 유효하다. 다만 후자의 경우 Metro 번들러·Android Gradle·`node_modules` 해석 경로를 **모노레포 루트에 맞게** 조정해야 할 수 있다(예: 루트로 호이스트된 의존성). 이는 배치 문제이며, **Presentation / Application / Data / Platform** 분리나 SQLite·도메인 규칙은 그대로 적용한다.

---

## 8. 초기 폴더 구조 (실행용)

Phase 0 / 1에서 실제로 먼저 만들 최소 구조는 아래 정도면 충분하다.

```text
src/
  app/
    navigation/
      RootNavigator.tsx
      TabNavigator.tsx
    providers/
      AppProviders.tsx

  screens/
    home/
      HomeScreen.tsx
    visits/
      VisitsScreen.tsx
    costs/
      CostsScreen.tsx
    settings/
      SettingsScreen.tsx

  features/
    gym/
      components/
      useCases/
      hooks/
      types.ts
    visits/
      components/
      useCases/
      hooks/
      types.ts
    costs/
      components/
      useCases/
      hooks/
      types.ts

  data/
    db/
      client.ts
      migrations/
        001_initial_schema.ts
    repositories/
      GymRepository.ts
      VisitRepository.ts
      FeeItemRepository.ts
      SettingsRepository.ts
    mappers/

  domain/
    models/
      Gym.ts
      Visit.ts
      FeeItem.ts
    calculations/
      durationUtils.ts
    constants/
      defaults.ts
      limits.ts

  state/
    appStore.ts
    sessionStore.ts
    uiStore.ts

  ui/
    components/
    theme/

  utils/
    validation/
    ids/
    date/
    currency/
```

### Phase 0 / 1 구조 원칙
- 너무 이른 최적화 금지
- dashboard 전용 selector는 Phase 1 후반 또는 Phase 2 직전 추가 가능
- location / notifications 폴더는 placeholder만 두거나 아직 만들지 않아도 됨

---

## 9. Phase 0 상세 작업 목록

## 9.1 Project Bootstrap / Baseline 정리

### 이미 확보된 baseline
- [x] RN CLI 프로젝트가 `apps/mobile`에 bootstrap 되어 있다.
- [x] Android / iOS 네이티브 프로젝트가 생성되어 있다.
- [x] npm workspace root와 모바일 실행 스크립트가 있다.
- [x] Metro monorepo 설정이 연결되어 있다.

### 남은 작업

### 완료 기준
- 현재 bootstrap 자산 위에 project shell이 올라간다.
- RN 템플릿 `App.tsx`가 제거되고 앱 구조가 `src` 기준으로 정리된다.

### 체크리스트
- [x] `apps/mobile` 프로젝트 bootstrap 완료
- [x] Android / iOS 네이티브 프로젝트 생성 완료
- [x] root workspace scripts 연결 완료
- [x] Metro monorepo 설정 완료
- [x] `FND-01` App shell / `src` root
- [x] `FND-02` Navigation shell
- [x] `FND-03` Providers / theme / UI base

---

## 9.2 Navigation Skeleton

### 작업
- RootNavigator 생성
- TabNavigator 생성
- 4개 탭 화면 placeholder 생성

### 완료 기준
- Home / Visits / Costs / Settings 탭 전환 가능

### 체크리스트
- [x] RootNavigator 생성
- [x] TabNavigator 생성
- [x] HomeScreen placeholder
- [x] VisitsScreen placeholder
- [x] CostsScreen placeholder
- [x] SettingsScreen placeholder

---

## 9.3 Theme / UI Base

### 작업
- spacing, radius, typography scale 최소 정의
- 기본 screen container 컴포넌트 생성
- button / card 같은 공통 UI는 아직 최소 수준만 준비

### 완료 기준
- 모든 화면에서 공통 spacing/typography를 사용할 수 있음

### 체크리스트
- [x] theme object 생성
- [x] spacing constants 정의
- [x] typography scale 정의
- [x] base screen layout 생성

---

## 9.4 Database Foundation

### 작업
- SQLite client 연결
- DB open 함수 작성
- migrations 실행 구조 생성
- 첫 migration (`001_initial_schema`) 작성

### 001_initial_schema 범위

**핵심 사용 범위(Phase 0 / 1 수동 플로우):** manual-first 구현에서 가장 자주 다루는 도메인 테이블은 `gyms`, `visits`, `fee_items`, `app_settings` 네 가지다.

**권장 초기 migration(`001_initial_schema`) 실제 범위:** 위 네 도메인에 더해, 인프라 테이블 `schema_migrations`와 도메인 테이블 `location_prompts`까지 **한 번에 포함하는 것을 기준으로 통일**한다(Initial DB Schema SQL 문서와 동일).  
- `location_prompts`는 **스키마에는 있으나 Phase 0 / 1에서 적극 사용하지 않아도 된다**(데이터 적재·UI 연동은 Assisted Check-In 이후로 미뤄도 됨).

**`location_prompts` 구현 시 맞출 점 (Initial DB Schema §7.6과 동일):**
- 첫 마이그레이션에 **CREATE TABLE + 인덱스 3개**까지 포함한다(“테이블만 만들고 인덱스는 나중”이 아님).
- **seed 행은 넣지 않는다** — Phase 0/1에서는 빈 테이블로 둔다.
- 앱 부팅 시 seed는 `app_settings` 등만 해당하고, `location_prompts`는 제외한다.

### 완료 기준
- 앱 시작 시 DB가 열림
- migration이 1회 정상 실행됨
- 재시작 시 중복 에러 없음

### 체크리스트
- [x] db client 연결
- [x] migration runner 생성
- [x] 001 schema 작성
- [x] app startup 시 migration 연결
- [x] DB open success/failure logging
- [x] default settings seed 연결
- [x] DB readiness gate / retry 처리

---

## 9.5 State Foundation

### 작업
- appStore 생성
- uiStore 생성
- sessionStore 생성

### 초기 상태 예시
- app ready 여부
- onboarding done 여부
- active visit id
- modal open/close 여부

### 완료 기준
- app state를 provider 없이 직접 사용 가능한 최소 구조 존재
- 나중에 화면과 연결할 수 있음

### 체크리스트
- [ ] appStore 생성
- [ ] uiStore 생성
- [ ] sessionStore 생성
- [ ] 기본 state actions 작성

---

## 10. Phase 0 산출물 요약

Phase 0이 끝나면 아래가 존재해야 한다.

- 실행 가능한 앱 프로젝트
- 4개 탭 navigation
- 공통 theme 기초
- SQLite 연결 및 migration 기반
- 최소 store 구조
- Phase 1에서 바로 CRUD를 만들 수 있는 뼈대

---

## 11. Phase 1 상세 작업 목록

## 11.1 Domain Models / Types 정리

### 작업
도메인 모델과 폼 입력 타입을 먼저 정리한다.

### 우선 작성 대상
- `Gym`
- `Visit`
- `FeeItem`
- `AppSettings`
- `DashboardStats`
- `VisitFormValues`
- `FeeItemFormValues`
- `GymFormValues`

### 완료 기준
- 화면과 repository 사이에서 사용할 타입이 분리되어 있음

### 체크리스트
- [x] Gym model 정의
- [x] Visit model 정의
- [x] FeeItem model 정의
- [x] AppSettings model 정의
- [x] DashboardStats model 정의
- [x] form types 정의
- [x] 공통 enum/constants 정의

---

## 11.2 Repository 구현

### 구현 대상
- `GymRepository`
- `VisitRepository`
- `FeeItemRepository`
- `SettingsRepository`

### 최소 제공 메서드
#### GymRepository
- `createGym`
- `updateGym`
- `getPrimaryGym`
- `listGyms`

#### VisitRepository
- `createVisit`
- `updateVisit`
- `deleteVisit` 또는 `cancelVisit`
- `getVisitById`
- `listVisits`
- `getActiveVisit`

#### FeeItemRepository
- `createFeeItem`
- `updateFeeItem`
- `deleteFeeItem` 또는 `deactivateFeeItem`
- `listFeeItems`
- `getActiveFeeItems`

#### SettingsRepository
- `getSettings`
- `upsertSettings`

### 완료 기준
- repository 단위로 CRUD가 정상 동작
- mock 없이 실제 DB에 연결됨

### 체크리스트
- [ ] GymRepository 구현
- [ ] VisitRepository 구현
- [ ] FeeItemRepository 구현
- [ ] SettingsRepository 구현
- [ ] row ↔ model mapping 정리

---

## 11.3 Validation Layer

### 작업
form 입력에 대한 기본 validation 구현

### Visit validation
- started_at 필수
- ended_at > started_at
- 미래 시각 금지
- duration > 0

### Fee item validation
- label 필수
- amount >= 0
- start_date 필수
- end_date는 start_date 이후

### Gym validation
- name 필수
- latitude/longitude 유효
- radius 범위 유효

### 완료 기준
- 잘못된 입력 저장이 차단됨
- 사용자에게 이해 가능한 메시지 표시 가능

### 체크리스트
- [x] Visit validation 구현
- [x] Fee validation 구현
- [x] Gym validation 구현
- [x] validation message constants 정리

---

## 11.4 Gym Setup 구현

### 범위
- gym 등록 화면/모달
- name, latitude, longitude, radius, timezone 입력
- primary gym 저장

### MVP 단순화
처음에는 지도 picker 없이 아래 방식도 허용 가능하다.
- 위도/경도 수동 입력
- 또는 현재 위치를 나중에 붙이기 전까지 임시 하드코딩/개발용 입력

### 완료 기준
- gym 1개를 저장하고 수정할 수 있음

### 체크리스트
- [x] Gym Setup UI 구현
- [x] createGym 연결
- [x] updateGym 연결
- [x] getPrimaryGym 연결
- [x] 저장 성공/실패 피드백 구현

---

## 11.5 Fee Items CRUD 구현

### 범위
- Costs 화면 리스트
- Add/Edit Cost Item 모달
- delete/inactive 처리

### 입력 필드
- label
- category
- amount_pre_tax
- cadence
- start_date
- end_date
- tax_mode
- gst_rate
- pst_rate
- active

### MVP 단순화
- **사용자 정의 비용 라인**(Other·커스텀 label로 추가하는 항목)은 허용한다 — Product Spec §8.4와 동일.
- **`cadence = custom`**(스키마 enum 값)은 v0.1 **UI에서 노출하지 않는다**. 계산 규칙도 v0.1에서 확정하지 않는다(Data Model §13.5).
- 세금 입력은 기본 preset 상속을 기본값으로 둔다.

### 완료 기준
- 사용자가 비용 항목을 추가/수정/삭제할 수 있음
- DB에 반영됨
- 리스트에 즉시 보임

### 체크리스트
- [x] CostsScreen 리스트 구현
- [x] Add Cost Item UI 구현
- [x] Edit Cost Item UI 구현
- [x] createFeeItem 연결
- [x] updateFeeItem 연결
- [x] delete/deactivate 연결
- [x] 빈 상태 UI 구현

---

## 11.6 Visits CRUD 구현

### 범위
- Visits 화면 리스트
- Add/Edit Visit 모달
- delete/cancel 처리
- active visit 조회 기반

### 입력 필드
- date
- started_at
- ended_at
- gym_id
- notes

### MVP 단순화
- duration 직접 입력 없음
- started_at / ended_at 기반 자동 계산

### 완료 기준
- 사용자가 수동 방문을 추가/수정/삭제할 수 있음
- DB에 저장됨
- 리스트에 보임

### 체크리스트
- [ ] VisitsScreen 리스트 구현
- [ ] Add Visit UI 구현
- [ ] Edit Visit UI 구현
- [ ] createVisit 연결
- [ ] updateVisit 연결
- [ ] delete/cancelVisit 연결
- [ ] active visit query 연결
- [ ] 빈 상태 UI 구현

---

## 11.7 최소 공통 UI 컴포넌트

Phase 1에서 필요한 공통 컴포넌트는 너무 많을 필요 없다.

### 우선 필요한 것
- `ScreenContainer`
- `SectionHeader`
- `PrimaryButton`
- `SecondaryButton`
- `FormField`
- `EmptyState`
- `SimpleListItem`
- `Card`

### 완료 기준
- 3개 주요 화면(Visits, Costs, Settings/Gym Setup)에 중복 없이 재사용 가능

### 체크리스트
- [ ] ScreenContainer
- [ ] Buttons
- [ ] Input wrappers
- [ ] EmptyState
- [ ] Card
- [ ] list item component

---

## 11.8 Settings 최소 구현

### 범위
Phase 1에서는 Settings를 풀로 만들 필요는 없고, 아래만 있으면 충분하다.
- currency
- locale
- default GST
- default PST

### 완료 기준
- settings row를 생성/업데이트 가능
- fee item tax 상속의 기반이 생김

### 체크리스트
- [ ] Settings form 최소 구현
- [ ] getSettings 연결
- [ ] upsertSettings 연결

---

## 12. Phase 1 완료 산출물 요약

Phase 1 종료 시 아래가 가능해야 한다.

### 사용자가 할 수 있는 것
- gym 등록/수정
- 비용 항목 추가/수정/삭제
- 방문 수동 추가/수정/삭제
- 앱 재실행 후 데이터 유지

### 시스템이 보장해야 하는 것
- 잘못된 시간 입력 차단
- 잘못된 비용 입력 차단
- primary gym 개념 유지
- active visit query 가능

### 아직 없어도 되는 것
- cost per visit 홈 KPI 완성
- 위치 기반 자동화
- 알림 액션
- geofence

---

## 13. Phase 0 / 1 구현 순서 제안

가장 추천하는 작업 순서는 아래다.

### Step 1
- bootstrap
- navigation
- theme

### Step 2
- db client
- migration
- repositories scaffold

### Step 3
- domain models / form types / validation

### Step 4
- Gym Setup 구현

### Step 5
- Costs CRUD 구현

### Step 6
- Visits CRUD 구현

### Step 7
- basic empty states / toasts / save feedback

이 순서가 좋은 이유는, gym → fee → visit 순서가 제품 데이터 구조와도 자연스럽게 맞기 때문이다.

---

## 14. 권장 Git / 작업 단위 분리

가능하면 아래처럼 PR 또는 작업 단위를 나누는 것이 좋다.

### PR 1
- bootstrap + navigation + theme

### PR 2
- SQLite + migrations + repository scaffolds

### PR 3
- domain models + validation

### PR 4
- Gym Setup

### PR 5
- Costs CRUD

### PR 6
- Visits CRUD

### PR 7
- Phase 1 cleanup / empty states / polish

이렇게 나누면 디버깅과 회귀 확인이 쉬워진다.

---

## 15. Phase 0 체크리스트 (통합)

세부 상태와 수용 기준은 `IMPLEMENTATION_CHECKLIST_v0.1.md`를 기준으로 본다. 아래는 Phase 0의 요약 task ID다.

- [x] `FND-01` App shell entry와 `src` 루트 생성
- [x] `FND-02` Navigation shell과 4개 탭 구성
- [x] `FND-03` AppProviders, theme, 공통 UI 베이스
- [x] `DB-01` SQLite dependency와 DB client bootstrap
- [x] `DB-02` Migration runner와 `001_initial_schema`
- [x] `DB-03` Settings bootstrap과 DB readiness logging

---

## 16. Phase 1 체크리스트 (통합)

세부 상태와 수용 기준은 `IMPLEMENTATION_CHECKLIST_v0.1.md`를 기준으로 본다. 아래는 Phase 1의 요약 task ID다.

- [x] `DOM-01` Domain enums/models와 상수 정의
- [x] `DOM-02` Form value types와 validation utilities
- [x] `GYM-01` Gym Setup form shell과 primary gym 조회
- [x] `GYM-02` Gym persistence와 edit flow
- [x] `COST-01` Costs list와 empty state
- [x] `COST-02` Add/Edit Cost Item form
- [x] `COST-03` Inactive/delete flow와 list refresh
- [ ] `VISIT-01` Visits list와 empty state
- [ ] `VISIT-02` Add/Edit Visit form과 duration derivation
- [ ] `VISIT-03` Cancel flow, duplicate active guard, list refresh
- [ ] `SET-01` Minimal settings screen과 upsert

---

## 17. Phase 0 완료 기준

아래 조건을 만족하면 Phase 0 완료로 본다.

### 기능 기준
- 앱이 Android/iOS에서 실행된다.
- 4개 탭 구조가 뜬다.
- DB가 열린다.
- migration이 수행된다.

### 기술 기준
- 코드 구조가 이후 CRUD 구현을 시작할 수 있을 정도로 정리되어 있다.
- native dependency 세팅이 안정적이다.

### QA 기준
- 첫 실행/재실행 모두 crash 없이 동작
- DB 초기화 로그 정상

---

## 18. Phase 1 완료 기준

아래 조건을 만족하면 Phase 1 완료로 본다.

### 기능 기준
- gym 등록/수정 가능
- fee item CRUD 가능
- visit CRUD 가능
- settings 최소 저장 가능

### 데이터 기준
- 입력 데이터가 SQLite에 정상 저장됨
- 앱 재시작 후 조회 가능
- validation 규칙이 적용됨

### UX 기준
- 사용자는 위치 권한 없이도 app의 핵심 데이터를 쌓을 수 있다.
- empty state가 최소 수준으로 동작한다.

### QA 기준
- manual add/edit/delete 흐름이 안정적
- invalid input 저장 차단
- DB와 리스트 화면 간 불일치 없음

---

## 19. QA 시나리오 (Phase 0 / 1 전용)

## 19.1 Gym Setup QA
- gym이 없는 상태에서 등록 가능한가
- 저장 후 다시 열었을 때 값이 유지되는가
- radius validation이 동작하는가

## 19.2 Cost Item QA
- monthly item 추가 가능
- annual item 추가 가능
- one-time item 추가 가능
- edit 후 값이 즉시 반영되는가
- delete/inactive 처리 후 리스트 반영이 맞는가

## 19.3 Visit QA
- 시작/종료 시간 입력 후 저장 가능
- 종료가 시작보다 빠르면 저장 차단되는가
- edit 후 duration 재계산이 맞는가
- delete 후 리스트가 갱신되는가

## 19.4 Persistence QA
- 앱 재시작 후 데이터가 유지되는가
- migration 후 앱이 깨지지 않는가

---

## 20. 현재 단계에서 의도적으로 미루는 것

아래 항목은 지금 단계에서 일부러 하지 않는다.

- Home KPI 완성
- cost per visit 계산 UI
- location permission 흐름
- notification permission 흐름
- geofence 등록
- active visit timer UI
- prompt/recovery UX

이 항목들은 **Phase 2 이후로 미루는 것이 맞다.**

---

## 21. 구현 중 주의사항

### 21.1 DB schema를 너무 자주 흔들지 말 것
Phase 0 / 1에서는 schema를 빨리 안정화해야 한다.

### 21.2 화면보다 repository 신뢰성을 우선할 것
화면은 나중에 바꿀 수 있지만, CRUD와 validation은 일찍 안정화해야 한다.

### 21.3 임시 mock state에 너무 의존하지 말 것
가능한 빨리 실제 DB 연결로 가야 한다.

### 21.4 Visit time 처리 규칙 일관성 유지
started_at / ended_at / duration_minutes 계산 규칙이 화면마다 달라지면 안 된다.

---

## 22. 개발 시작 직후 추천 첫 작업 세트

실제로 가장 먼저 시작할 추천 작업 묶음은 아래다.

### 작업 세트 A
- RN CLI bootstrap
- navigation skeleton
- theme skeleton

### 작업 세트 B
- SQLite client
- initial migration
- repository interfaces

### 작업 세트 C
- Gym Setup basic form
- Fee item basic form
- Visit basic form

### 작업 세트 D
- Visits / Costs list 연결
- persistence 확인
- validation cleanup

이 순서로 가면 짧은 시간 안에 “수동 입력 가능한 usable prototype”에 도달할 수 있다.

---

## 23. Phase 0 / 1 이후 바로 이어질 다음 단계

Phase 0 / 1이 끝나면 다음으로는 아래가 자연스럽다.

1. Dashboard calculations 구현
2. Home KPI UI 구현
3. active visit 기본 상태 처리
4. location/notification integration 시작

즉, 다음에 필요하면 아래 companion 문서를 이어 쓸 수 있다(이미 존재하는 것은 재작성이 아니라 갱신).
- Implementation Checklist v0.1
- Phase 2 이후 킥오프 문서(예: Assisted Check-In 중심)
- Repository / Use Case Scaffold (미작성 시)

---

## 24. 최종 요약

이번 Phase 0 / Phase 1 킥오프의 핵심은 아래다.

- 먼저 앱 구조와 DB를 안정화한다.
- 수동 입력 기반 CRUD를 완성한다.
- 위치 기능 없이도 앱의 데이터 핵심이 성립하게 만든다.
- gym / fee / visit를 실제로 쌓을 수 있게 만든다.
- 다음 단계에서 Home KPI와 자동화를 붙일 수 있는 상태를 만든다.

즉, 이 단계의 성공 기준은 “위치 자동화가 된다”가 아니라,

**“앱이 로컬에서 정상적으로 gym / fee / visit 데이터를 쌓고 유지할 수 있다”**

이다.

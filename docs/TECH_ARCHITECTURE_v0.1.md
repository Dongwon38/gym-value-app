# Gym Value App — TECH_ARCHITECTURE v0.1

## 문서 정보
- 문서명: Technical Architecture
- 버전: v0.1
- 상태: Draft
- 상위 문서: Master Plan v0.1, Product Spec v0.1
- 목적: 앱의 기술 구조, 폴더 구성, 핵심 모듈, 데이터 흐름, 라이브러리 선택 기준, 플랫폼 서비스 전략을 정의하는 구현 기준 문서

---

## 1. 문서 목적

이 문서는 Gym Value App의 **기술 아키텍처 기준 문서**다.

이 문서의 목적은 다음과 같다.
- 앱을 어떤 구조로 구현할지 정의한다.
- 어떤 책임을 어떤 계층에 둘지 분리한다.
- 위치/알림/DB/상태 관리가 어떻게 연결되는지 설명한다.
- MVP에 적절한 단순함을 유지하면서도 확장 가능한 구조를 잡는다.
- 이후 데이터 모델 문서와 딜리버리 문서가 이 구조를 기준으로 이어지게 한다.

이 문서는 코드 전체를 대신하는 문서는 아니며, **구현 방향과 설계 원칙을 정리하는 기준 문서**다.

---

## 2. 기술 방향 요약

### 2.1 아키텍처 한 줄 요약

**로컬 우선 React Native 앱으로 구현하고, UI 상태는 Zustand, 정식 데이터 원천은 SQLite, 위치/알림은 서비스 레이어로 분리하는 구조를 사용한다.**

### 2.2 핵심 설계 철학
- **로컬 우선**: 앱의 핵심 기능은 네트워크 없이 동작해야 한다.
- **자동화는 서비스, 진실 데이터는 DB**: 위치 감지와 알림은 제안 기능이고, 최종 방문 기록은 DB에 저장된 visit 레코드다.
- **UI와 계산 분리**: 비용 계산, 방문 집계, 세금 계산은 컴포넌트 밖의 application/data 레이어에서 처리한다.
- **플랫폼 의존성 캡슐화**: 위치, 권한, 알림은 직접 화면에서 다루지 않고 전용 서비스로 감싼다.
- **MVP 단순성 유지**: 다중 gym, sync, analytics, cloud는 구조만 대비하고 구현은 최소화한다.

---

## 3. 기술 스택

### 3.1 앱 프레임워크
- React Native CLI
- TypeScript

선정 이유:
- 네이티브 제어 범위가 넓다.
- 위치/백그라운드/알림 같은 기능을 다룰 때 유연하다.
- Android 우선 + iOS 동시 대응 구조에 적합하다.

### 3.2 내비게이션
- React Navigation

역할:
- bottom tabs
- modal stacks
- deep link 확장 여지

### 3.3 상태 관리
- Zustand

역할:
- UI 전용 상태
- 현재 active visit 캐시
- 권한 상태 캐시
- 필터/정렬 상태
- 홈 화면의 즉시 반응성 유지

원칙:
- 영속적 비즈니스 데이터의 source of truth는 Zustand가 아니라 SQLite다.
- Zustand는 DB 결과를 구독/캐시하는 얇은 계층으로 사용한다.

### 3.4 로컬 데이터베이스
- SQLite
- 우선 검토 라이브러리: `react-native-nitro-sqlite`

역할:
- gym 정보
- visits
- fee items
- location prompts
- settings 일부 또는 전부

선정 이유:
- 로컬 우선 구조에 적합
- 관계형 데이터와 집계 계산에 유리
- 기간별 통계, 비용 집계, 활성 항목 조회에 자연스러움

### 3.5 알림
- Notifee

역할:
- local notification 표시
- notification action 처리
- check-in / check-out 제안 액션 관리

### 3.6 위치 / geofence
- Background Geolocation 계열 라이브러리
- 구현 시점에는 iOS/Android 동작 안정성과 유지보수성을 기준으로 최종 확정

역할:
- gym 진입 감지
- gym 이탈 감지
- location prompt 생성
- 알림 트리거

### 3.7 날짜/시간 처리
- dayjs

역할:
- 날짜 formatting
- duration 계산
- year/month 필터
- timezone-aware display 준비

### 3.8 Monorepo / workspace (선택)

앱은 단일 React Native 패키지로 두어도 되고, 저장소 루트에 **`apps/mobile`** 같이 워크스페이스를 두는 **monorepo**로 운영해도 된다. 후자의 경우 npm/yarn/pnpm workspaces에 따라 `node_modules`가 루트에 호이스트될 수 있어, **Metro(`watchFolders`, `nodeModulesPaths`)** 와 **Android Gradle(`settings.gradle` / 앱 `build.gradle`의 react 블록)** 에서 루트 경로를 인지하도록 맞출 필요가 있다. 이는 **번들·빌드 경로 문제**이며, 본 문서의 계층 구조·SQLite·서비스 레이어 분리 원칙은 그대로 유효하다.

---

## 4. 전체 아키텍처 개요

앱 구조는 다음 4계층을 기본으로 한다.

1. Presentation Layer
2. Application Layer
3. Data Layer
4. Platform Services Layer

---

## 5. 계층별 책임

## 5.1 Presentation Layer

포함 요소:
- screens
- navigation
- reusable UI components
- modal/sheet views
- local UI hooks

책임:
- 사용자 입력 받기
- 상태 표시
- 버튼 클릭 처리
- view model을 화면에 렌더링

하지 말아야 할 일:
- SQL 직접 실행
- 세금/비용/방문 계산 로직 직접 구현
- 권한 로직의 복잡한 분기 직접 처리
- 위치 SDK 직접 호출

원칙:
- 화면은 가능한 한 “무슨 일이 일어나야 하는지”만 요청하고, “어떻게 처리되는지”는 아래 레이어에 위임한다.

---

## 5.2 Application Layer

포함 요소:
- use cases
- domain-like service functions
- orchestrators
- selector/aggregation helpers

책임:
- 체크인 시작 use case
- 체크아웃 종료 use case
- 수동 방문 추가 use case
- 방문 수정/삭제 use case
- 비용 항목 추가/수정/비활성화 use case
- 홈 통계 구성용 aggregation
- 누락 복구 제안 판단

예시 use case:
- `startVisitFromPrompt()`
- `addManualVisit()`
- `completeActiveVisit()`
- `recalculateHomeMetrics()`
- `getCurrentYearDashboardStats()`

원칙:
- UI 컴포넌트가 직접 repository를 여러 개 조합하지 않게 한다.
- 기능 단위 흐름을 application layer에서 묶는다.

---

## 5.3 Data Layer

포함 요소:
- database client
- repositories
- SQL queries
- mappers
- transaction helpers

책임:
- CRUD 처리
- raw row ↔ app model 변환
- 집계 쿼리 수행
- 활성 비용 조회
- year/month 기간 기준 query

예시 repository:
- `GymRepository`
- `VisitRepository`
- `FeeItemRepository`
- `LocationPromptRepository`
- `SettingsRepository`

원칙:
- DB schema 변화는 이 계층에 국한되도록 한다.
- raw SQL은 repository 내부에만 둔다.
- 화면은 SQL을 몰라도 된다.

---

## 5.4 Platform Services Layer

포함 요소:
- location service
- notification service
- permission service
- app lifecycle service

책임:
- 위치 권한 상태 읽기/요청
- geofence 등록/해제
- 진입/이탈 이벤트 수신
- local notification 발송
- notification action 핸들링
- 앱 foreground/background 상태에 따른 처리 조정

원칙:
- 외부 SDK 의존성은 이 계층에 가둔다.
- 나중에 라이브러리를 교체해도 application layer를 크게 흔들지 않게 한다.

---

## 6. 제안 폴더 구조

현재 저장소는 **npm workspaces 기반 monorepo**를 전제로 해도 되고, React Native 앱은 **`apps/mobile`** 같은 워크스페이스 패키지 안에 둔다. 아래에서 **`src/` 이하**는 모두 **해당 모바일 패키지 루트**(예: `apps/mobile/src/`)를 가리킨다. 저장소 루트에는 워크스페이스용 `package.json`만 있고, `android/`·`ios/`·`metro.config.js` 등은 **`apps/mobile/`** 에 둔다. 향후 공유 TS 모듈이 생기면 저장소 루트의 `packages/*`에 둘 수 있으나, MVP에서는 비워 두어도 된다.

```text
<repo-root>/
  package.json
  apps/
    mobile/
      package.json
      index.js
      App.tsx
      metro.config.js
      android/
      ios/
      src/
        app/
          navigation/
            RootNavigator.tsx
            TabNavigator.tsx
            modalRoutes.ts
          providers/
            AppProviders.tsx

        screens/
          home/
            HomeScreen.tsx
            components/
          visits/
            VisitsScreen.tsx
            components/
          costs/
            CostsScreen.tsx
            components/
          settings/
            SettingsScreen.tsx
            components/

        features/
          visits/
            components/
            hooks/
            useCases/
            selectors/
            types.ts
          costs/
            components/
            hooks/
            useCases/
            selectors/
            types.ts
          gym/
            components/
            hooks/
            useCases/
            selectors/
            types.ts
          dashboard/
            hooks/
            selectors/
            types.ts

        services/
          location/
            LocationService.ts
            locationTypes.ts
            locationMapper.ts
          notifications/
            NotificationService.ts
            notificationTypes.ts
          permissions/
            PermissionService.ts
            permissionTypes.ts
          lifecycle/
            AppLifecycleService.ts

        data/
          db/
            client.ts
            migrations/
            schema/
            seeds/
          repositories/
            GymRepository.ts
            VisitRepository.ts
            FeeItemRepository.ts
            LocationPromptRepository.ts
            SettingsRepository.ts
          queries/
            dashboardQueries.ts
            visitQueries.ts
            feeQueries.ts
          mappers/
            visitMapper.ts
            feeMapper.ts

        state/
          appStore.ts
          uiStore.ts
          sessionStore.ts
          filtersStore.ts

        domain/
          calculations/
            costPerVisit.ts
            costPerHour.ts
            totalPaid.ts
            taxCalculator.ts
            durationUtils.ts
          constants/
            defaults.ts
            limits.ts
          models/
            Visit.ts
            FeeItem.ts
            Gym.ts
            DashboardStats.ts

        utils/
          date/
          currency/
          logging/
          validation/
          ids/

        ui/
          components/
          theme/
          icons/
          layout/

        types/
          common.ts
          api.ts
          navigation.ts

  packages/
    (optional — 향후 공유 코드용)
```

### 6.1 구조 원칙
- **모노레포:** 앱 소스·네이티브 프로젝트·Metro 설정은 `apps/mobile/`에 한곳에 모은다. 문서의 레이어(`screens` / `features` / `data` …)는 **`apps/mobile/src/`** 기준으로 유지한다.
- `screens`는 화면 렌더링 중심
- `features`는 기능 단위 조립
- `services`는 플랫폼/SDK 래퍼
- `data`는 영속 계층
- `domain`은 계산/모델/순수 로직
- `state`는 화면과 앱 세션용 얇은 저장소

---

## 7. Navigation 구조

### 7.1 기본 구조
- Root Stack Navigator
  - Main Tabs
  - Add/Edit Visit Modal
  - Add/Edit Cost Modal
  - Gym Setup Modal
  - Permission Education Modal

### 7.2 Main Tabs
- Home
- Visits
- Costs
- Settings

### 7.3 Navigation 원칙
- 자주 쓰는 화면은 tab으로 고정
- 생성/수정 플로우는 modal 중심
- 화면 전환보다 빠른 입력 경험을 우선

---

## 8. 상태 관리 전략

## 8.1 Zustand 사용 목적
Zustand는 앱의 “활성 상태”와 “UI 상태”를 빠르게 다루는 데 사용한다.

예시:
- 현재 active visit id
- 홈 화면 필터 (year/month)
- modal open/close 상태
- 위치 권한 상태 캐시
- notification permission 상태
- 최근 계산 결과 캐시

### 8.2 SQLite와의 역할 분리
- SQLite: 정식 영속 데이터 원천
- Zustand: 화면 반응성/세션 캐시/가벼운 derived state

### 8.3 권장 store 분리
- `appStore`
  - app ready
  - onboarding state
  - app-level flags

- `sessionStore`
  - active visit id
  - active visit elapsed timer state
  - last prompt info

- `filtersStore`
  - current year/month filter
  - visits sort order

- `uiStore`
  - modal visibility
  - snackbars
  - loading states

### 8.4 피해야 할 패턴
- 전체 visits 배열을 영구적으로 Zustand만 믿고 관리
- DB와 store가 서로 다른 source of truth가 되는 구조
- 계산값을 여러 store에 중복 저장하는 구조

---

## 9. 데이터 흐름

## 9.1 정상 체크인 흐름
1. platform location service가 geofence enter 감지
2. application layer가 `location prompt` 생성
3. notification service가 check-in 알림 표시
4. 사용자가 `Check In` action 탭
5. application layer의 `startVisitFromPrompt()` 실행
6. visit record 생성 (`active`)
7. session store에 active visit 반영
8. home/visits 화면이 DB 재조회 또는 invalidate 후 갱신

## 9.2 수동 방문 추가 흐름
1. 사용자가 Add Visit modal 진입
2. 날짜/시간 입력
3. application layer의 `addManualVisit()` 실행
4. validation 수행
5. DB insert
6. dashboard stats 재계산
7. 화면 갱신

## 9.3 종료 흐름
1. 사용자가 End Visit 탭 또는 종료 제안 알림 수락
2. `completeActiveVisit()` 실행
3. endedAt 기록
4. duration 계산
5. visit 상태를 `completed`로 변경
6. home stats 재계산
7. session store clear

## 9.4 방문 수정 흐름
1. 사용자가 방문 편집
2. `updateVisit()` 실행
3. 시작/종료 시간 validation
4. duration 재계산
5. DB update
6. 관련 통계 invalidate
7. 홈/리스트 갱신

---

## 10. 모듈별 역할 상세

## 10.1 Visit Module

책임:
- active visit 생성
- 수동 방문 생성
- 방문 수정/삭제
- duration 계산
- 상태 전환(active → completed)

핵심 함수 예시:
- `startVisit()`
- `startVisitFromPrompt()`
- `addManualVisit()`
- `completeVisit()`
- `updateVisit()`
- `deleteVisit()`
- `getVisitList()`

## 10.2 Cost Module

책임:
- 비용 항목 CRUD
- 활성 비용 판정
- 현재 기간 기준 총 비용 집계
- 세금 적용 총액 계산

핵심 함수 예시:
- `createFeeItem()`
- `updateFeeItem()`
- `deactivateFeeItem()`
- `getActiveFeeItemsForRange()`
- `calculateTotalPaidForRange()`

## 10.3 Dashboard Module

책임:
- 홈 KPI 조립
- 방문당 비용/시간당 비용 계산
- this year / this month stats 구성
- empty state 조건 판단

핵심 함수 예시:
- `getCurrentYearDashboardStats()`
- `getHomePrimaryMetric()`
- `getSecondaryMetrics()`

## 10.4 Gym Module

책임:
- gym CRUD (MVP는 1개 중심)
- primary gym 조회
- 반경/좌표 수정
- geofence 동기화 트리거

핵심 함수 예시:
- `createGym()`
- `updateGym()`
- `getPrimaryGym()`
- `syncGeofenceForPrimaryGym()`

---

## 11. Platform Service 설계

## 11.1 PermissionService

책임:
- 위치 권한 요청
- 알림 권한 요청
- background permission 상태 조회
- 권한 상태 정규화

예시 API:
```ts
export interface PermissionService {
  getLocationStatus(): Promise<PermissionStatus>
  requestLocationPermission(): Promise<PermissionStatus>
  getNotificationStatus(): Promise<PermissionStatus>
  requestNotificationPermission(): Promise<PermissionStatus>
}
```

원칙:
- 플랫폼별 세부 상태를 앱 공통 enum으로 매핑한다.
- 화면은 platform-specific raw status를 몰라도 된다.

## 11.2 LocationService

책임:
- gym geofence 등록
- geofence 제거
- 현재 위치 가져오기
- geofence 진입/이탈 이벤트 subscribe

예시 API:
```ts
export interface LocationService {
  initialize(): Promise<void>
  registerGymGeofence(input: GymGeofenceInput): Promise<void>
  removeGymGeofence(gymId: string): Promise<void>
  getCurrentPosition(): Promise<CurrentPositionResult>
  onGeofenceEvent(handler: (event: GeofenceEvent) => void): Unsubscribe
}
```

원칙:
- 외부 SDK의 raw event를 앱 친화적 event로 변환한다.
- geofence enter/exit만 앱에 노출하고 나머지 세부 정보는 내부 처리한다.

## 11.3 NotificationService

책임:
- 로컬 알림 표시
- check-in / check-out action 등록
- action press 이벤트 전달

예시 API:
```ts
export interface NotificationService {
  showCheckInSuggestion(input: CheckInNotificationInput): Promise<void>
  showCheckOutSuggestion(input: CheckOutNotificationInput): Promise<void>
  cancelByTag(tag: string): Promise<void>
  onActionPress(handler: (event: NotificationActionEvent) => void): Unsubscribe
}
```

## 11.4 AppLifecycleService

책임:
- app foreground/background 상태 감지
- 재개 시 active visit 복구
- 장시간 active visit 상태 점검

---

## 12. DB 접근 전략

## 12.1 Repository 패턴 사용 이유
Repository를 두는 이유는 다음과 같다.
- raw SQL을 UI와 분리
- 테스트 가능성 향상
- 데이터 소스 교체 가능성 확보
- query 재사용성 향상

### 12.2 Repository 설계 원칙
- 하나의 repository는 하나의 aggregate/엔티티 중심
- cross-table aggregation은 전용 query object 또는 dashboard query 파일로 분리
- transaction이 필요한 use case는 application layer에서 묶거나 repository helper 사용

### 12.3 Migration 전략
- DB schema는 migration 기반 관리
- 앱 버전과 DB schema version을 분리 관리 가능하게 설계
- destructive change는 피하고 additive migration 우선

### 12.4 Seed 데이터
개발 편의를 위해 optional seed를 제공할 수 있다.
예:
- demo gym
- sample fee items
- sample visits

단, production build에는 기본 비활성화

---

## 13. 계산 로직 배치 전략

### 13.1 계산은 domain/calculations 아래로 배치
예:
- `costPerVisit.ts`
- `costPerHour.ts`
- `totalPaid.ts`
- `taxCalculator.ts`
- `durationUtils.ts`

### 13.2 이유
- 재사용이 쉽다.
- 테스트가 쉽다.
- 화면에서 중복 계산을 피할 수 있다.
- 향후 widget/export/sync 시에도 동일 계산을 재사용 가능하다.

### 13.3 원칙
- 계산 함수는 가능한 순수 함수로 작성
- side effect 없음
- UI formatting과 계산을 분리

예:
- 계산 함수는 `5.75` 반환
- 화면 또는 formatter가 `$5.75 / visit` 문자열 생성

---

## 14. 타입 설계 원칙

### 14.1 구분해야 할 타입
- DB row type
- app model type
- form input type
- computed view model type

### 14.2 예시
- `VisitRow`
- `Visit`
- `VisitFormValues`
- `VisitListItemVM`
- `DashboardStats`

### 14.3 원칙
- DB row를 화면에 직접 전달하지 않는다.
- 화면 전용 데이터는 selector 또는 mapper에서 조립한다.

---

## 15. Form 처리 전략

MVP에서는 아래 중 한 가지를 선택할 수 있다.
- React Hook Form 사용
- 단순 local state로 구현

권장:
- Add/Edit Visit
- Add/Edit Cost Item
- Gym Setup

이 세 form은 검증 규칙과 재사용성이 있으므로 form library 사용이 유리하다.

원칙:
- form validation은 화면과 분리 가능한 utility/helper로 정리
- 시간 입력, 날짜 입력은 platform UX를 고려한 컴포넌트 래퍼 사용 가능

---

## 16. 캐싱 / invalidation 전략

### 16.1 기본 원칙
- write 후 관련 조회 캐시는 무효화
- 복잡한 글로벌 캐시보다 단순 재조회 전략 우선

### 16.2 예시
- visit 추가/수정/삭제 후
  - dashboard invalidate
  - visit list invalidate

- fee item 수정 후
  - dashboard invalidate
  - cost list invalidate

### 16.3 MVP 권장 방식
MVP에서는 별도 query cache 시스템 없이,
- repository 재호출
- selector 재계산
- Zustand minimal refresh

구조로도 충분하다.

향후 필요 시 TanStack Query 같은 계층을 검토할 수 있으나, 초기에는 과할 수 있다.

---

## 17. Timer / active visit 표시 전략

### 17.1 목적
active visit가 있을 때 Home에서 경과 시간을 실시간에 가깝게 보여준다.

### 17.2 원칙
- DB를 매초 업데이트하지 않는다.
- DB에는 startedAt만 저장
- 화면에서는 session store + timer로 elapsed 계산
- 종료 시점에만 최종 duration 저장

### 17.3 장점
- DB write 감소
- 구현 단순성
- UI 반응성 향상

---

## 18. Background / lifecycle 전략

### 18.1 앱이 백그라운드로 갈 때
- active visit 상태는 DB에 이미 있으므로 안전
- session store는 복구 가능 구조여야 함

### 18.2 앱 재실행 시
- active visit 존재 여부 조회
- 있으면 session 복구
- 비정상 장기 active visit면 검토 prompt 노출

### 18.3 위치 이벤트 수신 시
- 앱이 foreground가 아니더라도 prompt 기록 생성 가능하게 설계
- 실제 visit 확정은 사용자 action 기반으로 유지

---

## 19. 오류 처리 전략

### 19.1 레이어별 오류 처리
- Platform service: raw error 수집 및 정규화
- Application layer: 사용자 의미가 있는 실패로 변환
- UI: 행동 가능한 메시지 표시

### 19.2 예시
raw error:
- location unavailable
- permission denied
- db write failed

UI 메시지 예:
- `Couldn’t start location tracking.`
- `You can still add visits manually.`
- `We couldn’t save your visit. Please try again.`

### 19.3 원칙
- 기술적 stack trace를 사용자에게 노출하지 않음
- fallback action을 함께 제공

---

## 20. 로깅 / 디버깅 전략

### 20.1 MVP 로깅 범위
- geofence enter/exit 수신 여부
- check-in action 처리 결과
- visit create/update/delete 결과
- cost calculation summary
- migration success/failure

### 20.2 로깅 원칙
- 개발 환경에서만 verbose logging
- production에서는 최소화
- 개인정보/정밀 위치 정보는 과도하게 로그에 남기지 않음

---

## 21. 테스트 전략 개요

### 21.1 우선 테스트 대상
- cost calculation 함수
- duration 계산 함수
- visit validation
- active visit 중복 방지
- tax 계산 함수
- dashboard stats selector

### 21.2 테스트 레벨
- unit tests: calculation, validation, mapper
- integration-like tests: repository + use case 조합
- manual QA: geofence, notifications, permissions, lifecycle

### 21.3 테스트 원칙
- 순수 계산 로직은 자동 테스트 우선
- 플랫폼 의존 기능은 manual QA 비중이 높음
- DB migration은 적어도 smoke test 필요

---

## 22. 보안 / 개인정보 최소화 원칙

### 22.1 저장 원칙
- 현재 앱은 개인 단말 로컬 저장이 기본
- 계정/서버 없이 동작
- 정밀 위치 기록을 불필요하게 장기 저장하지 않음

### 22.2 위치 데이터 정책
- gym 좌표와 geofence 반경은 저장
- 방문 확정 자체는 시간 기록 중심
- raw location trace를 계속 저장하는 구조는 MVP에서 채택하지 않음

### 22.3 이유
- 단순함 유지
- 프라이버시 부담 최소화
- 디버깅 복잡도 감소

---

## 23. 확장성 고려

### 23.1 Multi-gym 확장
현재는 primary gym 1개지만, 구조는 아래를 고려한다.
- visits가 `gymId`를 가진다
- fee items가 `gymId`를 가진다
- geofence 등록 로직이 복수 gym 대응 가능 인터페이스를 가진다

### 23.2 Cloud sync 확장
향후 sync를 붙일 경우:
- repository interface 유지
- local DB를 source of truth로 유지한 뒤 sync engine 추가
- conflict resolution 정책은 별도 설계

### 23.3 Widget / summary cards 확장
- dashboard calculation 함수 재사용 가능 구조 유지
- view model 분리로 widget 지원 여지 확보

---

## 24. MVP 구현 우선순위 관점에서의 단순화 규칙

### 반드시 단순하게 유지할 것
- 단일 사용자
- 단일 기기 기준
- 단일 primary gym
- local-first only
- simple filters
- lightweight modal-based forms

### 나중에 미룰 것
- sync
- auth
- cloud backup
- complex analytics
- advanced reporting
- shared routines
- social features

---

## 25. 권장 구현 순서 (기술 관점)

### Step 1
- project bootstrap
- navigation
- theme
- DB client
- migration base

### Step 2
- repositories
- domain calculations
- visit/cost/gym basic CRUD

### Step 3
- Home stats assembly
- active visit state
- manual add/edit/delete UX

### Step 4
- permissions service
- notification service
- location service stub / interface

### Step 5
- real geofence integration
- check-in prompt
- check-out prompt
- recovery flows

### Step 6
- lifecycle polish
- validation hardening
- QA / release prep

---

## 26. 이 문서의 결정 사항 요약

- 앱은 React Native CLI + TypeScript 기반으로 구현한다.
- UI 상태는 Zustand, 영속 데이터는 SQLite를 사용한다.
- 위치/알림/권한은 platform service로 분리한다.
- 화면은 use case를 호출하고, 계산/SQL/SDK 세부 구현은 아래 레이어로 위임한다.
- 폴더 구조는 screens / features / services / data / domain / state 중심으로 구성한다.
- active visit 경과 시간은 UI timer로 처리하고, DB에는 시작/종료 기준으로만 기록한다.
- raw location history 저장은 MVP에서 하지 않는다.
- multi-gym, sync, widget 등은 구조만 열어두고 구현은 뒤로 미룬다.

---

## 27. 관련 문서

- **`DATA_MODEL_AND_CALCULATION_v0.1.md`** — SQLite schema, 테이블 관계, 비용·세금·KPI 계산 규칙의 단일 기준. 본 문서의 레이어·repository 역할과 함께 읽는다.


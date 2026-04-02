# Gym Value App — Manual MVP QA Report v0.1

## 문서 정보
- 문서명: Manual MVP QA Report
- 버전: v0.1
- 상태: Active
- 작성 기준일: 2026-04-02
- 기준 타임존: America/Vancouver
- 관련 문서:
  - `IMPLEMENTATION_CHECKLIST_v0.1.md`
  - `DELIVERY_PLAN_v0.1.md`
  - `PHASE_0_1_IMPLEMENTATION_KICKOFF_v0.1.md`

---

## 1. 결과 요약

이번 QA pass는 **workspace automation scope 기준 pass**로 기록한다.

확인한 범위:
- manual gym setup
- fee item create / update / inactive
- visit create / update / cancel / active guard
- settings upsert
- current year dashboard calculation
- Home empty state / KPI state / retry state

실행한 검증:
- `npm run lint -w apps/mobile`
- `npm run test -w apps/mobile -- --watchAll=false --watchman=false`

결과:
- lint 통과
- Jest 26 suites / 79 tests 통과

---

## 2. Manual MVP Exit 판정

### 판정
- `Manual MVP Exit`: pass

### 근거
- `GYM-01`, `GYM-02`, `COST-01`, `COST-02`, `COST-03`, `VISIT-01`, `VISIT-02`, `VISIT-03`, `SET-01` 구현 완료
- DB bootstrap, migration, default settings seed가 자동 테스트로 고정됨
- soft delete 정책이 row-level test와 screen-level test로 고정됨
- duplicate active visit guard가 validation + save path test로 고정됨
- current year KPI 계산이 domain calculation test로 고정됨

---

## 3. KPI MVP Exit 판정

### 판정
- `KPI MVP Exit`: pass

### 근거
- `KPI-01`, `KPI-02`, `KPI-03`, `KPI-04` 구현 완료
- Home이 `current year` 기준 `cost per visit`를 메인 KPI로 렌더링함
- `null` 과 `0` 구분이 dashboard stats 조립과 Home empty state로 분리됨
- 비용 없음 / 방문 없음 / active visit 존재 / 연도 경계 계산 시나리오가 테스트로 고정됨

---

## 4. 커버리지 매핑

### 4.1 Gym setup
- `src/features/gym/useCases/primaryGym.test.ts`
- `src/features/gym/useCases/savePrimaryGym.test.ts`
- `src/data/repositories/GymRepository.test.ts`

검증 내용:
- primary gym read path
- create / update persistence
- single primary 유지

### 4.2 Costs
- `src/data/repositories/FeeItemRepository.test.ts`
- `src/features/costs/useCases/saveCostItem.test.ts`
- `src/features/costs/useCases/deactivateCostItem.test.ts`
- `src/features/costs/hooks/useCostItems.test.tsx`
- `src/screens/costs/CostsScreen.test.tsx`

검증 내용:
- monthly / annual / one-time 저장
- custom tax override 저장
- inactive policy
- empty/list/inactive history UI

### 4.3 Visits
- `src/data/repositories/VisitRepository.test.ts`
- `src/features/visits/useCases/saveVisit.test.ts`
- `src/features/visits/useCases/cancelVisit.test.ts`
- `src/features/visits/hooks/useVisits.test.tsx`
- `src/screens/visits/VisitsScreen.test.tsx`

검증 내용:
- completed / active visit 저장
- duration derivation
- cancel policy
- duplicate active visit guard
- empty/list/active summary UI

### 4.4 Settings
- `src/data/repositories/SettingsRepository.test.ts`
- `src/features/settings/useCases/saveAppSettings.test.ts`
- `src/features/settings/hooks/useAppSettingsForm.test.tsx`

검증 내용:
- default row load
- settings upsert
- currency / locale / GST / PST validation

### 4.5 Dashboard calculations
- `src/domain/calculations/fees.test.ts`
- `src/domain/calculations/dashboard.test.ts`
- `src/features/home/useCases/dashboard.test.ts`

검증 내용:
- tax resolution
- monthly / annual / one-time occurrence expansion
- current year total paid
- visits / duration / active visit / year boundary stats assembly

### 4.6 Home UI
- `src/features/home/hooks/useHomeDashboard.test.tsx`
- `src/screens/home/HomeScreen.test.tsx`
- `__tests__/App.test.tsx`

검증 내용:
- loading / error / retry
- gym empty state
- cost empty state
- visit empty state
- populated KPI cards
- latest visit surface

---

## 5. 남은 리스크

아래는 이번 workspace automation pass에 포함되지 않았다.
- 실제 simulator / device 에서의 native runtime smoke
- 실제 SQLite 파일을 유지한 상태에서 앱 종료 후 재실행 검증
- Android / iOS 개별 수동 탐색 QA

이 항목들은 **release-ready QA** 관점의 후속 확인으로 남긴다.

---

## 6. 결론

현재 저장소 기준으로는:
- manual-only MVP 기능 범위가 구현되었고
- 계산 정책이 테스트로 잠겼으며
- Home KPI surface 까지 연결되었다.

따라서 **v0.1 Manual MVP + KPI MVP는 workspace automation scope 에서 통과**로 기록한다.

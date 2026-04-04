# Gym Value App — Cost Setup QA v0.1

## 문서 정보
- 문서명: Cost Setup QA
- 버전: v0.1
- 상태: Active
- 작성 기준일: 2026-04-03
- 기준 타임존: America/Vancouver
- 관련 문서:
  - `POST_MVP_LOCAL_EXPANSION_PLAN_v0.1.md`
  - `PRODUCT_SPEC_v0.1.md`
  - `DATA_MODEL_AND_CALCULATION_v0.1.md`

---

## 1. Scope

이번 QA pass는 post-MVP local expansion의 Cost block 중 아래 범위를 검증한다.

- `LXP-COST-04` starter cost setup UI
- `LXP-COST-05` existing row hydrate / inactive history restore / regression QA
- Workspace automation scope 기준 검증만 포함

---

## 2. 결과 요약

실행한 검증:
- `npm run lint -w apps/mobile`
- `npm run test -w apps/mobile -- --watchAll=false --watchman=false`

결과:
- lint 통과
- Jest 37 suites / 114 tests 통과

판정:
- `LXP-COST-04`: pass
- `LXP-COST-05`: pass

---

## 3. 확인한 제품 동작

### 3.1 Starter lines
- Costs 화면 진입 시 `Membership`, `Signup fee`, `Annual fee`, `Locker fee` starter line이 항상 렌더링된다.
- 각 line은 compact row 구조에서 cadence, `pre-tax / post-tax / no-tax / custom` 입력 모드, amount 입력을 가진다.
- 금액이 비어 있는 starter line은 그대로 둘 수 있고, save 시 row를 만들지 않는다.

### 3.2 Saved row hydrate
- active saved row는 matching starter line 또는 custom line으로 hydrate된다.
- hydrate된 line은 기존 `fee_items.id`와 `sort_order`를 유지한 채 update path로 저장된다.

### 3.3 Inactive history restore
- inactive row는 history 영역에 남는다.
- history row의 `Restore to setup` 액션은 해당 row를 draft로 복원한다.
- starter category는 matching starter line으로 복원된다.
- custom row는 custom line collection으로 복원된다.
- 복원 후 save 하면 existing row update path로 재활성화된다.

### 3.4 Inactive 유지
- active saved line을 `Skip`으로 바꾸거나 금액을 비우고 save 하면 row는 inactive 처리된다.
- inactive row는 다음 load에서 history로 이동한다.

---

## 4. 자동화 커버리지 매핑

### 4.1 Cost setup use case
- `apps/mobile/src/features/costs/useCases/costSetup.test.ts`
- `apps/mobile/src/features/costs/useCases/saveCostSetup.test.ts`

검증 내용:
- starter line 4종 기본 렌더 데이터 구성
- active row hydrate
- after-tax preview 계산
- inactive starter/custom row restore
- blank starter line skip
- existing row inactive 처리
- restored existing row update path

### 4.2 Screen UI
- `apps/mobile/src/screens/costs/CostsScreen.test.tsx`

검증 내용:
- starter cost setup 렌더
- inactive history 분리 렌더
- `Restore to setup` action surface
- load error surface

### 4.3 저장소 / 계산 회귀
- `apps/mobile/src/data/repositories/FeeItemRepository.test.ts`
- `apps/mobile/src/features/costs/useCases/saveCostItem.test.ts`
- `apps/mobile/src/domain/calculations/fees.test.ts`
- `apps/mobile/src/utils/validation/formValidation.test.ts`

검증 내용:
- `bi_weekly`, `tax_mode = none`, `billing_anchor_date`
- fee item create / update contract
- fee occurrence / tax 계산 회귀

---

## 5. 남은 리스크

이번 pass에 포함되지 않은 항목:
- simulator / device 기준 실제 Costs 스크린 터치 UX 탐색
- 긴 custom line 목록에서의 스크롤 사용성
- locale/currency selector 개편 이후의 preview formatting 회귀

즉, current workspace 기준으로는 cost setup 구조와 데이터 계약은 잠겼지만,
다음 Block L2(Settings selector UX) 이후에는 Costs preview copy와 formatting에 대한 짧은 regression pass가 한 번 더 필요하다.

---

## 6. 결론

현재 저장소 기준으로는:
- starter cost setup UI가 구현되었고
- blank starter line / custom add / inactive restore 규칙이 코드와 테스트에 반영되었으며
- 기존 row hydrate와 history 흐름이 새 구조 위에서 일관되게 동작한다.

따라서 **Cost System Expansion block은 `LXP-COST-05`까지 workspace automation scope에서 pass**로 기록한다.

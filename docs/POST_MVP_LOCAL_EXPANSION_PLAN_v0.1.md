# Gym Value App — Post-MVP Local Expansion Plan v0.1

## 문서 정보
- 문서명: Post-MVP Local Expansion Plan
- 버전: v0.1
- 상태: Draft
- 작성 기준일: 2026-04-02
- 상위 문서:
  - Master Plan v0.1
  - Future Development Playbook v0.1
  - Product Spec v0.1
  - Data Model and Calculation v0.1
  - Implementation Checklist v0.1
- 목적: local-first MVP 이후, 다음 제품 확장 블록을 **비용 입력/계산 UX 개선 → 설정 UX 개선 → gym 검색 보조 → onboarding 재설계** 순서로 고정하고 PR-sized 작업 단위로 정리한다.

---

## 1. 이 문서의 역할

이 문서는 post-MVP 로컬 제품 확장에 대한 **구현 계획 문서**다.

역할은 아래와 같다.
- 사용자가 실제 테스트에서 남긴 피드백 4개를 구현 순서로 재정리한다.
- 전체 future roadmap 중, **local-only로 바로 개선할 수 있는 다음 블록**만 따로 분리한다.
- 스키마/계산/UI/온보딩 변경이 섞이지 않도록 작업 경계를 나눈다.
- 이후 실제 작업을 `반나절~1일` 수준의 PR 단위로 진행할 수 있게 task를 쪼갠다.

이 문서는 전체 roadmap을 대체하지 않는다.
- device/release 우선순위는 `FUTURE_DEVELOPMENT_PLAYBOOK_v0.1.md`
- v0.1 완료 상태와 남은 native QA는 `IMPLEMENTATION_CHECKLIST_v0.1.md`
- 제품/UX 기준은 `PRODUCT_SPEC_v0.1.md`
- DB/계산 기준은 `DATA_MODEL_AND_CALCULATION_v0.1.md`, `INITIAL_DB_SCHEMA_SQL_v0.1.md`
를 따른다.

즉, 이 문서는 **Phase C(local product expansion)의 바로 다음 실행 순서**만 구체화하는 companion 문서다.

---

## 2. 현재 기준선

현재 mobile 앱은 아래 범위를 이미 가진다.
- local-first manual MVP 구현 완료
- Home KPI MVP 구현 완료
- assisted flow wiring 및 fallback UI 구현 완료
- concrete native adapter / real-device release smoke는 아직 남아 있음

중요한 점은, 이번 문서가 다루는 4개 항목은 **online 확장보다 앞선 local UX / data model 개선**이라는 점이다.

따라서 overall roadmap은 그대로 유지한다.
1. device reality / release hardening
2. 그 다음 local product expansion
3. 그 다음 online foundation

이 문서는 위 2번 구간 안에서의 세부 순서를 아래처럼 잠근다.

1. 비용 입력/데이터 모델 확장
2. 통화/세율 선택 UX 개선
3. gym 검색 및 자동 채움
4. onboarding 재설계

---

## 3. 왜 4번(비용 UX)을 먼저 하는가

사용자 피드백 4개 중 가장 구조적으로 큰 변경은 비용 입력 방식이다.

이 항목은 단순한 form polish가 아니라 아래를 함께 바꾼다.
- `fee_items.cadence` 지원 범위
- `tax_mode` 표현력
- recurring anchor 해석
- 비용 입력 화면 구조
- calculation test set

반면 1, 2, 3은 대부분 아래 성격이다.
- 설정 UX 개선
- 검색/자동 채움 보조
- first-run flow 조립

즉, **4번이 데이터 계약과 화면 구조를 먼저 바꾸고**, 1/2/3은 그 위에 얹는 편이 재작업이 적다.

특히 onboarding은 마지막에 가야 한다.
onboarding은 결국 “최종 setup flow를 어떻게 보여줄지”의 문제이므로,
settings/gym/cost setup이 바뀌기 전에 먼저 만들면 다시 뜯어고치게 된다.

---

## 4. 우선순위 잠금

이 문서 기준의 구현 순서는 아래로 고정한다.

### Block L1 — Cost System Expansion
사용자 피드백 4번

### Block L2 — Settings Selector UX
사용자 피드백 1번

### Block L3 — Gym Search Assist
사용자 피드백 2번

### Block L4 — Onboarding Redesign
사용자 피드백 3번

---

## 5. Block L1 — Cost System Expansion

### 5.1 목표
현재 generic cost form을, 사용자가 훨씬 자연스럽게 쓰는 **starter line + optional extra line** 구조로 바꾼다.

핵심 사용 방식은 아래다.
- 자주 쓰는 기본 비용 4종을 먼저 제시한다.
- 없는 항목은 비워 두거나 끌 수 있다.
- 필요하면 custom line을 추가한다.
- 사용자는 항상 **세전 금액**을 입력한다.
- 앱은 **세후 금액 preview**를 계산해 보여준다.

### 5.2 제품 결정

#### D1. 비용 입력 모델은 계속 row-based `fee_items`를 유지한다
- 별도 `fee_templates` 테이블은 두지 않는다.
- starter line은 UI preset이며, 저장은 기존처럼 `fee_items` row로 한다.

#### D2. 기본 4종 starter line
- 회비: 기본 category `monthly_membership`, 기본 cadence `bi_weekly`
- 가입비: 기본 category `signup_fee`, 기본 cadence `one_time`
- 연회비: 기본 category `annual_fee`, 기본 cadence `annual`
- 락커비: 기본 category `locker_fee`, 기본 cadence `monthly`

#### D3. custom line은 계속 허용한다
- category `other` + custom label 방식 유지
- PT 같은 기존 category도 custom line 흐름 안에서 계속 지원 가능

#### D4. cadence는 아래 4종을 실제 지원 대상으로 확장한다
- `one_time`
- `bi_weekly`
- `monthly`
- `annual`

`cadence = custom`은 계속 스키마 호환용 reserve 값으로만 두고, UI/계산에서는 계속 제외한다.

#### D5. 세금 입력 모델은 아래 3종으로 확장한다
- `inherit_default`
- `none`
- `custom`

의미:
- `inherit_default`: app settings 기본 세율 사용
- `none`: 해당 비용 라인에 세금 미적용
- `custom`: 항목별 GST/PST override

#### D6. 금액 입력은 항상 pre-tax다
- `amount_pre_tax`만 입력한다.
- 이 블록에서는 `is_tax_included`를 도입하지 않는다.
- 이유: 입력 규칙을 단순하게 유지하고 계산 혼동을 줄이기 위해서다.

#### D7. recurring anchor는 optional `billing_anchor_date`로 푼다
- 타입: `YYYY-MM-DD`
- `annual`, `bi_weekly`에서 우선 노출한다.
- 값이 없으면 `start_date`를 anchor fallback으로 사용한다.
- `monthly`도 내부 계산은 같은 필드를 재사용할 수 있지만, 초기 UI는 꼭 노출하지 않아도 된다.

#### D8. 비어 있는 starter line은 저장하지 않는다
- 사용자가 금액을 입력하지 않고 꺼 둔 starter line은 DB row를 만들지 않는다.
- 이미 저장된 row는 inactive/delete 정책을 그대로 따른다.

### 5.3 설계 영향

#### 문서
- `PRODUCT_SPEC_v0.1.md`
- `DATA_MODEL_AND_CALCULATION_v0.1.md`
- `INITIAL_DB_SCHEMA_SQL_v0.1.md`
- 필요 시 `TECH_ARCHITECTURE_v0.1.md`

#### 스키마 / 마이그레이션
- `fee_items.cadence`에 `bi_weekly` 추가
- `fee_items.tax_mode`에 `none` 추가
- `fee_items.billing_anchor_date` nullable 추가
- validation / seed / mapper / test fixture 갱신

#### 계산
- bi-weekly occurrence expansion 추가
- `tax_mode = none` 처리 추가
- anchor date fallback 규칙 추가
- annual/bi-weekly occurrence test set 보강

#### UI
- generic single-form에서 starter line 중심 편집 화면으로 교체
- 각 line별 enabled/disabled, tax toggle, after-tax preview 추가
- “Add custom cost line” entry 추가

### 5.4 PR-sized 작업 단위

#### `LXP-COST-01` 스펙과 decision lock 갱신
- Goal: 비용 UX 변경을 코어 문서에 먼저 반영한다.
- Scope: Product Spec, Data Model, Initial Schema, 이 문서의 결정 반영
- Acceptance: `bi_weekly`, `tax_mode = none`, `billing_anchor_date`, starter line 정책이 문서에 명시된다.

#### `LXP-COST-02` DB migration과 domain model 확장
- Goal: 새 비용 규칙을 저장할 수 있는 구조를 만든다.
- Scope: migration `002_*`, `FeeItem` model/form type/runtime constants 갱신
- Acceptance: 기존 데이터와 호환되며 additive migration으로 새 컬럼/enum을 수용한다.

#### `LXP-COST-03` 계산/validation 업데이트
- Goal: 새 cadence와 tax mode를 계산/검증에 반영한다.
- Scope: fee validation, occurrence expansion, total paid 계산, test fixtures
- Acceptance: bi-weekly/annual anchor, no-tax, custom-tax가 모두 순수 함수 테스트로 잠긴다.

#### `LXP-COST-04` Costs 입력 UI 재작성
- Goal: starter line + extra line 흐름을 실제 화면에 반영한다.
- Scope: Costs screen, editor sections, pre-tax input, after-tax preview, optional advanced fields
- Acceptance: 기본 4종을 빠르게 입력할 수 있고, 필요한 경우만 추가 필드를 펼친다.

#### `LXP-COST-05` edit/inactive/history polish와 QA
- Goal: 기존 row 편집/비활성화와 새 UI가 자연스럽게 공존하게 한다.
- Scope: existing row hydrate, inactive flow 유지, regression QA, docs evidence
- Acceptance: create/edit/inactive/history가 모두 새 구조에서 일관되게 동작한다.

### 5.5 완료 기준
- 사용자는 기본 비용 4종을 화면에서 바로 인지하고 빠르게 입력할 수 있다.
- `one_time / bi_weekly / monthly / annual`이 실제 저장/계산된다.
- 세금은 line별로 `기본값 사용 / 세금 없음 / 커스텀`을 고를 수 있다.
- 입력은 항상 세전이고, 세후 결과가 UI에서 계산되어 보인다.
- annual fee는 optional billing date를 가질 수 있다.

### 5.6 검증 기준
- migration apply / rerun 무결성
- 기존 v0.1 fee row read compatibility
- bi-weekly occurrence unit test
- annual anchor test
- `tax_mode = none` calculation test
- Costs screen create/edit/inactive UI test

### 5.7 Out of scope
- multi-gym별 다른 currency
- tax-inclusive 입력
- catalog 기반 가격 자동 제안
- online backup/sync 연동

---

## 6. Block L2 — Settings Selector UX

### 6.1 목표
현재 raw text 입력 중심인 Settings tax/currency 폼을 **preset-first + custom override** 구조로 바꾼다.

### 6.2 제품 결정
- 기본 진입은 `Region preset`
- 최소 preset 예:
  - `BC, Canada`
  - `No tax`
  - `Custom`
- preset을 고르면 아래를 함께 채운다.
  - `currency`
  - `locale`
  - `default_gst_rate`
  - `default_pst_rate`
- `Custom`일 때만 직접 편집을 연다.

### 6.3 왜 L1 다음인가
- L1에서 `tax_mode = none`과 after-tax preview가 먼저 잠겨야
  settings default tax가 어디까지 영향을 주는지 UX가 분명해진다.
- 즉, settings UX는 비용 계산 규칙 위에 올라가야 한다.

### 6.4 PR-sized 작업 단위

#### `LXP-SET-01` preset data model과 copy 확정
- Goal: region preset과 custom override 규칙을 잠근다.
- Scope: preset list, default copy, fallback 규칙 문서화
- Acceptance: settings와 cost line tax mode 간 역할 분리가 명확하다.

#### `LXP-SET-02` Settings UI 교체
- Goal: preset selector와 custom advanced editor를 구현한다.
- Scope: picker/segmented UI, default tax preview, custom editing gate
- Acceptance: 사용자가 raw tax 숫자를 매번 직접 치지 않아도 된다.

### 6.5 완료 기준
- 통화와 세율을 리스트/프리셋 중심으로 고를 수 있다.
- custom override가 필요할 때만 상세 숫자 입력이 보인다.
- Costs line의 `inherit_default`가 어떤 값을 상속하는지 이해 가능하다.

---

## 7. Block L3 — Gym Search Assist

### 7.1 목표
gym setup을 manual-only에서 **search-assisted + manual override** 구조로 확장한다.

### 7.2 제품 결정
- 진입 경로는 두 개다.
  - `Search gym`
  - `Enter manually`
- 검색 결과 선택 시 아래를 자동 채운다.
  - `name`
  - `latitude`
  - `longitude`
  - `timezone`
- `radius` 기본값은 `30m`
- timezone은 좌표 기반 결과를 우선 사용하고, 실패 시 device local timezone fallback
- 사용자는 auto-filled 값도 언제든 수정 가능하다.

### 7.3 잠재적 스키마 확장
아래는 optional migration 후보로 열어 둔다.
- `gyms.place_id`
- `gyms.address`

단, search provider를 실제로 붙이기 전까지는 필수로 강제하지 않는다.

### 7.4 왜 L2 다음인가
- onboarding보다 먼저 gym setup 자체를 더 좋은 상태로 만들어야 한다.
- settings preset이 먼저 들어가면 timezone/currency/tax 기본값과 setup copy를 맞추기 쉽다.

### 7.5 PR-sized 작업 단위

#### `LXP-GYM-01` provider/UX contract 잠금
- Goal: search provider 선택 전에도 앱 레이어 contract를 정의한다.
- Scope: query/result shape, fallback rules, radius/timezone defaults 문서화
- Acceptance: search/manual 흐름의 edge case가 정리된다.

#### `LXP-GYM-02` search-assisted form 구현
- Goal: gym 검색 결과를 선택해 기본 정보를 채우는 UI를 만든다.
- Scope: search entry, result selection, manual override, 30m default
- Acceptance: 대부분의 사용자는 좌표를 직접 치지 않고도 gym setup을 마칠 수 있다.

#### `LXP-GYM-03` persistence와 edit QA
- Goal: auto-filled gym과 manual gym이 같은 repository 흐름에서 자연스럽게 유지되게 한다.
- Scope: mapper/update path, optional place metadata, regression QA
- Acceptance: auto-fill 이후 저장/수정/재진입이 안정적이다.

### 7.6 완료 기준
- 사용자는 검색으로 gym을 고르면 좌표/타임존을 직접 입력하지 않아도 된다.
- 반경 기본값은 30m로 시작한다.
- manual fallback은 계속 유지된다.

---

## 8. Block L4 — Onboarding Redesign

### 8.1 목표
improved settings + gym setup + cost setup을 묶는 실제 first-run flow를 만든다.

### 8.2 왜 마지막인가
onboarding은 독립 기능이 아니라,
이미 정리된 설정/짐/비용 흐름을 순서 있게 보여 주는 wrapper다.

즉, 아래가 먼저 안정화되어야 한다.
- cost starter lines
- region preset
- gym search/manual setup

### 8.3 제품 결정
최소 onboarding 단계는 아래를 권장한다.
1. local-first/manual fallback 설명
2. region preset 선택
3. gym setup
4. starter cost setup
5. assisted permission은 마지막 optional step

권한 요청은 onboarding completion을 막는 hard gate로 두지 않는다.

### 8.4 필요한 데이터 포인트
- `app_settings.onboarding_completed_at` 또는 `app_settings.setup_version`
- optional skip state / revisit entry point

### 8.5 PR-sized 작업 단위

#### `LXP-ONB-01` onboarding state contract와 copy 확정
- Goal: step order, skip 정책, completion 기록 방식을 잠근다.
- Scope: first-run 조건, revisit entry, permission timing 문서화
- Acceptance: onboarding이 manual-only 사용자를 방해하지 않는다는 원칙이 명확하다.

#### `LXP-ONB-02` onboarding navigator / shell 구현
- Goal: 실제 step flow를 앱에 추가한다.
- Scope: step shell, progress, skip/back, completion persist
- Acceptance: first-run에서 사용자가 자연스럽게 setup을 끝낼 수 있다.

#### `LXP-ONB-03` 각 setup step 연결과 QA
- Goal: settings/gym/cost/permission step을 실제 화면과 연결한다.
- Scope: existing forms embed/reuse, return flow, revisit/edit path, device QA
- Acceptance: 온보딩 이후 Home/Visits/Costs/Settings가 모두 일관된 초기 상태를 갖는다.

### 8.6 완료 기준
- first-run 사용자가 제품 가치와 설정 경로를 이해하고 초기 setup을 마칠 수 있다.
- permission denial이 onboarding 전체를 막지 않는다.
- onboarding 완료 후에도 Settings에서 동일 항목을 다시 수정할 수 있다.

---

## 9. 순서 요약

이 문서 기준의 로컬 제품 확장 순서는 아래와 같다.

1. `LXP-COST-*`
2. `LXP-SET-*`
3. `LXP-GYM-*`
4. `LXP-ONB-*`

즉, **비용 데이터 계약과 입력 UX를 먼저 잠그고**, 그 다음 기본 설정 UX, gym setup assist, onboarding wrapper 순으로 진행한다.

---

## 10. 공통 검증 전략

각 블록마다 아래를 기본 검증으로 둔다.
- lint / Jest regression
- migration forward compatibility
- 기존 v0.1 저장 데이터 read compatibility
- empty / loading / populated / error 상태 확인
- create / edit / inactive 또는 retry flow 확인

추가로 L3/L4는 아래가 필요하다.
- 실제 device timezone fallback 확인
- first-run / revisit / permission denial QA

---

## 11. 이 순서에서 일부러 미루는 것

아래는 이 문서 범위에서 일부러 뒤로 미룬다.
- Home learning/projected/actual mode
- estimator / planner
- scenario persistence
- auth / backup / restore / sync
- public gym catalog / regional pricing DB

이유는 단순하다.
지금 사용자가 실제로 느낀 friction은 setup과 cost input에 더 가깝기 때문이다.

---

## 12. 최종 메모

이 문서의 핵심은 한 줄로 요약된다.

**다음 제품 확장은 onboarding부터 만드는 것이 아니라, 먼저 비용 입력 모델을 다시 설계하고 그 위에 설정/gym/onboarding을 순서대로 올리는 것**이다.

따라서 다음 실제 구현은 `LXP-COST-01`부터 시작한다.

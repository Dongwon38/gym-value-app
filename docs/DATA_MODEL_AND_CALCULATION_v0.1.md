# Gym Value App — Data Model and Calculation v0.1

## 문서 정보
- 문서명: Data Model and Calculation
- 버전: v0.1
- 상태: Draft
- 상위 문서: Master Plan v0.1, Product Spec v0.1, Tech Architecture v0.1
- 목적: SQLite 기반 데이터 구조, 엔티티 관계, 저장 정책, 비용/세금/방문 지표 계산 규칙을 단일 기준으로 정의

---

## 1. 문서 목적

이 문서는 Gym Value App의 **데이터 모델과 계산 규칙 기준 문서**다.

이 문서의 목적은 다음과 같다.
- 앱의 핵심 엔티티와 관계를 정의한다.
- SQLite 테이블 구조와 필드 의미를 정리한다.
- 방문 기록과 비용 항목이 어떤 방식으로 계산에 반영되는지 정의한다.
- 세금, 기간, 상태, 수동 입력, 누락 보정 같은 현실적 조건을 계산 규칙에 반영한다.
- 이후 구현, 테스트, 마이그레이션, QA의 단일 기준점이 된다.

이 문서는 **제품 기능의 데이터적 진실**을 정의하는 문서다.

---

## 2. 데이터 모델 설계 원칙

### 2.1 로컬 우선
- 모든 핵심 데이터는 로컬 SQLite에 저장한다.
- 인터넷 연결 없이 조회/입력/계산이 가능해야 한다.

### 2.2 확정 기록 중심
- 위치 이벤트 자체는 참고용이다.
- 최종 통계는 `completed visit` 기준으로 계산한다.
- 자동화는 보조이고, 최종 truth는 visit record다.

### 2.3 다중 gym 확장 가능 구조
- MVP는 단일 primary gym 기준이지만, schema는 multi-gym 가능하게 설계한다.
- 대부분의 핵심 엔티티는 `gym_id`를 가진다.

### 2.4 비용은 row 기반으로 저장
- 비용은 고정 컬럼이 아니라 행 단위 item으로 저장한다.
- 이유: 사용자 정의 항목, 기간 중첩, 활성/비활성 전환, 세금 override를 유연하게 다루기 위해서다.

### 2.5 계산은 재현 가능해야 한다
- raw data를 기반으로 언제든 통계를 다시 계산할 수 있어야 한다.
- dashboard 수치는 영구 저장보다는 재조회/재계산이 기본이다.

---

## 3. 엔티티 개요

핵심 엔티티는 아래 5개다.

1. `gyms`
2. `visits`
3. `location_prompts`
4. `fee_items`
5. `app_settings`

향후 확장 대비 보조 엔티티 후보:
- `tags` 또는 `visit_notes` 확장 테이블
- `sync_state`
- `calculation_snapshots` (필요 시)

MVP에서는 위 5개만 유지한다.

---

## 4. 테이블 개요

## 4.1 gyms

### 역할
- 사용자가 등록한 gym 정보를 저장한다.
- 위치 좌표, 반경, timezone, primary 여부를 가진다.
- MVP는 보통 1개 row만 active하게 사용한다.

### 권장 필드
```sql
CREATE TABLE gyms (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radius_meters INTEGER NOT NULL,
  timezone TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 필드 설명
- `id`: UUID 또는 app-generated string id
- `name`: gym 이름
- `latitude`, `longitude`: gym 중심 좌표
- `radius_meters`: geofence 반경
- `timezone`: display 및 기간 계산 기준용
- `is_primary`: 현재 메인 gym 여부
- `is_active`: soft archive 대비

### 제약/원칙
- MVP에서는 `is_primary = 1` row가 최대 1개여야 한다.
- 반경은 최소/최대 허용 범위를 둔다.
  - 예: 30m ~ 500m

---

## 4.2 visits

### 역할
- gym 방문 기록의 source of truth
- 통계는 주로 이 테이블 기준으로 계산한다.

### 권장 필드
```sql
CREATE TABLE visits (
  id TEXT PRIMARY KEY NOT NULL,
  gym_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_minutes INTEGER,
  status TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'high',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (gym_id) REFERENCES gyms(id)
);
```

### 필드 설명
- `gym_id`: 해당 방문이 속한 gym
- `started_at`: ISO datetime
- `ended_at`: 종료 시간. active 상태일 때 null 가능
- `duration_minutes`: 완료 시점에 계산된 값 저장
- `status`: `active | completed | cancelled`
- `source`: `manual | prompted | recovered`
- `confidence`: `high | medium | low`
- `notes`: 선택 메모

### 제약/원칙
- `status = active`이면 `ended_at`와 `duration_minutes`는 null 가능
- `status = completed`이면 `ended_at`와 `duration_minutes`는 필수
- `status = cancelled`는 통계에서 제외
- 미래 시점 방문은 저장 불가
- `duration_minutes <= 0` 저장 불가

### 인덱스 추천
```sql
CREATE INDEX idx_visits_gym_id ON visits(gym_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_started_at ON visits(started_at);
CREATE INDEX idx_visits_gym_status_started ON visits(gym_id, status, started_at DESC);
```

---

## 4.3 location_prompts

### 역할
- 위치/알림 기반 제안 이벤트 저장
- 통계의 직접 source는 아니지만, 누락 복구와 디버깅에 유용

### 권장 필드
```sql
CREATE TABLE location_prompts (
  id TEXT PRIMARY KEY NOT NULL,
  gym_id TEXT NOT NULL,
  type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  was_accepted INTEGER NOT NULL DEFAULT 0,
  related_visit_id TEXT,
  dismissed_permanently INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (gym_id) REFERENCES gyms(id),
  FOREIGN KEY (related_visit_id) REFERENCES visits(id)
);
```

### 필드 설명
- `type`: `enter | exit | checkin_suggested | checkout_suggested`
- `occurred_at`: 프롬프트 기준 시간
- `was_accepted`: 사용자가 액션을 수락했는지
- `related_visit_id`: 해당 prompt에서 생성/연결된 visit
- `dismissed_permanently`: recovery 후보에서 제외 처리용

### 사용 목적
- missed visit candidate 탐색
- prompt UX 품질 확인
- 오탐/누락 분석

### 계산 반영 여부
- location_prompts는 직접 비용/방문 계산에 포함되지 않는다.
- 단, 사용자가 recovery를 통해 visit를 생성하면 그 visit는 통계에 포함된다.

---

## 4.4 fee_items

### 역할
- membership 및 기타 gym 관련 비용 항목 저장
- 총 비용 계산의 핵심 원천 데이터

### 상태 메모
- 현재 shipped `001_initial_schema`는 `one_time | monthly | annual` cadence와 `inherit_default | custom` tax mode만 실제로 담고 있다.
- 아래 권장 필드 집합은 다음 local expansion 블록에서 additive migration으로 맞출 target shape다.

### 권장 필드
```sql
CREATE TABLE fee_items (
  id TEXT PRIMARY KEY NOT NULL,
  gym_id TEXT NOT NULL,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  amount_pre_tax REAL NOT NULL,
  cadence TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  billing_anchor_date TEXT,
  tax_mode TEXT NOT NULL DEFAULT 'inherit_default',
  gst_rate REAL,
  pst_rate REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (gym_id) REFERENCES gyms(id)
);
```

### 필드 설명
- `category`: `monthly_membership | annual_fee | signup_fee | locker_fee | pt | other`
- `label`: 화면 노출용 이름
- `amount_pre_tax`: 세전 금액
- `cadence`: `one_time | bi_weekly | monthly | annual | custom` — 여기서 마지막 `custom`은 **반복 규칙(cadence)의 enum 값**이며, Product Spec의 “사용자 정의 비용 라인”과 동일어가 아니다(본 문서 §13.5).
- `start_date`: 비용 유효 시작일
- `end_date`: 종료일. ongoing이면 null 가능
- `billing_anchor_date`: recurrence anchor. null이면 `start_date`를 anchor fallback으로 사용
- `tax_mode`: `inherit_default | none | custom`
- `gst_rate`, `pst_rate`: custom일 때 override 값. `inherit_default` / `none`일 때는 null 권장
- `is_active`: 현재 사용 여부
- `sort_order`: UI 정렬

### 제약/원칙
- `amount_pre_tax`는 음수 불가
- `cadence = one_time`일 경우, 시작일 기준 1회 비용으로 해석
- `cadence = bi_weekly`는 `billing_anchor_date` 또는 `start_date`를 기준으로 14일마다 반복
- `cadence = monthly`는 시작일부터 종료일까지 월 단위 반영
- `cadence = annual`은 `billing_anchor_date` 또는 `start_date` anniversary 기준으로 반영
- `tax_mode = none`은 line-level no-tax를 의미한다
- `cadence = custom`: v0.1에서는 **UI에서 선택 불가**, **occurrence 계산 규칙도 v0.1에서 확정하지 않음**(스키마 호환용으로만 둘 수 있음)

### 인덱스 추천
```sql
CREATE INDEX idx_fee_items_gym_id ON fee_items(gym_id);
CREATE INDEX idx_fee_items_active ON fee_items(is_active);
CREATE INDEX idx_fee_items_range ON fee_items(start_date, end_date);
CREATE INDEX idx_fee_items_gym_active ON fee_items(gym_id, is_active);
```

---

## 4.5 app_settings

### 역할
- 앱 전역 설정 저장
- 세금 기본값, 통화, 로캘, UX 설정을 담는다.

### 권장 필드
```sql
CREATE TABLE app_settings (
  id TEXT PRIMARY KEY NOT NULL,
  currency TEXT NOT NULL,
  locale TEXT NOT NULL,
  region_preset TEXT,
  default_gst_rate REAL NOT NULL DEFAULT 0,
  default_pst_rate REAL NOT NULL DEFAULT 0,
  home_primary_metric TEXT NOT NULL DEFAULT 'cost_per_visit',
  checkin_suggestions_enabled INTEGER NOT NULL DEFAULT 1,
  checkout_suggestions_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 필드 설명
- `currency`: 예: `CAD`
- `locale`: 예: `en-CA`
- `region_preset`: 예: `BC_CA`
- `default_gst_rate`: 앱 기본 GST
- `default_pst_rate`: 앱 기본 PST

**v0.1 초기 seed 기본값(권장):** `currency = CAD`, `locale = en-CA`, `region_preset = BC_CA`, default GST/PST는 BC/Canada 예시 수준으로 두어도 된다. 데이터 모델과 앱 구조는 **지역 중립·확장 가능**을 유지하고, “캐나다 전용 앱”으로 고정하지 않는다(다른 통화·로캘·세율로 변경 가능해야 한다).
- `home_primary_metric`: 현재는 `cost_per_visit` 중심
- `checkin_suggestions_enabled`: 위치 기반 제안 on/off
- `checkout_suggestions_enabled`: 종료 제안 on/off

### 원칙
- 이 테이블은 사실상 single-row 구조로 사용 가능
- 향후 settings migration을 쉽게 하려면 JSON blob보다 정규 컬럼 유지 권장

---

## 5. 엔티티 관계

### 5.1 관계 요약
- `gyms 1 : N visits`
- `gyms 1 : N fee_items`
- `gyms 1 : N location_prompts`
- `location_prompts 0..1 : 1 visits`
- `app_settings`는 앱 전역 단일 설정

### 5.2 관계 원칙
- visit는 반드시 gym에 속해야 한다.
- fee item도 반드시 gym에 속해야 한다.
- multi-gym 확장을 고려해 app-wide fee는 두지 않는다.

---

## 6. 날짜 및 시간 저장 정책

### 6.1 datetime 저장 형식
- datetime은 ISO 8601 string으로 저장
- date-only 값은 `YYYY-MM-DD`

### 6.2 started_at / ended_at
- timezone-aware string 저장을 권장
- 앱 내부 계산은 가능한 한 일관된 timezone 처리 규칙을 따라야 한다.

### 6.3 기간 계산 기준
기본 원칙:
- Home 대시보드의 기준 기간은 current year
- year/month filters는 gym timezone 또는 app locale 기준으로 해석

### 6.4 duration 저장 정책
- `duration_minutes`는 completed 상태에서만 저장
- 편집 시 항상 `started_at` / `ended_at`로부터 재계산
- 수동으로 duration만 따로 저장하지 않는다.

---

## 7. 상태값 정의

## 7.1 visit.status
- `active`
- `completed`
- `cancelled`

### 계산 규칙
- `active`: dashboard의 total visits에는 포함하지 않음
- `completed`: 모든 핵심 통계에 포함
- `cancelled`: 모든 핵심 통계에서 제외

## 7.2 visit.source
- `manual`
- `prompted`
- `recovered`

### 계산 규칙
- source에 상관없이 `completed`이면 동일하게 통계에 포함
- source는 제품 분석과 디버깅용 보조 정보

## 7.3 fee_items.cadence
- `one_time`
- `bi_weekly`
- `monthly`
- `annual`
- `custom` — 반복 규칙 미리 정의 외의 자유 형태를 열어 두는 **스키마 확장용** 값. v0.1 제품·계산에서는 다루지 않는다.

「사용자가 Other·label로 추가하는 비용 **라인**」은 별도 개념이며, 허용되는 cadence 값은 주로 `one_time` / `bi_weekly` / `monthly` / `annual` 등으로 제한된다(Product Spec §8.4·§8.6).

## 7.4 fee_items.tax_mode
- `inherit_default`
- `none`
- `custom`

---

## 8. Visit 데이터 정책

### 8.1 active visit 정책
앱에는 동시에 하나의 active visit만 존재하도록 한다.

#### 이유
- MVP는 단일 사용자, 단일 gym 중심
- 중복 active visit은 UX와 계산을 복잡하게 만든다.

#### 규칙
- 새로운 check-in 시, 기존 active visit가 있으면 생성 차단
- 사용자는 기존 active visit를 종료하거나 수정해야 한다.

### 8.2 completed visit 정책
completed visit는 반드시 아래를 만족해야 한다.
- started_at 존재
- ended_at 존재
- ended_at > started_at
- duration_minutes > 0

### 8.3 cancelled visit 정책
- 사용자가 삭제 대신 soft-cancel 처리하는 구현도 가능
- 제품 UX상 “삭제”로 보이더라도 데이터 레벨에서는 cancelled로 남길 수 있음
- MVP에서는 구현 단순성 기준으로 hard delete 또는 cancelled 중 하나 선택 가능
- 다만 audit/recovery를 고려하면 cancelled가 유리하다.

### 8.4 중복 방문 허용 여부
MVP에서는 같은 날 여러 completed visit를 허용한다.

#### 이유
- 실제로 오전/저녁 두 번 갈 수 있다.
- 사용자가 사후 회상 입력을 나눠서 할 수 있다.

단, 아래는 경고 대상이 될 수 있다.
- 동일 시간대가 과도하게 겹치는 방문
- active visit와 시간이 충돌하는 추가 입력

---

## 9. Fee Item 데이터 정책

### 9.1 기본 원칙
- 비용 항목은 additive하다.
- 같은 기간에 여러 비용 항목이 함께 존재하면 모두 합산된다.

### 9.2 활성 비용 판단
비용 항목이 계산에 포함되려면 아래를 만족해야 한다.
- `is_active = 1`
- 계산 대상 기간과 date range가 겹침

### 9.3 기간 겹침 허용
서로 다른 fee item이 같은 기간에 겹치는 것은 허용한다.

예:
- monthly membership
- locker fee
- PT package

이들은 정상적으로 모두 합산되어야 한다.

### 9.4 inactive 처리
- inactive fee item은 새로운 계산에서 제외
- 과거 값을 보존해야 하는지 여부는 구현 전략에 따라 다르다.

권장 정책:
- inactive는 “현재 이후 계산 제외” 개념으로 보기보다, 해당 item의 date range를 명확히 설정하는 것이 더 안전하다.
- 단순 UX를 위해 inactive 플래그는 유지하되, 실제 계산은 date range + active 조합으로 판단한다.

---

## 10. 세금 모델

## 10.1 세금 계산의 기본 원칙
- 비용 계산은 `세전 금액 + 적용 세금` 기준으로 최종 총비용을 만든다.
- 세금은 fee item 단위로 적용된다.
- 앱 전역 기본 세율이 있고, 항목별 override가 가능하다.

## 10.2 유효 세율 결정 규칙
각 fee item의 effective tax rate는 아래 규칙으로 결정한다.

### Rule A. inherit_default
- `effective_gst_rate = app_settings.default_gst_rate`
- `effective_pst_rate = app_settings.default_pst_rate`

### Rule B. none
- `effective_gst_rate = 0`
- `effective_pst_rate = 0`

### Rule C. custom (`tax_mode`, cadence와 무관)
- `effective_gst_rate = fee_item.gst_rate`
- `effective_pst_rate = fee_item.pst_rate`

### 10.3 fee item 최종 금액 계산
```ts
preTax = amount_pre_tax
combinedTaxRate = effective_gst_rate + effective_pst_rate
taxAmount = preTax * combinedTaxRate
total = preTax + taxAmount
```

### 10.4 반올림 규칙
권장:
- 내부 계산은 가능한 한 소수점 정밀도를 유지
- 최종 화면 표시 시 통화 규칙에 따라 2자리 반올림

예:
- 저장: `56.2385`
- 표시: `$56.24`

### 10.5 tax-inclusive 입력은 MVP에서 제외
MVP에서는 사용자가 입력하는 금액을 **세전 기준**으로 통일한다.

#### 이유
- tax-inclusive / tax-exclusive 혼합은 UX와 계산을 복잡하게 만든다.
- 추후 필요하면 항목별 `is_tax_included` 확장 가능

---

## 11. 기간 계산 정책

## 11.1 기본 기간 단위
MVP에서 주로 다루는 기간:
- current year
- current month
- all time

## 11.2 current year 정의
- gym/app timezone 기준으로 해당 연도 1월 1일 00:00 ~ 12월 31일 23:59:59

## 11.3 current month 정의
- 해당 월의 시작 ~ 끝

## 11.4 all time 정의
- 앱에 저장된 모든 completed visit / active fee item range를 기준으로 계산

---

## 12. 방문 관련 핵심 계산 규칙

## 12.1 Total Visits
```ts
totalVisits = count(visits where status = 'completed' and withinRange)
```

### 포함 조건
- `status = completed`
- 대상 기간에 속함

### 제외 조건
- active
- cancelled

## 12.2 Total Duration Minutes
```ts
totalDurationMinutes = sum(duration_minutes of completed visits withinRange)
```

## 12.3 Total Duration Hours
```ts
totalDurationHours = totalDurationMinutes / 60
```

### 표시 규칙
- 내부 계산은 float 허용
- UI는 보통 소수점 1자리 또는 h/m 분리 형식 사용

## 12.4 Unique Visit Days
```ts
uniqueVisitDays = count(distinct local_date(started_at) for completed visits withinRange)
```

### 설명
- 같은 날 여러 번 가도 1일로 센다.
- `cost per active day` 같은 지표 계산에 사용 가능

## 12.5 Average Visit Length
```ts
averageVisitLengthMinutes = totalDurationMinutes / totalVisits
```

### 예외
- totalVisits = 0이면 null

---

## 13. 비용 관련 핵심 계산 규칙

총 비용 계산은 가장 중요한 부분 중 하나다.

## 13.1 계산 대상 비용 선정
비용 계산은 다음 질문에 답해야 한다.

**“선택한 기간 동안 이 사용자가 gym에 대해 실제로 부담한 비용은 얼마인가?”**

이를 위해 fee item의 cadence와 date range를 기간에 맞게 펼쳐서 계산한다.

---

## 13.2 One-time 비용 계산
예:
- sign-up fee
- 일회성 PT 패키지

### 규칙
- `start_date`가 계산 대상 기간 안에 있으면 1회 포함
- 그렇지 않으면 제외

```ts
if item.cadence === 'one_time' and item.start_date in range:
  include 1x total(item)
```

---

## 13.2.1 Bi-weekly 비용 계산
예:
- bi-weekly membership

### 규칙
- occurrence anchor는 `billing_anchor_date`가 있으면 그것을 사용하고, 없으면 `start_date`를 사용한다.
- anchor 이후 14일 간격으로 occurrence를 생성한다.
- 계산 대상 기간 안에 들어오는 occurrence만 포함한다.

```ts
anchorDate = item.billing_anchor_date ?? item.start_date
biWeeklyOccurrences = countBiWeeklyOccurrences(item, range, anchorDate)
biWeeklyTotal = biWeeklyOccurrences * total(item)
```

### 단순화 정책
- provider별 복잡한 billing alignment는 다루지 않는다.
- 날짜 anchor만 고정하고, proration은 하지 않는다.

---

## 13.3 Monthly 비용 계산
예:
- monthly membership
- monthly locker fee

### 규칙
계산 대상 기간과 fee item의 유효 기간이 겹치는 월 수만큼 포함한다.

### 예시
- monthly membership: $50 pre-tax
- start_date: 2026-01-10
- end_date: null
- current year calculation: 2026-01-01 ~ 2026-12-31

이 경우 2026년 안에서 활성인 월 수만큼 반영

### 단순 MVP 정책
MVP에서는 월 비용을 **월 단위 고정 반복 비용**으로 보고,
해당 월에 item이 활성 상태이면 그 달 전체 비용 1회분을 포함한다.

#### 예시
- 1월 29일 시작해도 1월 monthly cost 1회로 계산
- 이후 더 정교한 일할 계산(proration)은 추후 확장으로 미룬다.

```ts
monthlyOccurrences = countActiveMonths(item, range)
monthlyTotal = monthlyOccurrences * total(item)
```

### 장점
- 사용자 이해가 쉽다.
- membership의 실제 과금 방식과도 대체로 부합한다.

---

## 13.4 Annual 비용 계산
예:
- annual fee

### 규칙
- 계산 대상 기간 안에 annual occurrence가 몇 번 발생하는지 센다.
- occurrence 기준일은 `billing_anchor_date`가 있으면 그것의 월/일, 없으면 `start_date`의 월/일 anniversary 기반

#### 예시
- annual fee start_date = 2026-03-01
- range = 2026 current year
- 포함 횟수 = 1

```ts
annualOccurrences = countAnnualOccurrences(item, range)
annualTotal = annualOccurrences * total(item)
```

### MVP 단순화 정책
- annual cadence는 anniversary 기준 발생
- 복잡한 billing provider alignment는 다루지 않음

---

## 13.5 `cadence = custom` 에 대한 계산 (반복 규칙)

이 절의 `custom`은 **fee_items.cadence 필드 값이 `custom`인 경우**만 가리킨다.  
**사용자가 Other·커스텀 label로 추가하는 비용 라인**(Product Spec §8.4)과 혼동하지 않는다 — 후자는 `one_time` / `monthly` 등 일반 cadence로 저장될 수 있다.

정책 (v0.1):
- **UI:** `cadence = custom` 선택지를 노출하지 않는다.
- **계산:** occurrence 규칙을 v0.1에서 확정하지 않는다. 스키마에 값만 있을 수 있으며, 필요 시 향후 버전에서 정의한다.

---

## 14. 총 비용 계산

## 14.1 Total Paid for Range
```ts
totalPaidForRange = sum(all included fee item occurrences in range)
```

### 포함 대상
- active + date-overlapping fee items
- cadence 규칙에 의해 occurrence가 발생한 비용
- 세금 적용 후 금액

### 제외 대상
- inactive
- date range outside
- invalid item

## 14.2 예시
### 입력
- Monthly Membership: $50, monthly, Jan~Dec, GST 5%
- Locker Fee: $10, monthly, Jan~Dec, GST 5%
- Sign-up Fee: $30, one-time, Jan 5, GST 5%

### current year total
- membership: 12 × 52.50 = 630.00
- locker: 12 × 10.50 = 126.00
- signup: 1 × 31.50 = 31.50
- totalPaid = 787.50

---

## 15. 홈 KPI 계산 규칙

## 15.1 Cost Per Visit (메인 KPI)
```ts
costPerVisit = totalPaidForRange / totalCompletedVisits
```

### 예외 처리
- totalCompletedVisits = 0이면 null
- UI에서는 숫자 대신 empty state 문구 표시

예:
- `No completed visits yet`

## 15.2 Cost Per Hour
```ts
costPerHour = totalPaidForRange / totalDurationHours
```

### 예외 처리
- totalDurationHours = 0이면 null

## 15.3 Cost Per Active Day
```ts
costPerActiveDay = totalPaidForRange / uniqueVisitDays
```

### 용도
- 보조 KPI
- 홈 하단 카드 또는 향후 인사이트에 사용 가능

## 15.4 Average Visit Length
```ts
averageVisitLength = totalDurationMinutes / totalCompletedVisits
```

---

## 16. 기간별 visit 포함 기준

방문을 어떤 기간에 포함시킬지 기준이 명확해야 한다.

### 기본 원칙
MVP에서는 **visit의 시작 시각 (`started_at`) 기준**으로 기간에 포함시킨다.

#### 이유
- 구현이 단순하다.
- 사용자 입장에서 이해가 쉽다.
- 대부분의 방문은 당일 내 종료된다.

### 예시
- 2026-03-31 23:30 시작, 2026-04-01 00:40 종료
- 3월 기준 계산에서는 3월 방문으로 포함
- 4월 기준에서는 포함하지 않음

### 주의
이 규칙은 장기 active visit 같은 비정상 상태에서 왜곡 가능성이 있으나, MVP에서는 충분히 수용 가능하다.

---

## 17. 기간별 fee 포함 기준

fee는 cadence에 따라 occurrence를 펼쳐서 계산하므로, visit와 다르게 처리한다.

### 17.1 monthly
- anchor와 무관하게 해당 월에 active이면 그 달 1회 발생

### 17.2 bi_weekly
- `billing_anchor_date` 또는 `start_date`를 기준으로 14일마다 1회 발생

### 17.3 annual
- anniversary date가 range 안에 있으면 1회 발생

### 17.4 one-time
- start_date가 range 안에 있으면 1회 발생

---

## 18. 엣지 케이스 계산 정책

## 18.1 방문 수 0, 비용 있음
상황:
- 회비는 등록했지만 아직 방문 기록이 없음

결과:
- totalPaidForRange는 정상 계산
- costPerVisit = null
- costPerHour = null

UI:
- empty state 또는 안내 문구 표시

## 18.2 방문 있음, 비용 0
상황:
- 방문은 수동으로 넣었지만 비용을 아직 안 넣음

결과:
- totalVisits, totalDuration 정상 계산
- costPerVisit = 0 또는 null 중 정책 선택 필요

권장:
- **null 처리**
- 이유: “공짜 gym”이라고 오해될 수 있음

UI 문구 예:
- `Add cost items to calculate your gym value`

## 18.3 active visit 존재
상황:
- active 상태의 방문이 현재 진행 중

결과:
- 홈 active card에는 표시
- completed 기준 메트릭에는 미포함

이유:
- 아직 종료되지 않은 visit는 최종 값이 아님

## 18.4 cancelled visit 존재
결과:
- 모든 핵심 집계에서 제외

## 18.5 동일 날짜 다중 방문
결과:
- totalVisits에는 모두 포함
- uniqueVisitDays에는 1일로만 카운트

## 18.6 매우 긴 방문
정책:
- duration 자체는 저장 가능
- 계산에는 포함
- 단, validation 또는 warning 대상으로 취급

## 18.7 미래 비용 항목
예:
- 다음 달부터 시작하는 membership

결과:
- current month/current year 계산에서는 overlap/occurrence가 있어야만 포함
- 아직 시작 전이면 제외

---

## 19. 대시보드 조회용 계산 View Model 예시

```ts
type DashboardStats = {
  rangeType: 'current_year' | 'current_month' | 'all_time'
  totalPaid: number | null
  totalVisits: number
  totalDurationMinutes: number
  totalDurationHours: number
  uniqueVisitDays: number
  averageVisitLengthMinutes: number | null
  costPerVisit: number | null
  costPerHour: number | null
  costPerActiveDay: number | null
  hasActiveVisit: boolean
  activeVisitId?: string
  latestVisitAt?: string
}
```

### 원칙
- null은 “계산 불가”를 의미
- 0은 실제 값이 0임을 의미
- UI는 null과 0을 다르게 처리해야 한다.

---

## 20. 쿼리 전략 개요

## 20.1 추천 방식
- 단순 CRUD는 repository 단위 쿼리
- 대시보드 집계는 query object 또는 selector 조합

## 20.2 집계 방식
초기에는 아래 2단계 조합이 적절하다.
1. DB에서 필요한 raw rows 조회
2. domain calculation 함수로 최종 수치 계산

### 이유
- cadence별 fee occurrence 계산은 SQL만으로 억지로 처리하면 복잡해질 수 있다.
- MVP에서는 명확성과 테스트 용이성이 더 중요하다.

즉:
- visits는 DB에서 기간 조건으로 조회
- fee_items는 DB에서 active + overlapping 조건으로 조회
- 최종 occurrence expansion과 cost calculation은 TypeScript domain layer에서 수행

---

## 21. 계산 함수 책임 분리

권장 함수 예시:

### Visit 관련
- `getCompletedVisitsInRange()`
- `sumDurationMinutes()`
- `countUniqueVisitDays()`
- `calculateAverageVisitLength()`

### Fee 관련
- `resolveEffectiveTaxRate()`
- `calculateFeeItemTotal()`
- `expandFeeItemOccurrencesForRange()`
- `calculateTotalPaidForRange()`

### Dashboard 관련
- `calculateCostPerVisit()`
- `calculateCostPerHour()`
- `buildDashboardStats()`

---

## 22. Validation 규칙 요약

## 22.1 Visit validation
- started_at 필수
- ended_at는 completed일 때 필수
- ended_at > started_at
- duration > 0
- 미래 시간 금지
- active visit 중복 금지

## 22.2 Fee item validation
- label 필수
- amount_pre_tax >= 0
- cadence 유효성 확인
- start_date 필수
- end_date는 start_date 이후여야 함
- custom tax mode일 때 gst/pst 값 필요
- `tax_mode = none`일 때는 custom tax 값을 비운다
- annual / bi-weekly에서는 `billing_anchor_date`가 있으면 valid date여야 함

## 22.3 Settings validation
- currency 필수
- locale 필수
- default tax rate는 0 이상
- gym 반경은 허용 범위 내

---

## 23. 마이그레이션 방향

### 23.1 원칙
- additive migration 우선
- 컬럼 추가와 기본값 부여를 선호
- destructive change는 최대한 피함

### 23.2 다음 local expansion에 잠근 변경
- `fee_items.cadence`에 `bi_weekly` 추가
- `fee_items.tax_mode`에 `none` 추가
- `fee_items.billing_anchor_date` 추가

### 23.3 예상되는 미래 확장
- `visits.deleted_at` 추가
- `fee_items.is_tax_included` 추가
- `gyms.address` 추가
- `app_settings.week_start_day` 추가

### 23.4 migration 테스트 포인트
- 기존 visit 데이터 유지
- 기존 fee calculation 유지
- default tax 값 정상 반영
- bi-weekly / no-tax / anchor-date 확장 경로 호환
- active visit 복구 가능 여부

---

## 24. 테스트 우선순위

이 문서 기준으로 가장 먼저 테스트해야 하는 로직은 아래와 같다.

### 24.1 visit 계산
- completed만 집계되는지
- active/cancelled 제외되는지
- uniqueVisitDays가 정상 계산되는지

### 24.2 fee 계산
- one-time occurrence
- bi-weekly occurrence
- monthly occurrence
- annual occurrence
- inactive 제외
- no-tax line 처리
- custom tax override 반영

### 24.3 KPI 계산
- visit 0일 때 null 처리
- duration 0일 때 null 처리
- 비용 0/null 처리

### 24.4 기간 계산
- current year 필터
- month 경계
- started_at 기준 포함 정책

---

## 25. 구현 시 권장 단순화 규칙

### 유지할 단순화
- started_at 기준 기간 포함
- monthly는 월 단위 occurrence 1회
- proration 없음
- tax-exclusive 입력만 지원
- dashboard는 재계산 기반

### 뒤로 미룰 것
- tax-inclusive support
- proration
- provider-specific billing cycle alignment
- raw location history analytics
- complex forecast models
- snapshot materialization

---

## 26. 예시 계산 시나리오

## 26.1 시나리오 A
### 입력
- Monthly Membership: $50, monthly, 2026-01-01 시작, GST 5%
- Annual Fee: $80, annual, 2026-01-15 시작, GST 5%
- Visits in 2026: 40 completed visits
- Total duration: 3200 minutes

### 계산
- monthly total: 12 × 52.50 = 630.00
- annual total: 1 × 84.00 = 84.00
- totalPaid = 714.00
- totalVisits = 40
- totalHours = 53.333...
- costPerVisit = 17.85
- costPerHour ≈ 13.39

## 26.2 시나리오 B
### 입력
- 비용은 없음
- completed visits 10개

### 결과
- totalVisits = 10
- totalDuration 계산 가능
- totalPaid = 0 또는 null 정책 선택 필요

권장:
- 비용 설정 전까지 dashboard primary metric은 null 처리
- UI에서 비용 등록 유도

## 26.3 시나리오 C
### 입력
- sign-up fee only: $30, one-time, 2026-02-01, GST 5%
- completed visits: 2
- totalHours: 4

### 결과
- totalPaid = 31.50
- costPerVisit = 15.75
- costPerHour = 7.875 → 표시 7.88

---

## 27. 최종 결정 사항 요약

- 앱의 **도메인 데이터**는 `gyms`, `visits`, `location_prompts`, `fee_items`, `app_settings` **다섯 도메인 테이블**로 구성한다(인프라용 `schema_migrations` 등은 별도).
- 최종 통계는 `completed visit` 기준으로 계산한다.
- 비용은 row-based item 구조로 저장한다.
- 세금은 app default + fee item override 구조를 따른다.
- 총 비용은 cadence 기반 occurrence expansion 후 계산한다.
- bi-weekly는 anchor 기준 14일마다, monthly는 월별 1회, annual은 anniversary 발생, one-time은 start_date 기준 1회 발생으로 계산한다(`cadence = custom` 의 occurrence 규칙은 v0.1 비범위).
- Home 대표 KPI인 `costPerVisit`는 totalPaid / completedVisits로 정의한다.
- `costPerHour`, `costPerActiveDay`, `averageVisitLength`는 보조 지표로 계산한다.
- active visit는 홈 상태에는 보이지만 핵심 KPI 계산에는 포함하지 않는다.
- period inclusion은 visit `started_at` 기준으로 단순화한다.

---

## 28. 관련 문서

- **`DELIVERY_PLAN_v0.1.md`** — 마일스톤·구현 순서·체크리스트·QA·릴리즈. 본 문서의 schema·계산 규칙을 실행 계획으로 옮길 때 참고한다.

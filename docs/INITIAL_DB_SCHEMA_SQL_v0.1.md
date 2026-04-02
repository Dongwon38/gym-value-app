# Gym Value App — Initial DB Schema v0.1

## 문서 정보
- 문서명: Initial DB Schema SQL
- 버전: v0.1
- 상태: Draft
- 상위 문서:
  - Master Plan v0.1
  - Product Spec v0.1
  - Tech Architecture v0.1
  - Data Model and Calculation v0.1
  - Phase 0 / Phase 1 Implementation Kickoff v0.1
- 목적: Gym Value App의 SQLite 초기 스키마를 실제 구현 가능한 SQL 기준으로 고정하고, 첫 migration 초안을 제공한다.

---

## 1. 문서 목적

이 문서는 기존 기획/아키텍처/데이터 모델 문서를 바탕으로, 실제 프로젝트에서 바로 사용할 수 있는 **초기 SQLite schema SQL 기준안**을 정의한다.

이 문서의 목표는 다음과 같다.
- 초기 migration에서 생성할 테이블을 확정한다.
- column, constraint, index, 기본값을 구현 가능한 수준으로 정리한다.
- 제품 문서의 규칙을 DB 레벨에서 어디까지 강제할지 정한다.
- repository / use case 구현 전에 데이터 레이어의 기준점을 고정한다.

이 문서는 “최종 영구 schema”가 아니라, **Phase 0 / Phase 1 구현에 적합한 안정적인 v0.1 초기 스키마**다.

---

## 2. 이번 초기 스키마의 범위

`001_initial_schema`에 포함하는 **물리 테이블은 6개**다.

- **인프라 1개**: `schema_migrations` (migration 이력·버전 관리)
- **도메인 5개**: `gyms`, `visits`, `fee_items`, `app_settings`, `location_prompts`

즉, **도메인 테이블 5개 + 인프라 테이블 1개 = 총 6개**로 통일한다.

manual-first 구현의 **핵심 읽기·쓰기**는 `gyms` / `visits` / `fee_items` / `app_settings` 네 도메인에 집중한다. `location_prompts`는 스키마에 포함하되, **Phase 0 / 1에서 반드시 기능 연동할 필요는 없다**(Assisted Check-In 단계에서 본격 사용). 미리 두면 이후 migration churn을 줄인다.

---

## 3. 설계 원칙

### 3.1 로컬 우선 / SQLite 중심
- SQLite가 영속 데이터의 source of truth다.
- Zustand나 UI state는 DB를 대체하지 않는다.

### 3.2 DB는 무결성을 최소한으로 강제한다
- 필수 enum 수준, 날짜 순서, 양수 duration 같은 핵심 규칙은 가능한 범위에서 CHECK constraint로 보조한다.
- 다만 “미래 시간 금지” 같은 현재 시점 의존 규칙은 application validation에서 처리한다.

### 3.3 migration은 additive 우선
- 이후 변경은 컬럼 추가/인덱스 추가 중심으로 가정한다.
- 초기 스키마는 너무 공격적인 정규화보다 안정성을 우선한다.

### 3.4 계산용 raw data를 보존한다
- dashboard 값은 저장하지 않는다.
- visit, fee_item, settings 원천 데이터만 저장하고 계산은 재실행한다.

---

## 4. 구현 레벨 결정 사항

아래 항목은 제품 방향을 바꾸는 것이 아니라, 실제 SQL 작성 시 필요한 구현 디테일이다.

### 4.1 Boolean 표현
SQLite에서는 boolean 대신 `INTEGER`를 사용한다.
- `0 = false`
- `1 = true`

### 4.2 datetime / date 표현
- datetime: ISO 8601 문자열 (`TEXT`)
- date-only: `YYYY-MM-DD` 문자열 (`TEXT`)

### 4.3 id 타입
초기 버전에서는 모든 PK를 `TEXT`로 통일한다.
이유:
- RN 앱에서 UUID / cuid / 커스텀 id를 유연하게 사용 가능
- 나중에 sync 추가 시 충돌 위험 감소

### 4.4 Soft delete vs hard delete
초기 schema에는 `deleted_at`를 넣지 않는다.
- `visits`는 `status = 'cancelled'`를 사용 가능
- `fee_items`는 `is_active = 0` 사용
- 실제 hard delete 여부는 repository 정책에서 선택

즉, audit 확장을 위한 여지는 남겨두되, `v0.1` schema는 단순하게 유지한다.

---

## 5. 초기 스키마에 포함할 제약

### 5.1 DB에서 강제하는 것
- enum 유효성
- 필수값 존재
- completed visit의 종료/지속시간 필수
- duration > 0
- fee amount 음수 금지
- radius 범위 최소/최대
- custom tax mode일 때 gst/pst 존재

### 5.2 DB에서 강제하지 않는 것
- 미래 날짜/시간 금지
- active visit가 정확히 1개 이하인지의 전역 정책
- 동일 시간대 visit overlap 금지
- annual/monthly occurrence 계산 규칙

이런 것은 application / repository / validation layer에서 처리한다.

단, `active visit 1개 이하`는 **partial unique index**로 보조할 수 있으므로 이번 초안에 포함한다.

---

## 6. SQL 초안

아래 SQL은 `001_initial_schema.sql` 또는 이에 해당하는 migration string으로 사용 가능한 기준안이다.

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gyms (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radius_meters INTEGER NOT NULL,
  timezone TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (radius_meters >= 30 AND radius_meters <= 500),
  CHECK (is_primary IN (0, 1)),
  CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS visits (
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
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK (status IN ('active', 'completed', 'cancelled')),
  CHECK (source IN ('manual', 'prompted', 'recovered')),
  CHECK (confidence IN ('high', 'medium', 'low')),
  CHECK (
    (status = 'active' AND ended_at IS NULL AND duration_minutes IS NULL) OR
    (status = 'completed' AND ended_at IS NOT NULL AND duration_minutes IS NOT NULL AND duration_minutes > 0) OR
    (status = 'cancelled')
  ),
  CHECK (
    ended_at IS NULL OR ended_at > started_at
  )
);

CREATE TABLE IF NOT EXISTS fee_items (
  id TEXT PRIMARY KEY NOT NULL,
  gym_id TEXT NOT NULL,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  amount_pre_tax REAL NOT NULL,
  cadence TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  tax_mode TEXT NOT NULL DEFAULT 'inherit_default',
  gst_rate REAL,
  pst_rate REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK (category IN (
    'monthly_membership',
    'annual_fee',
    'signup_fee',
    'locker_fee',
    'pt',
    'other'
  )),
  CHECK (cadence IN ('one_time', 'monthly', 'annual', 'custom')),
  CHECK (tax_mode IN ('inherit_default', 'custom')),
  CHECK (amount_pre_tax >= 0),
  CHECK (is_active IN (0, 1)),
  CHECK (end_date IS NULL OR end_date >= start_date),
  CHECK (
    (tax_mode = 'inherit_default') OR
    (tax_mode = 'custom' AND gst_rate IS NOT NULL AND pst_rate IS NOT NULL)
  ),
  CHECK (gst_rate IS NULL OR gst_rate >= 0),
  CHECK (pst_rate IS NULL OR pst_rate >= 0)
);

CREATE TABLE IF NOT EXISTS app_settings (
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
  updated_at TEXT NOT NULL,
  CHECK (default_gst_rate >= 0),
  CHECK (default_pst_rate >= 0),
  CHECK (home_primary_metric IN ('cost_per_visit')),
  CHECK (checkin_suggestions_enabled IN (0, 1)),
  CHECK (checkout_suggestions_enabled IN (0, 1))
);

CREATE TABLE IF NOT EXISTS location_prompts (
  id TEXT PRIMARY KEY NOT NULL,
  gym_id TEXT NOT NULL,
  type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  was_accepted INTEGER NOT NULL DEFAULT 0,
  related_visit_id TEXT,
  dismissed_permanently INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (related_visit_id) REFERENCES visits(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CHECK (type IN ('enter', 'exit', 'checkin_suggested', 'checkout_suggested')),
  CHECK (was_accepted IN (0, 1)),
  CHECK (dismissed_permanently IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_gyms_is_active ON gyms(is_active);
CREATE INDEX IF NOT EXISTS idx_gyms_is_primary ON gyms(is_primary);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gyms_single_primary_active
ON gyms(is_primary)
WHERE is_primary = 1 AND is_active = 1;

CREATE INDEX IF NOT EXISTS idx_visits_gym_id ON visits(gym_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_started_at ON visits(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_gym_status_started ON visits(gym_id, status, started_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_visits_single_active
ON visits(status)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_fee_items_gym_id ON fee_items(gym_id);
CREATE INDEX IF NOT EXISTS idx_fee_items_active ON fee_items(is_active);
CREATE INDEX IF NOT EXISTS idx_fee_items_range ON fee_items(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_fee_items_gym_active ON fee_items(gym_id, is_active);
CREATE INDEX IF NOT EXISTS idx_fee_items_gym_sort ON fee_items(gym_id, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_location_prompts_gym_id ON location_prompts(gym_id);
CREATE INDEX IF NOT EXISTS idx_location_prompts_occurred_at ON location_prompts(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_prompts_related_visit_id ON location_prompts(related_visit_id);
```

---

## 7. 테이블별 구현 메모

### 7.1 schema_migrations
목적:
- 어떤 migration이 적용되었는지 추적
- 앱 재시작 시 중복 실행 방지

권장 사용 방식:
- `version`은 정수 증가값
- 예: `1`, `2`, `3`
- migration runner는 transaction 안에서 schema 적용 후 insert

---

### 7.2 gyms

구현 메모:
- `is_primary`와 `is_active`를 동시에 두었다.
- 나중에 multi-gym이 들어와도 현재 구조를 유지할 수 있다.
- `idx_gyms_single_primary_active`로 active primary gym 1개 정책을 보조한다.

주의:
- SQLite partial unique index는 충분히 유용하지만, repository에서도 primary 전환 시 기존 primary 해제를 함께 처리하는 것이 안전하다.

---

### 7.3 visits

구현 메모:
- `status`, `source`, `confidence`를 TEXT + CHECK로 제한했다.
- `completed`일 때 `ended_at`, `duration_minutes`를 강제했다.
- `ended_at > started_at`만 DB에서 보장하고, 미래 시간 금지는 app validation에서 처리한다.

중요:
- `idx_visits_single_active`는 앱 전체에서 active visit가 동시에 1개만 존재하게 보조한다.
- 이것은 현재 MVP의 단일 사용자/단일 device 철학과 맞는다.

주의:
- 훗날 multi-user 또는 병렬 active session이 필요해지면 이 index는 migration으로 조정해야 한다.

---

### 7.4 fee_items

구현 메모:
- 제품 문서의 category / cadence / tax_mode를 enum처럼 제한했다.
- `custom` 세금일 때만 `gst_rate`, `pst_rate` 존재를 요구한다.
- `end_date >= start_date`까지만 DB에서 강제한다.

의도적 단순화:
- 세율 upper bound는 두지 않았다.
- 나라/지역마다 변형이 있을 수 있어, 0 이상만 강제하고 나머지는 form validation에서 다룬다.

---

### 7.5 app_settings

구현 메모:
- single-row처럼 사용할 것이지만, 초기 migration에서는 별도 singleton constraint를 두지 않는다.
- 이유는 seed/reset/test 환경에서 유연성이 더 크기 때문이다.

권장 repository 정책:
- `id = 'default'` 고정
- `upsertSettings()` 사용

---

### 7.6 location_prompts

구현 메모:
- 현재 KPI 계산에는 직접 쓰이지 않지만, Phase 2에서 prompt/recovery 흐름을 붙일 때 유용하다.
- 지금 넣어두면 나중에 geofence/notification 통합 시 migration 하나를 줄일 수 있다.

**Phase 0 / `001_initial_schema`에서의 적용 (결정):**

| 항목 | 정책 |
|------|------|
| `CREATE TABLE` | §6 SQL과 동일하게 **첫 마이그레이션에 포함**한다. `visits` 뒤에 두어 FK(`related_visit_id` → `visits`)를 만족시킨다. |
| 인덱스 3개 (`idx_location_prompts_*`) | **테이블과 같은 migration 안에서** §6 순서대로 실행한다. “빈 테이블만”이 아니라 **스키마+인덱스까지 한 번에** 적용하는 것이 기준이다. |
| seed | **없음**. Phase 0/1 bootstrap에서 `INSERT`하지 않는다(§8). |
| 구현 우선순위 | 테이블·인덱스 생성은 다른 도메인 테이블과 **동일한 트랜잭션/마이그레이션 단위**로 두고, 앱 코드에서의 **읽기·쓰기 연동**만 Phase 2로 미룬다. |

---

## 8. 초기 seed / bootstrap 권장값

**`location_prompts`:** Phase 0 / Phase 1에서는 **seed 행을 넣지 않는다**. 테이블과 인덱스만 `001_initial_schema`에서 생성하고, **행 데이터는 Assisted Check-In 이후**에만 쌓인다(초기에는 빈 테이블).

**`app_settings`:** 초기 앱 부팅 시 아래 값으로 upsert하는 것을 권장한다.

```sql
INSERT INTO app_settings (
  id,
  currency,
  locale,
  region_preset,
  default_gst_rate,
  default_pst_rate,
  home_primary_metric,
  checkin_suggestions_enabled,
  checkout_suggestions_enabled,
  created_at,
  updated_at
)
VALUES (
  'default',
  'CAD',
  'en-CA',
  'BC_CA',
  0.05,
  0.07,
  'cost_per_visit',
  1,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT(id) DO NOTHING;
```

주의:
- `CURRENT_TIMESTAMP`를 써도 되지만, 앱 전반에서 timestamp 생성 방식을 통일하려면 application layer에서 ISO string을 넣는 것도 좋다.

---

## 9. React Native migration 파일 형태 제안

실제 프로젝트에서는 `.sql` 파일로 둘 수도 있고, TypeScript string migration으로 둘 수도 있다.
초기에는 RN asset/bundling 복잡도를 줄이기 위해 TypeScript migration이 더 단순하다.

예시:

구현 시 참고: 저장소에 **`apps/mobile/src/data/db/migrations/001_initial_schema.ts`** 를 두고, 위 §6과 동일한 `upSql` 문자열을 export한다(문서와 코드를 함께 갱신할 것).

```ts
// 예: migration runner가 import하는 형태
import { migration001InitialSchema } from './001_initial_schema';
// migration001InitialSchema.version === 1
// migration001InitialSchema.upSql  // §6 전체 DDL
```

권장 이유:
- Metro/bundling에 단순함
- 테스트 시 import가 편함
- version/name/sql 관리가 쉽다.

---

## 10. migration runner 규칙

권장 동작 순서:

1. DB open
2. `PRAGMA foreign_keys = ON`
3. `schema_migrations` table 보장
4. 적용 대상 migration 목록 로드
5. 아직 적용되지 않은 migration만 version 순서대로 실행
6. migration 성공 시 `schema_migrations` insert
7. 전체를 transaction으로 감싸기

`001_initial_schema` 한 번의 `execute`(또는 동일 트랜잭션)에는 §6의 **전체 DDL**(모든 테이블 + 모든 인덱스, `location_prompts` 포함)이 들어간다. **Seed(§8)** 는 migration 본문과 분리해도 되며, `app_settings`만 부팅 시 upsert하고 `location_prompts`는 seed하지 않는다.

권장 의사코드:

```ts
for (const migration of migrationsSortedAsc) {
  const alreadyApplied = await hasMigration(db, migration.version)
  if (alreadyApplied) continue

  await db.execute('BEGIN')
  try {
    await db.execute(migration.sql)
    await db.execute(
      'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
      [migration.version, migration.name, new Date().toISOString()],
    )
    await db.execute('COMMIT')
  } catch (error) {
    await db.execute('ROLLBACK')
    throw error
  }
}
```

---

## 11. 이 초기 스키마로 충분한 이유

이 스키마만으로도 아래가 가능하다.

- gym 1개 등록 및 primary 관리
- fee item CRUD
- visit CRUD
- active visit 조회
- settings 기본 저장
- prompt/recovery용 보조 데이터 저장 준비
- Home KPI 계산에 필요한 raw data 확보

즉, Phase 0 / Phase 1 목표인 **로컬 DB 기반 manual-first usable prototype**을 만드는 데 충분하다.

---

## 12. 지금은 넣지 않은 컬럼들

초기 schema에서 의도적으로 제외한 항목:

- `visits.deleted_at`
- `visits.created_by`
- `fee_items.billing_anchor_day`
- `fee_items.is_tax_included`
- `gyms.address`
- `gyms.place_id`
- `app_settings.week_start_day`
- `location_prompts.payload_json`

이유:
- 지금 넣어도 당장 쓰지 않는다.
- schema를 불필요하게 무겁게 만들 수 있다.
- additive migration으로 나중에 충분히 붙일 수 있다.

---

## 13. 이 스키마 기준 Repository 설계 포인트

### GymRepository
- `createGym`
- `updateGym`
- `getPrimaryGym`
- `listGyms`
- `setPrimaryGym`

### VisitRepository
- `createVisit`
- `updateVisit`
- `cancelVisit` 또는 `deleteVisit`
- `getVisitById`
- `listVisits`
- `getActiveVisit`

### FeeItemRepository
- `createFeeItem`
- `updateFeeItem`
- `deactivateFeeItem`
- `deleteFeeItem`
- `listFeeItems`
- `getActiveFeeItems`

### SettingsRepository
- `getSettings`
- `upsertSettings`

### LocationPromptRepository
- Phase 1 필수는 아니지만 interface 정도는 미리 두어도 좋다.

---

## 14. 추천 다음 작업

가장 자연스러운 다음 단계는 아래 순서다.

1. `apps/mobile/src/data/db/client.ts`
2. `apps/mobile/src/data/db/migrations/001_initial_schema.ts` (저장소에 추가됨)
3. `apps/mobile/src/data/db/runMigrations.ts`
4. row types 정의
5. repository scaffold 작성

별도의 “Repository 스캐폴드 전용 문서”는 **필수가 아니다**. 필요하면 Master Plan §15의 companion 목록에 맞춰 추가하면 된다.

---

## 15. 최종 요약

이번 초기 스키마의 핵심은 아래다.

- SQLite를 진짜 source of truth로 둔다.
- `gyms`, `visits`, `fee_items`, `app_settings`, `location_prompts`를 초기부터 명확히 분리한다.
- completed visit와 fee occurrence 계산을 위한 raw data를 충분히 저장한다.
- DB는 최소한의 무결성을 강제하고, 시간 의존 규칙은 validation layer에 맡긴다.
- `001_initial_schema`만으로도 manual-first MVP를 바로 구현할 수 있다.

이 스키마를 기준으로 앱 쪽에서는 DB 클라이언트·마이그레이션 러너·repository를 순서대로 붙이면 된다.

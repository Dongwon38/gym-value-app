# Online Expansion Architecture v0.1

## 문서 정보
- 목적: Gym Value App의 local-first tracker를 훼손하지 않으면서, 향후 온라인 계정/백업/복구/동기화/웹 확장으로 안전하게 이어가기 위한 아키텍처 기준을 정리한다.
- 대상 독자: 제품 기획자, 모바일 개발자, 백엔드 개발자, AI 에이전트
- 성격: 아키텍처 방향 문서 + 단계별 확장 기준 + 데이터 ownership 원칙
- 전제: 현재 저장소는 local-first manual MVP와 KPI MVP가 구현되어 있고, assisted check-in wiring도 연결되었으나, 아직 real-device/native smoke 및 release-ready hardening은 남아 있다.

---

## 1. 이 문서의 역할

이 문서는 “지금 당장 서버를 어떻게 붙일까”만 다루는 문서가 아니다.

이 문서의 역할은 다음과 같다.

1. local-first 앱에 온라인 기능을 붙일 때 어떤 원칙을 지켜야 하는지 고정한다.
2. 로그인, 서버 저장, 백업, 복구, 동기화, 웹 확장을 어떤 순서로 여는 것이 안전한지 정리한다.
3. local DB와 remote backend 사이에서 어떤 데이터가 누구의 source of truth인지 구분한다.
4. sync를 성급하게 시작하지 않도록, 먼저 필요한 중간 단계와 데이터 계약을 정의한다.
5. 이후 backend/API 설계가 tracker 핵심 가치를 해치지 않도록 기준을 제공한다.

이 문서는 코어 문서를 대체하지 않는다.
- 제품 UX의 기준은 `PRODUCT_SPEC_v0.1`
- 기술 구조의 기준은 `TECH_ARCHITECTURE_v0.1`
- 데이터/계산 규칙의 기준은 `DATA_MODEL_AND_CALCULATION_v0.1`
- 실행 순서의 기준은 `DELIVERY_PLAN_v0.1`
- 현재 이후의 확장 우선순위는 `FUTURE_DEVELOPMENT_PLAYBOOK_v0.1`을 따른다.

이 문서는 그 위에서 **“online 확장 전용 아키텍처 기준”**을 정리하는 companion 문서다.

---

## 2. 출발점 정리

현재 제품의 본질은 분명하다.

- 사용자의 gym / fee / visit 데이터를 로컬에 저장한다.
- Home은 `cost per visit`를 대표 KPI로 보여준다.
- 위치/알림은 보조이며, 최종 진실은 `visit` record다.
- manual fallback이 항상 가능해야 한다.

즉, 서버를 붙인다고 해서 제품의 본질이 “클라우드 앱”으로 바뀌면 안 된다.

이 문서에서 online expansion은 다음과 같이 정의한다.

> local-first tracker 위에 identity, backup, restore, sync, web surface를 단계적으로 얹는 것

중요한 점은, **서버는 처음부터 source of truth가 아니라 보조 계층**으로 들어와야 한다는 것이다.

---

## 3. 핵심 아키텍처 원칙

## 3.1 local DB가 먼저 살아 있어야 한다
- 앱은 로그인하지 않아도 usable해야 한다.
- 앱은 네트워크가 없어도 핵심 기능이 동작해야 한다.
- `SQLite -> source of truth` 원칙은 online 도입 이후에도 쉽게 뒤집지 않는다.

## 3.2 auth보다 data contract가 먼저다
로그인을 붙이는 것 자체는 어렵지 않을 수 있다.
하지만 아래가 더 어렵다.
- local row와 remote row 관계
- 어떤 데이터를 올릴지
- conflict를 어떻게 처리할지
- 삭제/비활성/cancelled를 어떻게 동기화할지
- restore 시 어떤 순서로 복구할지

따라서 online 단계에서는 auth보다 먼저 **data ownership / sync contract**를 설계해야 한다.

## 3.3 backup/restore가 live sync보다 먼저다
처음부터 양방향 실시간 sync로 가면 복잡성이 급증한다.
이 제품은 먼저 아래 순서를 따른다.

1. identity
2. account-linked backup
3. restore
4. sync metadata 준비
5. selective sync
6. true multi-device sync

## 3.4 actual / projected / scenario / remote shared data를 섞지 않는다
향후 제품이 확장되면 데이터 성격이 나뉜다.

- **actual data**: 사용자의 실제 gym/fee/visit 기록
- **projected data**: 실제 pace 기반 예측치
- **scenario data**: 사용자가 계산기에서 입력한 가정값
- **shared data**: 향후 gym catalog / public pricing / normalized metadata

이 데이터들은 같은 앱 안에 있을 수 있지만, 저장 위치와 ownership이 다르다.

## 3.5 remote는 단계적으로 강해진다
초기 remote 역할:
- 계정 식별
- 백업 저장
- 복구 지원

중기 remote 역할:
- 변경 업로드
- selective sync
- user-owned cloud copy

장기 remote 역할:
- multi-device sync
- web surface
- shared catalog / recommendation / analytics

---

## 4. online expansion의 최종 그림

장기적으로는 아래 4층 구조를 생각한다.

1. **Mobile Local Layer**
2. **Sync / Transfer Layer**
3. **Remote Application Layer**
4. **Web / Shared Surface Layer**

### 4.1 Mobile Local Layer
현재 이미 존재하는 층이다.

포함:
- SQLite
- repositories
- use cases
- local calculations
- session/UI stores

역할:
- 사용자 입력의 1차 수용
- local truth 유지
- offline usable 상태 보장

### 4.2 Sync / Transfer Layer
online 확장에서 새로 생기는 핵심 층이다.

포함:
- auth session binding
- backup exporter/importer
- sync queue
- dirty tracking
- upload/download coordinator
- conflict policy handler

역할:
- local 데이터와 remote 데이터 사이 이동을 관리
- local DB를 직접 대체하지 않고 연결

### 4.3 Remote Application Layer
서버/백엔드 계층이다.

포함:
- auth
- backup storage
- snapshot metadata
- sync endpoints
- user-scoped resources
- future catalog / recommendation APIs

역할:
- 계정 단위 식별
- backup 보관
- sync 수신/응답
- user-owned remote copy 제공

### 4.4 Web / Shared Surface Layer
나중에 붙는 외부 surface다.

포함:
- read-only dashboard
- account management
- restore/download UI
- future web CRUD
- future gym catalog / estimator web surface

역할:
- multi-device 가시성 제공
- 모바일 외 surface 확장

---

## 5. 권장 단계별 확장 순서

## 5.1 Stage 0 — Local tracker stabilization
이 문서의 직접 범위는 아니지만, online 이전 전제로 중요하다.

조건:
- manual tracker 안정화
- assisted flow device smoke
- release-ready local MVP 확보

이 단계가 충분히 잠기기 전에는 online expansion을 실제 구현 우선순위로 올리지 않는다.

## 5.2 Stage 1 — Identity only
목표:
- 사용자 계정을 만들 수 있게 한다.
- 그러나 local-first 구조는 그대로 둔다.

초기 인증 후보:
- email magic link
- Apple Sign In
- Google Sign In

원칙:
- 로그인 여부와 관계없이 앱 핵심 기능은 계속 사용 가능해야 한다.
- 로그인은 “데이터를 계정과 연결하는 열쇠”이지, 사용 시작 조건이 아니다.

이 단계에서 아직 하지 않을 것:
- full sync
- live multi-device merge
- server-owned CRUD 전환

## 5.3 Stage 2 — Backup / Restore first
목표:
- 사용자의 local 데이터를 계정에 백업한다.
- 새 기기나 재설치 후 restore가 가능하도록 만든다.

이 단계가 중요한 이유:
- 사용자가 online 가치를 바로 체감할 수 있다.
- sync보다 복잡성이 낮다.
- 데이터 계약을 안정적으로 검증할 수 있다.

핵심 기능:
- backup now
- automatic periodic backup (선택)
- backup list / latest backup 확인
- restore from latest snapshot

## 5.4 Stage 3 — Sync metadata prep
목표:
- local row가 remote와 연결될 준비를 한다.
- 아직 완전한 동기화는 하지 않더라도, sync-friendly schema를 만든다.

예시 필드/상태:
- `remote_id`
- `sync_state`
- `dirty`
- `last_synced_at`
- `sync_error`
- `deleted_at` 또는 tombstone 전략 (필요 시)

## 5.5 Stage 4 — Single-user multi-device sync
목표:
- 같은 계정의 두 기기 이상에서 user-owned data가 동기화된다.

범위 우선순위:
1. settings
2. gym
3. fee_items
4. visits
5. location_prompts는 마지막 또는 제외 가능

이유:
- `location_prompts`는 truth data가 아니므로 첫 sync 대상일 필요가 낮다.

## 5.6 Stage 5 — Web expansion
목표:
- 먼저 read-only web을 연다.
- 그 다음 필요한 write 기능을 제한적으로 연다.

권장 순서:
1. web dashboard read-only
2. backup/restore/account management web
3. estimator/scenario web
4. web write support

---

## 6. 데이터 ownership 모델

online 확장을 안전하게 하려면, 각 데이터 타입의 ownership을 명확히 나눠야 한다.

| 데이터 타입 | 1차 source of truth | remote 필요성 | 비고 |
|---|---|---:|---|
| gyms | local | 높음 | 계정 백업/복구, 다기기 공유 대상 |
| visits | local | 매우 높음 | 핵심 truth data |
| fee_items | local | 매우 높음 | KPI 계산 핵심 |
| app_settings | local | 중간 | 일부는 계정 단위 공유 가치 있음 |
| location_prompts | local | 낮음 | 보조/디버깅용, 초기 sync 제외 가능 |
| projected metrics | derived | 낮음 | 원천 데이터를 sync하고 재계산 |
| scenario inputs | local | 중간 | Estimator 연동 시 sync 후보 |
| gym catalog/shared quotes | remote | 높음 | 장기 shared data 축 |

핵심 규칙:
- **실제 KPI는 remote metrics를 내려받기보다 local/derived 계산을 유지**하는 편이 안정적이다.
- remote는 원천 데이터 보관/전달을 우선하고, 계산은 local 재현 가능성을 유지한다.

---

## 7. local schema에 나중 sync를 위한 준비 포인트

현재 v0.1 스키마는 local-only 기준으로 충분하다. 다만 online 준비를 위해 향후 additive migration 후보를 미리 생각해둘 수 있다.

## 7.1 공통 sync metadata 후보
각 user-owned 테이블에 다음 컬럼을 나중에 붙일 수 있다.

- `remote_id TEXT`
- `sync_state TEXT` (`pending_upload | synced | conflict | failed`)
- `last_synced_at TEXT`
- `sync_error TEXT`
- `device_id TEXT` (선택)
- `deleted_at TEXT` 또는 tombstone 전략 (필요 시)

권장 원칙:
- 처음부터 v0.1에 넣지 않는다.
- backup/restore 또는 sync prep 단계에서 additive migration으로 붙인다.

## 7.2 row id 전략
현재 `TEXT` id 전략은 online 확장에 유리하다.
권장 방향:
- local id는 계속 app-generated string 유지
- remote에서도 client-generated id를 허용하거나, 별도 `remote_id`를 두어 매핑

## 7.3 timestamps 일관성
sync를 시작하면 아래가 중요해진다.
- `created_at`
- `updated_at`
- 가능하면 앱 전역에서 ISO string 생성 규칙 통일

---

## 8. backup / restore 아키텍처

## 8.1 가장 단순한 v1 방식
**snapshot backup**을 추천한다.

백업 단위 예시:
- `gyms`
- `visits`
- `fee_items`
- `app_settings`
- optional: `scenario_inputs`

제외 후보:
- `location_prompts`
- transient UI/session state

백업 payload 예시:
```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-04-02T12:34:56.000Z",
  "appVersion": "0.1.x",
  "tables": {
    "gyms": [...],
    "visits": [...],
    "fee_items": [...],
    "app_settings": [...]
  }
}
```

## 8.2 restore 전략
restore는 아래 모드로 나누는 것이 안전하다.

### replace restore
- 현재 로컬 데이터를 덮어쓴다.
- 새 기기/클린 설치에 적합

### import/merge restore
- 기존 로컬 데이터와 병합 시도
- 초기에는 지원하지 않거나 고급 기능으로 미룸

권장:
- 처음에는 **replace restore only**로 시작

## 8.3 backup 무결성 체크
권장 메타데이터:
- schema version
- export timestamp
- row counts
- optional checksum

---

## 9. sync 아키텍처 기본 방향

## 9.1 sync engine은 repository 밖에 둔다
repository는 여전히 local CRUD에 집중한다.
sync는 별도 coordinator 계층으로 두는 것이 좋다.

예상 구조:
- `repositories/` → local DB read/write
- `sync/SyncCoordinator.ts`
- `sync/SyncQueue.ts`
- `sync/SyncSerializer.ts`
- `sync/ConflictResolver.ts`
- `services/api/RemoteApiClient.ts`

이유:
- local data path를 유지
- backend 교체가 쉬움
- sync 실패가 local UX를 망치지 않음

## 9.2 첫 sync 단위
처음에는 row-level live sync보다 아래 방식이 더 안전하다.

- changed rows batch upload
- latest server snapshot fetch
- minimal pull/apply

## 9.3 conflict 전략
초기 권장 정책:
- **single-user / low-frequency edits 가정**
- 복잡한 field-level merge는 피함
- 테이블/엔티티별 단순 정책부터 시작

예:
- settings: last-write-wins 허용 가능
- gym: single primary 기준이므로 충돌 시 review 필요 가능
- fee_items: inactive/deactivate semantics 주의
- visits: `active` 상태 충돌은 특별 취급 필요

## 9.4 visits에서 가장 어려운 부분
`visits`는 sync에서 가장 민감하다.

어려운 상황 예시:
- 기기 A: active visit 유지 중
- 기기 B: 같은 visit를 completed로 변경
- 기기 A: 오프라인 상태에서 종료
- B에서 edit/cancel 수행

따라서 true sync 이전에는 다음 정책이 더 안전하다.
- active visit는 single-device 주도권을 갖는다.
- multi-device sync 초기에는 active visit 동시 수정 시 conflict review를 띄운다.

---

## 10. 권장 remote backend 범위

## 10.1 Stage 1~2에서 필요한 최소 backend 구성

### auth
- session issue/verify
- provider callback
- account identity

### backup service
- upload snapshot
- list snapshots
- fetch latest snapshot
- restore authorization

### user profile 최소값
- account id
- created_at
- last_backup_at
- plan / feature flags (선택)

## 10.2 Stage 3~4에서 추가될 backend 구성
- row change upload
- pull changes since cursor
- sync status endpoints
- conflict payload / resolution support

## 10.3 Stage 5 이후 shared data backend
- gym catalog
- normalized branches
- plan pricing quotes
- freshness / moderation metadata
- recommendation rules

---

## 11. API 계층 설계 원칙

## 11.1 API는 mobile domain을 그대로 복제하지 않는다
local table 구조를 API로 그대로 노출하면 나중에 유연성이 떨어질 수 있다.
권장:
- internal DB model
- transfer DTO
- public API contract
를 분리한다.

## 11.2 backup API와 sync API를 분리한다
처음부터 하나로 뭉치지 말고 역할을 나눈다.

예:
- `/auth/*`
- `/backup/create`
- `/backup/latest`
- `/restore/latest`
- `/sync/push`
- `/sync/pull`

## 11.3 mobile은 offline-first queue를 유지한다
API 실패 시:
- local write는 성공 상태 유지
- remote는 retry queue로 넘김
- 사용자에게 “저장 실패” 대신 “클라우드 동기화 지연” 식으로 표현

---

## 12. 웹 확장 원칙

## 12.1 read-first가 기본
웹을 처음 열 때는 입력보다 조회가 낫다.

초기 web 후보:
- dashboard read-only
- account / backups
- estimator / scenario viewer

## 12.2 web write는 sync 안정화 후
웹에서 visit/cost 수정까지 허용하면 distributed write surface가 늘어난다.
따라서 아래 이후에만 고려한다.
- mobile backup/restore 안정화
- single-user multi-device sync 안정화
- conflict 정책 최소한 확정

## 12.3 서버 계산 vs 로컬 계산
web이 생겨도 KPI 계산 규칙은 문서화된 domain calculation과 정합해야 한다.
가능한 한:
- 원천 데이터 동기화
- 계산 로직 재사용 또는 공유
를 우선한다.

---

## 13. 보안 / 프라이버시 원칙

## 13.1 처음 online에서 과하게 모으지 않는다
초기 remote에 올리는 데이터는 최소화한다.

### 올려야 하는 것
- user-owned gym/visit/fee/settings snapshot
- auth identity metadata

### 신중해야 하는 것
- raw location trace
- background event raw logs
- 민감한 디버그 로그

## 13.2 location_prompts 업로드는 우선순위 낮음
이 데이터는 보조/디버깅 성격이 강하므로,
초기 backup/sync 대상에서 제외하거나 opt-in으로 두는 것이 안전하다.

## 13.3 delete/restore UX 명확화
계정 삭제, 백업 삭제, local reset은 서로 다른 개념이므로 구분해야 한다.

---

## 14. 기술 스택 방향 제안

이 문서는 특정 벤더를 고정하지 않는다. 다만 현재 제품 방향을 고려하면 아래 기준이 중요하다.

## 14.1 auth/backend 선택 기준
- mobile auth SDK 안정성
- simple session model
- backup object storage 또는 document/blob 저장 용이성
- sync API 구현 단순성
- 운영 복잡도

## 14.2 DB 선택 기준
remote DB는 local SQLite schema와 1:1 복제를 강제할 필요는 없다.
다만 다음은 중요하다.
- user-scoped rows
- timestamps
- idempotent upsert 가능성
- backup/snapshot 저장 효율

## 14.3 object storage 역할
snapshot backup은 relational row sync 이전에는 object/blob 저장이 더 단순할 수 있다.
따라서 backup 초기에는:
- metadata는 DB
- payload는 object storage
형태도 충분히 현실적이다.

---

## 15. 추천 구현 순서

아래 순서를 권장한다.

### Step 1
local tracker release-ready 마감

### Step 2
online contract 문서화
- ownership
- backup payload
- restore mode
- sync metadata 후보

### Step 3
auth only
- sign in
- sign out
- session restore
- account screen 최소형

### Step 4
backup now / restore later
- manual backup
- latest backup fetch
- replace restore

### Step 5
background/periodic backup (선택)

### Step 6
sync metadata migration
- `remote_id`
- `sync_state`
- `last_synced_at`

### Step 7
single-user multi-device sync
- settings/gym 먼저
- fee_items/visits 다음

### Step 8
read-only web dashboard

### Step 9
web write 또는 shared catalog 실험

---

## 16. 앞으로의 기능 개발 운영 방식과의 연결

online expansion 이후에도, 새로운 기능은 계속 아래 순서를 따른다.

1. 문제 정의
2. 프론트 목업
3. 상태 설계
4. mock interactive prototype
5. local data path
6. online/API 필요성 평가
7. 필요한 경우만 backend 연결

즉, **online이 가능해져도 API-first로 돌아가지 않는다.**
여전히 local-first + mockup-first + domain-first 원칙을 유지한다.

특히 다음 기능군은 이 원칙이 중요하다.
- estimator/planner
- scenario 저장
- catalog search
- membership recommendation
- web dashboard

---

## 17. 이 문서 기준의 오픈 이슈

현재 시점에서 아직 고정하지 않아도 되는 것:
- 구체 auth provider 우선순위
- 구체 backend vendor
- sync conflict UI의 최종 UX
- web write 시점
- catalog/market 데이터의 moderation 방식

하지만 먼저 고정하면 좋은 것:
- local-first 유지 원칙
- auth보다 backup/restore 우선 원칙
- backup payload 범위
- sync metadata를 additive migration으로 붙인다는 원칙
- location_prompts를 초기 remote 대상에서 제외할 수 있다는 원칙

---

## 18. 최종 요약

이 문서의 핵심은 아래다.

- online 확장은 필요하지만, 지금 앱의 본질을 바꾸면 안 된다.
- local SQLite는 계속 1차 source of truth로 유지하는 것이 안전하다.
- online은 **auth → backup/restore → sync prep → true sync → web** 순서로 가는 것이 가장 현실적이다.
- sync는 repository가 아니라 별도 coordinator 계층으로 분리해야 한다.
- 실제 KPI 계산은 원천 데이터 중심, 재현 가능 구조를 유지해야 한다.
- shared catalog / recommendation / market 축은 장기적으로 가능하지만 tracker 축과 섞지 말아야 한다.

즉, 이 앱의 online future는 “서버 중심으로 갈아타는 것”이 아니라,
**local-first value tracker를 계정·백업·동기화·웹으로 확장하는 것**이다.

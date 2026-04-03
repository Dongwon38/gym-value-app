# Gym Value App — Backup and Restore Spec v0.1

## 문서 정보
- 문서명: Backup and Restore Spec
- 버전: v0.1
- 상태: Draft
- 작성 기준일: 2026-04-02
- 상위 문서:
  - Master Plan v0.1
  - Tech Architecture v0.1
  - Delivery Plan v0.1
  - Future Development Playbook v0.1
  - Online Expansion Architecture v0.1
- 목적: local-first 구조를 유지한 채, 계정 기반 온라인 확장의 첫 단계로서 **백업과 복원**의 범위, UX, 데이터 계약, 구현 순서를 정의한다.

---

## 1. 문서 목적

이 문서는 Gym Value App의 **첫 온라인 확장 기능**으로서, 백업과 복원을 어떻게 설계할지 정리하는 기준 문서다.

핵심 목적은 아래와 같다.
- local SQLite를 계속 source of truth로 유지한다.
- 로그인 이후에도 바로 “실시간 sync”로 가지 않고, 먼저 **snapshot backup / restore**를 도입한다.
- 사용자가 기기 교체, 앱 재설치, 실수로 인한 데이터 손실 상황에서 자신의 데이터를 되살릴 수 있게 한다.
- 향후 true sync로 확장할 수 있도록 payload / version / validation 규칙을 미리 정리한다.

이 문서는 “클라우드가 진실의 원천이 되는 구조”를 정의하지 않는다. 오히려 **로컬 우선 원칙을 유지하면서, 서버를 안전한 보조 저장소로 추가하는 방법**을 정의한다.

---

## 2. 왜 Backup / Restore가 먼저인가

현재 프로젝트는 local-first이며, 영속 데이터의 source of truth는 SQLite다. auth, sync, cloud backup은 MVP 이후 과제로 미뤄져 있고, sync를 붙일 때도 local DB를 source of truth로 유지한 뒤 sync engine을 추가하는 방향이 이미 열려 있다. 또한 현재 저장소 기준으로 manual MVP와 KPI MVP는 workspace automation scope에서 통과했지만, concrete native adapter와 real-device/native smoke는 아직 남아 있다. 따라서 지금 online 확장은 “모든 것을 동시에” 여는 것보다, **위험이 낮고 사용자가 바로 체감하는 보호 기능**부터 붙이는 것이 맞다.

백업/복원을 먼저 두는 이유는 아래와 같다.

1. **사용자 가치가 명확하다**
   - 기기 분실 / 앱 재설치 / 테스트 빌드 교체 시 데이터 보호
2. **구현 리스크가 상대적으로 낮다**
   - true sync보다 conflict resolution이 단순하다
3. **local-first 철학과 잘 맞는다**
   - 서버는 보조 저장소, 로컬이 진실
4. **향후 sync의 전 단계가 된다**
   - payload schema, account linkage, remote record ownership을 먼저 안정화할 수 있다

---

## 3. 범위 정의

## 3.1 v0.1 포함 범위
- 계정 로그인 후 **사용자 단위 백업 생성**
- 가장 최근 백업 1개 또는 소수의 snapshot 보관
- 백업 메타데이터 조회
- 사용자가 선택적으로 백업 실행
- 새 기기 또는 초기화된 기기에서 복원 실행
- 로컬 DB 전체 초기화 후 snapshot restore
- schema version / app version / created_at 메타데이터 포함

## 3.2 v0.1 제외 범위
- 실시간 양방향 sync
- row-level merge
- background auto-sync
- 여러 기기에서 동시에 수정된 데이터의 자동 병합
- web에서 row 단위 직접 편집
- partial restore
- point-in-time restore history를 여러 개 자세히 탐색하는 UI

즉, 이번 문서의 목표는 **backup / restore**, 아니다: **sync / merge / collaboration**.

---

## 4. 제품 원칙

### 4.1 local-first 유지
- 앱의 작동과 계산은 계속 로컬 SQLite 기준이다.
- 서버 snapshot은 보조 사본이다.

### 4.2 restore는 명시적 액션
- 사용자가 스스로 restore를 시작해야 한다.
- restore는 destructive action일 수 있으므로 확인 단계가 필요하다.

### 4.3 설명 가능한 동작
- backup은 “현재 기기의 데이터를 서버에 스냅샷으로 저장”하는 행위다.
- restore는 “서버 snapshot으로 현재 로컬 데이터를 교체”하는 행위다.
- 이 둘을 sync처럼 보이게 설명하지 않는다.

### 4.4 privacy 최소화
- raw location trace는 보내지 않는다.
- 기존 문서 원칙대로 gym 좌표/반경, 방문 기록 시간, fee items, settings 같은 핵심 앱 데이터만 포함한다.

---

## 5. 사용자 시나리오

### 5.1 시나리오 A — 수동 백업
1. 사용자가 계정 생성 또는 로그인
2. Settings > Backup & Restore 진입
3. “Back up now” 실행
4. 앱이 로컬 DB에서 snapshot payload 생성
5. 서버 업로드 성공
6. “Last backup: Apr 2, 2026 7:42 PM” 표시

### 5.2 시나리오 B — 새 기기 복원
1. 사용자가 새 기기에 로그인
2. 서버에 저장된 latest backup 존재
3. 앱이 restore 가능 안내 표시
4. 사용자가 “Restore this backup” 선택
5. 현재 로컬 DB 초기화 후 snapshot import
6. 앱 재부팅 또는 data refresh
7. Home / Visits / Costs / Settings에 이전 데이터 복원

### 5.3 시나리오 C — 백업 없음
1. 사용자가 로그인했지만 remote backup 없음
2. 앱은 빈 상태 유지
3. “No backup found” 안내
4. local-first onboarding 또는 수동 입력으로 계속 진행 가능

### 5.4 시나리오 D — schema mismatch
1. 사용자가 매우 오래된 backup을 restore하려고 함
2. 현재 앱 schema와 호환되지 않음
3. 앱은 restore를 차단하거나 migration 가능한 범위만 허용
4. 사용자에게 “This backup was created with an unsupported app/data version.” 안내

---

## 6. 백업 대상 데이터

v0.1 backup payload에는 아래를 포함한다.

### 6.1 필수 엔티티
- `gyms`
- `visits`
- `fee_items`
- `app_settings`
- `location_prompts` (존재하면 포함)

### 6.2 메타데이터
- `backup_id`
- `user_id`
- `created_at`
- `app_version`
- `data_schema_version`
- `device_label` 또는 `device_name` (선택)
- `timezone`
- `payload_format_version`
- entity counts

### 6.3 포함하지 않을 것
- runtime UI store
- local only debug logs
- ephemeral permission cache
- timer state
- raw location history / traces

---

## 7. 데이터 모델 제안 (온라인 측)

### 7.1 remote_backups
```ts
RemoteBackupRecord = {
  backupId: string
  userId: string
  createdAt: string
  appVersion: string
  dataSchemaVersion: number
  payloadFormatVersion: number
  deviceLabel?: string
  timezone?: string
  entityCounts: {
    gyms: number
    visits: number
    feeItems: number
    locationPrompts: number
    appSettings: number
  }
  blobSizeBytes: number
  checksumSha256: string
  snapshotJson: string // or storage object reference
}
```

### 7.2 저장 전략
v0.1에서는 아래 둘 중 하나를 선택할 수 있다.

#### 옵션 A — DB row에 JSON 직접 저장
- 장점: 단순함
- 단점: payload가 커지면 비효율

#### 옵션 B — object storage + metadata row
- metadata는 DB
- 실제 snapshot은 storage object
- 장점: 향후 확장성 좋음
- 단점: 구현 복잡도 약간 증가

권장:
- **초기에는 object storage + metadata row**
- 하지만 아주 빠르게 proof of concept를 해야 하면 DB row JSON도 가능

---

## 8. Payload 형식 제안

```json
{
  "payloadFormatVersion": 1,
  "dataSchemaVersion": 1,
  "createdAt": "2026-04-02T19:42:15.000Z",
  "appVersion": "0.1.0",
  "device": {
    "platform": "android",
    "label": "Pixel 7a"
  },
  "data": {
    "gyms": [],
    "visits": [],
    "feeItems": [],
    "appSettings": [],
    "locationPrompts": []
  }
}
```

### 8.1 원칙
- row 구조는 가능한 한 로컬 DB row와 유사하게 유지
- restore 시 mapper를 단순하게 유지
- payloadFormatVersion으로 형식 자체를 버전 관리
- dataSchemaVersion으로 로컬 migration 버전과 연결

---

## 9. Backup 동작 규칙

### 9.1 트리거
v0.1에서는 아래 두 가지만 허용한다.
- 수동 `Back up now`
- 중요한 저장 직후 optional debounce backup (선택)

권장:
- 첫 버전은 **수동 backup only**
- 자동 백업은 나중에 붙인다

### 9.2 백업 생성 순서
1. local DB readiness 확인
2. 현재 migration/schema version 조회
3. 각 엔티티 row export
4. canonical JSON 생성
5. checksum 계산
6. auth token 포함 업로드
7. remote metadata 저장
8. local에 `last_backup_at` 캐시 저장 (선택)

### 9.3 업로드 단위
- snapshot 단위 atomic upload
- 일부 엔티티만 성공하는 부분 업로드는 허용하지 않음

### 9.4 latest backup 정책
v0.1 단순화:
- user당 latest 1개만 유지하거나
- latest 3개까지 rolling retention

권장:
- **latest 3개 retention**
- 이유: 마지막 backup이 손상되거나 잘못된 상태일 수 있음

---

## 10. Restore 동작 규칙

### 10.1 기본 원칙
restore는 **replace local database** 모델로 간다.

즉:
- 현재 로컬 데이터를 원격 snapshot으로 덮어쓴다.
- row-level merge는 하지 않는다.

### 10.2 restore 전 체크
- user authenticated
- remote backup exists
- payloadFormatVersion supported
- dataSchemaVersion supported 또는 migration path 존재
- checksum valid

### 10.3 restore 순서
1. restore 후보 메타데이터 조회
2. 사용자 확인
3. 현재 로컬 DB 임시 백업 또는 export (선택)
4. local DB write transaction 시작
5. 기존 데이터 clear
6. snapshot rows insert
7. post-restore validation
8. session/UI cache reset
9. dashboard 재계산
10. 완료 화면 표시

### 10.4 restore 실패 시
- transaction rollback
- 기존 로컬 데이터 유지
- 사용자에게 restore 실패 메시지 표시

### 10.5 destructive 경고 문구 예시
- `Restoring will replace the current data on this device.`
- `Your existing local data will be overwritten.`

---

## 11. Merge 정책 (v0.1)

v0.1에서는 merge를 지원하지 않는다.

정리:
- backup: snapshot upload
- restore: snapshot replace
- sync: 아직 아님

이 단순화가 중요한 이유:
- conflict resolution 규칙을 섣불리 도입하지 않기 위함
- “backup/restore”와 “sync”를 사용자 경험에서도 구분하기 위함

---

## 12. UI / UX 제안

## 12.1 Settings 정보 구조
Settings에 새 섹션 추가:
- Account
- Backup & Restore

### 12.2 Backup & Restore 섹션 구성
- 로그인 상태 표시
- 마지막 백업 시각
- 마지막 백업 기기 이름
- `Back up now`
- `Restore from backup`
- backup 설명 문구

### 12.3 상태별 표시
#### Logged out
- `Sign in to back up your data.`
- CTA: `Sign In`

#### Logged in, no backup
- `No backup found for this account.`
- CTA: `Back up now`

#### Logged in, backup exists
- `Last backup: Apr 2, 2026, 7:42 PM`
- CTA: `Back up now`
- CTA: `Restore this backup`

### 12.4 복원 전 확인 모달
- backup created_at
- app/data version
- entity counts
- overwrite warning
- confirm button

---

## 13. API 제안 (최소)

## 13.1 POST /v1/backups
요청:
```json
{
  "payloadFormatVersion": 1,
  "dataSchemaVersion": 1,
  "appVersion": "0.1.0",
  "checksumSha256": "...",
  "snapshot": { }
}
```

응답:
```json
{
  "backupId": "bkp_123",
  "createdAt": "2026-04-02T19:42:15.000Z"
}
```

## 13.2 GET /v1/backups/latest
응답:
```json
{
  "exists": true,
  "backup": {
    "backupId": "bkp_123",
    "createdAt": "2026-04-02T19:42:15.000Z",
    "dataSchemaVersion": 1,
    "payloadFormatVersion": 1,
    "entityCounts": {
 "gyms": 1,
 "visits": 52,
 "feeItems": 4,
 "locationPrompts": 3,
 "appSettings": 1
    }
  }
}
```

## 13.3 GET /v1/backups/:backupId/download
응답:
- snapshot payload

### 13.4 인증
- bearer token
- userId는 server-side auth context 기준
- client가 임의 userId를 보내지 않도록 한다

---

## 14. 로컬 구현 구조 제안

### 14.1 새 모듈
- `src/features/backup/`
- `src/data/backup/`
- `src/services/cloud/`

### 14.2 주요 컴포넌트
- `BackupSettingsSection.tsx`
- `RestoreConfirmSheet.tsx`

### 14.3 주요 use case
- `createBackupSnapshot()`
- `uploadBackupSnapshot()`
- `fetchLatestBackupMetadata()`
- `downloadBackupSnapshot()`
- `restoreBackupSnapshot()`

### 14.4 주요 repository/helper
- `exportAllBackupRows()`
- `replaceDatabaseFromSnapshot()`
- `validateBackupPayload()`
- `computeBackupChecksum()`

### 14.5 계층 원칙
- UI는 backup 버튼/상태만 다룬다.
- export/import/validation은 application/data layer에서 처리한다.
- remote upload/download는 cloud service adapter로 분리한다.

---

## 15. Validation 규칙

### 15.1 upload 전 validation
- payloadFormatVersion 존재
- dataSchemaVersion 존재
- 필수 엔티티 배열 존재
- row id 중복 없음
- visits.status 유효성 확인
- fee_items.cadence 유효성 확인

### 15.2 restore 전 validation
- checksum 일치
- unsupported future version 차단
- 필수 테이블 데이터 구조 검사
- FK 관계 검사 가능 시 사전 검사

### 15.3 restore 후 validation
- primary gym 최대 1개
- active visit 최대 1개
- app_settings default row 존재
- dashboard query가 fatal 없이 실행 가능

---

## 16. 보안 / 개인정보 고려

### 16.1 전송
- HTTPS 필수
- 인증 토큰 필수

### 16.2 저장
- 서버 저장 시 at-rest encryption 사용 권장
- snapshot raw JSON은 내부 접근 최소화

### 16.3 민감도
이 앱은 고위험 의료 데이터는 아니지만, 아래는 여전히 개인 데이터다.
- gym 이름/위치
- 방문 시각
- 비용 정보

따라서 최소한 아래가 필요하다.
- 사용자 계정별 접근 통제
- backup download 권한 검증
- 과도한 debug logging 금지

---

## 17. 실패 / 엣지 케이스

### 17.1 backup 중 네트워크 끊김
- 업로드 실패로 처리
- 로컬 데이터 영향 없음
- 재시도 가능

### 17.2 backup payload 너무 큼
- 압축 고려
- entity count / payload size 제한 설정

### 17.3 restore 중 앱 종료
- transaction / temp DB 전략으로 partial restore 방지

### 17.4 다른 계정 backup 복원 시도
- server auth context mismatch로 차단

### 17.5 local data already exists
- restore 전 overwrite 경고 필수
- 필요 시 local export 제안은 후속 버전에서 고려

---

## 18. QA 전략

### 18.1 자동 테스트 우선
- snapshot export correctness
- payload validation
- checksum verification
- replace restore transaction
- unsupported version rejection

### 18.2 수동 테스트 우선
- login 후 backup 버튼 동작
- empty backup state UX
- restore confirmation UX
- restore 후 Home / Visits / Costs / Settings 데이터 복원 확인
- overwrite warning 확인

### 18.3 기기 QA
- Android 실제 기기에서 backup/restore smoke
- iOS 실제 기기에서 backup/restore smoke
- 앱 재설치 후 restore 시나리오 확인

---

## 19. 구현 순서 권장

### Step 1 — Auth minimal
- sign in / sign out
- auth token 확보
- account section 최소 UI

### Step 2 — Local export/import primitives
- export all rows
- validate payload
- replace local DB from snapshot

### Step 3 — Remote backup API 연결
- upload latest snapshot
- fetch latest metadata
- download latest snapshot

### Step 4 — Settings UI
- backup status
- back up now
- restore confirm

### Step 5 — QA hardening
- overwrite flows
- version mismatch handling
- reinstall/new device scenario

중요:
- **true sync보다 backup/restore를 먼저 출시**한다.

---

## 20. 이 기능이 준비되면 얻는 것

- 계정 기능의 첫 실사용 가치
- 데이터 유실 위험 감소
- 새 기기 전환 경로 확보
- payload/schema/version 체계 확립
- 이후 sync 설계의 발판 확보

즉, backup/restore는 단순 보조 기능이 아니라, **local-first 앱이 online 확장으로 넘어갈 때 가장 안전한 첫 다리**다.

---

## 21. 향후 문서 필요성

현재 문서 세트를 기준으로, 이 문서 이후에 **반드시 더 필요한 문서**는 많지 않다.

권장 최소 세트는 아래 정도면 충분하다.

### 꼭 필요할 가능성이 높은 것 (최대 2개)
1. **AUTH_AND_ACCOUNT_LINKING_SPEC_v0.1**
   - 로그인 방식, anonymous/local 사용자에서 계정 연결 시 데이터 처리, 계정 전환 정책
2. **SYNC_STRATEGY_v0.1**
   - 정말로 true sync에 들어갈 때만 작성
   - conflict resolution, push/pull, per-row sync state, tombstone 정책

### 당장은 문서 없이 코드로 진행 가능한 것
- concrete native adapter 구현
- release-ready QA
- backup UI mockup → local export/import prototype → API 연결

즉, 네가 문서를 너무 많이 늘리고 싶지 않다면:
- **이 문서까지 포함해서 당분간 충분하다.**
- 다음 문서는 많아야 **1개**, 많아도 **2개**면 된다.
- 그리고 그마저도 auth/sync를 실제로 시작할 때만 만들면 된다.

---

## 22. 최종 요약

- Gym Value App의 온라인 확장은 local-first를 유지해야 한다.
- 그래서 첫 단계는 true sync가 아니라 backup/restore가 맞다.
- backup은 snapshot upload, restore는 snapshot replace 모델로 시작한다.
- 서버는 아직 보조 저장소이며, 로컬 SQLite가 계속 진실의 원천이다.
- payload version, schema version, checksum, overwrite UX를 먼저 고정해야 한다.
- 이 기능이 준비되면, auth와 이후 sync로 가는 길이 훨씬 안전해진다.

# Gym Value App — Future Development Playbook v0.1

## 문서 정보
- 목적: 현재 구현 상태를 기준으로, 앞으로의 후속 개발 순서와 운영 원칙을 한 문서에 정리한다.
- 대상 독자: 제품 기획자, 개발자, AI 에이전트
- 성격: 실행 계획 + 의사결정 기준 + 기능 개발 운영 원칙
- 전제: 현재 저장소는 local-first manual MVP와 KPI MVP의 핵심 구현이 완료되었고, real-device/native smoke 및 release-ready 마감 작업은 아직 남아 있다.

---

## 1. 이 문서의 역할

이 문서는 단순 task 목록이 아니다.

이 문서의 역할은 다음과 같다.

1. 현재 구현 상태를 어디까지 완료로 볼지 정리한다.
2. 지금부터 무엇을 어떤 순서로 이어갈지 우선순위를 고정한다.
3. 온라인 확장(회원가입, 서버 저장, 백업/동기화, 웹/온라인 surface)을 어떤 순서로 붙일지 정한다.
4. 앞으로 새 기능을 붙일 때의 표준 작업 방식도 함께 고정한다.
5. 제품 철학이 흔들리지 않도록, 기술 순서뿐 아니라 “왜 이 순서로 가는지”까지 설명한다.

이 문서는 코어 문서를 대체하지 않는다.
- 제품 결정은 Product Spec
- 구조 결정은 Tech Architecture
- 계산/DB 기준은 Data Model and Calculation
- milestone/QA 기준은 Delivery Plan
- 세부 상태는 Implementation Checklist
을 따른다.

이 문서는 그 위에서 “현재 시점 이후의 실제 운영 계획”을 정리하는 companion 문서다.

로컬 제품 UX를 더 세부적으로 쪼갠 다음 실행 블록은
`POST_MVP_LOCAL_EXPANSION_PLAN_v0.1.md`
를 따른다.

---

## 2. 현재 기준선 정리

현재 저장소는 더 이상 “초기 착수 단계”가 아니다.
핵심 local-first tracker의 뼈대와 수동 기록 흐름, 그리고 Home KPI surface까지 이미 구현된 상태다.

### 이미 구현된 축
- monorepo + `apps/mobile` 기반 React Native 앱 baseline
- navigation shell + 4탭 구조
- SQLite bootstrap + migration runner + `001_initial_schema`
- gym / cost / visit / settings CRUD
- current year 기준 dashboard 조립
- Home KPI 카드, empty state, retry surface
- assisted flow용 service contract / prompt persistence / controller wiring
- manual-only fallback UI와 restore/review 경고 흐름

### 이미 확보된 검증 축
- lint / Jest 기반 workspace automation evidence 존재
- manual MVP 범위의 CRUD / calculation / Home KPI 검증 evidence 존재
- assisted check-in wiring과 fallback polish에 대한 workspace-level evidence 존재

### 아직 남은 것
- concrete native adapter 구현
- Android real-device geofence / notification / action smoke
- iOS background / parity QA
- first-run setup flow / release metadata / signing / archive 점검
- native runtime 관점의 release-ready smoke

즉, 지금은 “아직 아무것도 안 된 상태”가 아니라,
**코어 tracker는 구현되었고, 이제 device reality와 release quality로 넘어가는 시점**이다.

---

## 3. 앞으로도 유지해야 할 제품 철학

후속 개발이 길어질수록 기능이 늘어나고 축이 흔들릴 수 있다.
그래서 아래 원칙은 계속 고정한다.

### 3.1 앱의 본질은 tracker다
이 앱의 1차 본질은 다음이다.
- gym 방문을 쌓는다.
- gym 관련 비용을 쌓는다.
- 그것을 기준으로 사용자의 membership value를 계산한다.

즉, 본질은 fitness tracking이 아니라 **value tracking**이다.

### 3.2 local-first는 전략이 아니라 정체성이다
- 로컬 SQLite가 여전히 source of truth다.
- 서버를 붙이더라도 “앱이 서버 없이는 의미가 없는 구조”로 뒤집지 않는다.
- 온라인 확장은 local-first를 보조하는 방식으로 붙인다.

### 3.3 자동화는 보조, 최종 진실은 record다
- location / notification / prompt는 제안 시스템이다.
- 최종 truth는 `visit` row다.
- user edit/delete/manual add가 항상 더 강한 권한을 가진다.

### 3.4 새 기능보다 숫자의 신뢰성이 우선이다
- cost per visit
- cost per hour
- total paid
- duration / status / null handling
이 흔들리면 앱 전체 신뢰가 무너진다.

### 3.5 online 확장은 “로그인 붙이기”가 아니라 “데이터 계약 재설계”다
회원가입 자체보다 더 어려운 것은 아래다.
- local ↔ remote ownership
- conflict resolution
- restore / merge
- multi-device edit semantics
- sync failure recovery

따라서 auth는 가볍게 붙일 수 있어 보여도,
실제로는 **sync 설계가 핵심 난이도**라는 점을 계속 염두에 둔다.

---

## 4. 지금부터의 전체 개발 전략

앞으로의 큰 흐름은 아래 5단계로 간다.

1. **Tracker Stabilization**
2. **Release-Ready Local MVP**
3. **Core Product Expansion (local-first)**
4. **Online Foundation**
5. **True Sync / Multi-device / Web Expansion**

중요한 점은,
**3단계 이전에 제품의 핵심 tracker를 흔들지 않는 것**,
그리고 **4단계 이전에 full sync를 성급하게 시작하지 않는 것**이다.

---

## 5. Phase A — Tracker Stabilization

### 목표
현재 구현된 local tracker와 assisted flow wiring을 “실제 기기 기준으로 신뢰 가능한 상태”로 만드는 것.

### 왜 먼저 해야 하나
현재 문서와 구현 상태를 종합하면,
manual MVP와 KPI MVP는 workspace automation scope 기준으로 pass이고,
assisted wiring도 stub/service contract 기준으로 연결되었다.
하지만 아직 native adapter와 real-device QA가 남아 있다.

즉, 지금 가장 먼저 필요한 것은 “새로운 큰 기능”이 아니라,
**이미 만든 것을 기기 현실에 맞게 잠그는 작업**이다.

### 이 단계의 주요 작업

#### A-1. concrete native adapter 구현
- `PermissionService`
- `LocationService`
- `NotificationService`
- 필요한 경우 `AppLifecycleService` device behavior 점검

#### A-2. Android 우선 device smoke
- geofence enter/exit delivery
- notification display
- action tap handling
- active visit restore
- permission denial / manual fallback

#### A-3. iOS parity QA
- background behavior
- location / notification permission UX
- active visit restore
- timer / lifecycle 자연스러움

#### A-4. regression hardening
- weird duration
- duplicate active visit
- prompt error fallback
- DB reopen / relaunch persistence

### 이 단계에서 하지 않을 것
- auth
- sync
- backend API
- estimator 대형 기능
- gym catalog

### 종료 기준
아래가 충족되면 Phase A 완료로 본다.
- Android real-device assisted flow가 최소 1회 end-to-end 검증됨
- iOS에서 crash-free 기본 흐름 확인
- manual-only fallback이 실제 기기에서도 자연스럽게 동작
- relaunch / background / permission denial에서 데이터 무결성 유지

---

## 6. Phase B — Release-Ready Local MVP

### 목표
앱을 “개발용 구현물”에서 “출시 가능한 local-first tracker”로 끌어올리는 것.

### 핵심 관점
이 단계는 새 기능 추가보다,
**첫 사용자 경험, release 품질, copy, metadata, 운영 안정성**을 정리하는 단계다.

### 주요 작업

#### B-1. first-run setup QA 및 간소화
- first-run 흐름 검토
- gym 없이 Home 진입
- cost 없이 KPI 진입
- permission 교육 문구 다듬기
- manual-only 모드 이해성 개선

#### B-2. release metadata 정리
- app icon
- app name
- bundle id / application id 확인
- signing / archive / release build 점검
- permission usage descriptions 검토

#### B-3. quality polish
- empty states
- error states
- loading / disabled states
- spacing / layout / copy consistency
- long-running active visit review copy

#### B-4. smoke / sanity pass
- Android release build test
- iOS archive/build 점검
- crash scenario smoke
- SQLite relaunch persistence 확인

### 종료 기준
- release build / archive 가능
- first-run~first-visit까지 막힘 없음
- manual-only value proposition이 분명함
- location automation 실패가 앱 전체 신뢰를 깨지 않음

---

## 7. Phase C — Core Product Expansion (local-first)

### 목표
로그인/서버보다 먼저,
제품 핵심 가치를 더 강하게 만드는 기능을 local-first 방식으로 확장한다.

이 단계는 “기존 tracker를 더 좋은 제품으로 만드는 단계”다.

### 왜 online보다 먼저 권장하는가
온라인 확장은 비용이 크고, 제품 정의를 바꿀 수 있다.
반면 아래 기능들은 현재 가치 제안과 직접 연결되며,
local-only 상태에서도 충분히 실험하고 개선할 수 있다.

### 추천 우선순위

#### C-1. Cost system expansion
다음 local 제품 확장의 첫 블록은 비용 입력/계산 UX 자체를 다시 잡는 것이다.

핵심 방향:
- starter cost line 4종 우선
- `one_time / bi_weekly / monthly / annual` 실제 지원
- 세전 입력 + 세후 preview
- `inherit_default / none / custom` tax mode
- optional `billing_anchor_date`

세부 실행 순서는
`POST_MVP_LOCAL_EXPANSION_PLAN_v0.1.md`
의 `LXP-COST-*`를 따른다.

#### C-2. Settings selector UX
- currency / locale / GST / PST를 raw text보다 preset-first 구조로 개선
- `BC, Canada` 같은 region preset과 `Custom` override 분리

#### C-3. Gym search assist
- gym search 결과 선택 시 좌표 / timezone 자동 채움
- radius default `30m`
- manual override 유지

#### C-4. Onboarding redesign
- settings / gym / starter cost setup이 정리된 뒤 onboarding을 wrapper로 조립
- permission은 마지막 optional step으로 유지

#### C-5. Home 초기 데이터 부족 상태 개선
현재 네가 지적한 것처럼,
처음 1~2회 방문만으로 나온 KPI는 사용자가 숫자를 불신할 수 있다.
따라서 아래 상태 분리가 중요하다.
- Empty
- Learning / Projected
- Actual

추천 방향:
- tracked days와 completed visits가 적을 때는 projected mode 우선
- 일정 조건 이후 actual을 primary로 승격
- actual / projected / scenario를 명확히 라벨링

#### C-6. Personal insight 강화
- “2 more visits this month…” 류의 안내
- 현재 pace 기반 projected KPI
- avg visit length / active day 기반 보조 해석

#### C-7. Estimator / Planner 기능
이건 tracker와 별도지만 강하게 연결된다.

입력 예시:
- gym 이름
- monthly / annual / day pass 비용
- signup fee
- tax
- expected visits per week / month

출력 예시:
- projected yearly cost
- projected cost per visit
- projected cost per hour
- day pass vs monthly vs annual 비교

중요:
이 기능은 **실측 tracker와 분리된 scenario tool**로 둔다.
Home의 actual KPI와 섞지 않는다.

#### C-8. Scenario 저장
- 사용자가 계산기에서 입력한 가정값을 local에 저장
- 최근 시나리오 다시 보기
- 나중에 online 분석으로 보낼 수 있게 구조만 열어둠

### 이 단계에서 하지 않을 것
- 아직 public gym catalog를 핵심으로 전환하지 않음
- 아직 multi-device sync를 시작하지 않음
- 아직 서버를 source of truth로 전환하지 않음

### 종료 기준
- 제품이 단순 tracker를 넘어서 “value coach”처럼 느껴짐
- 하지만 여전히 local-only로 성립 가능함
- actual / projected / scenario가 UI와 데이터 모델에서 명확히 분리됨

---

## 8. Phase D — Online Foundation

### 목표
로그인, 서버 저장, 온라인 복구/백업의 기초를 만든다.
단, 이 단계에서도 local-first 원칙은 유지한다.

### 핵심 원칙
서버는 처음부터 “절대적인 진실 저장소”가 아니라,
**identity + backup + sync preparation layer**로 붙인다.

### 권장 순서

#### D-1. remote data ownership 설계
먼저 아래를 문서로 고정한다.
- local row id와 remote id 관계
- user ownership model
- upload 대상과 upload 제외 대상
- merge 우선순위
- delete / inactive / cancelled 처리 정책
- privacy-sensitive data 범위

#### D-2. auth 도입
가장 단순한 인증부터 시작한다.
예:
- email magic link
- Apple / Google sign-in

중요:
이 단계에서는 “로그인 성공”보다
**로컬 사용자 데이터를 계정과 안전하게 연결하는 것**이 더 중요하다.

#### D-3. backup/restore first
full sync 전에 먼저 아래를 한다.
- local snapshot upload
- server backup 저장
- 새 기기 또는 재설치 후 restore

즉, 처음 online 단계는 “양방향 live sync”보다
**account-linked backup and restore**가 우선이다.

#### D-4. minimal backend API
초기 online API 범위는 작게 유지한다.
- auth/session
- backup upload
- backup list / latest backup fetch
- restore endpoint
- maybe user profile/settings sync 최소값

#### D-5. sync metadata 준비
나중 sync를 위해 아래를 심는다.
- `remote_id`
- `last_synced_at`
- `dirty` / `sync_state`
- `sync_error`
- `updated_at` 일관성

### 왜 이 순서인가
많은 제품이 auth를 먼저 붙이고 바로 sync로 가다가 복잡성이 폭증한다.
이 앱은 local-first이므로,
**auth → backup/restore → sync prep** 순서가 훨씬 안전하다.

### 종료 기준
- 사용자는 계정을 만들 수 있다.
- 로컬 데이터를 계정에 백업할 수 있다.
- 재설치 / 새 기기에서 restore가 가능하다.
- 여전히 local app이 먼저 살아 있고, server는 보조다.

---

## 9. Phase E — True Sync / Multi-device / Web Expansion

### 목표
단순 backup을 넘어,
실제 multi-device / web-connected product로 확장한다.

### 이 단계의 본질
이 단계는 단순 기능 추가가 아니라,
제품 구조가 “single-device local app”에서 “distributed system”으로 넘어가는 단계다.
그래서 조심스럽게 들어가야 한다.

### 권장 순서

#### E-1. single-user multi-device sync
- one account, two devices
- visit / fee / settings sync
- duplicate row merge
- conflict handling

#### E-2. sync conflict policy 확정
예:
- last-write-wins 여부
- field-level merge 여부
- active visit conflict 처리
- cancelled / inactive semantics

#### E-3. web read-only 또는 admin-like surface
처음 웹은 write-heavy보다 read-first가 안전하다.
예:
- dashboard read-only
- settings read-only
- exported summary

#### E-4. web write support
그 다음에야 웹에서 cost / visit 수정 같은 write 기능을 연다.

### 강한 권장
**웹 입력(write)과 multi-device sync를 동시에 처음부터 크게 열지 말 것.**
먼저 mobile restore/sync를 안정화한 뒤 웹을 붙이는 편이 좋다.

---

## 10. 장기 확장 축 — Catalog / Market / Recommendation

이건 지금 당장 핵심이 아니지만,
너가 말한 방향성은 분명 가치가 있다.

### 장기 축 예시
- normalized gym catalog
- 지역별 gym plan database
- user-submitted price quotes
- estimator 기반 추천
- referral / partnership / marketplace

### 하지만 지금은 이렇게 본다
- **Tracker**가 1축
- **Estimator / Advisor**가 2축
- **Catalog / Market**은 3축

즉, 3축으로 갈 수는 있지만,
처음부터 축을 섞지 말고 단계적으로 열어야 한다.

### 권장 순서
1. tracker 안정화
2. estimator local-first 검증
3. scenario data 구조 정리
4. online foundation
5. catalog / market 실험

---

## 11. 앞으로의 표준 기능 개발 방식

여기서부터는 매우 중요하다.
앞으로 새 기능을 붙일 때는,
항상 아래 순서를 기본 작업 방식으로 한다.

## 11.1 원칙
**새 기능은 프론트 목업과 상태 설계를 먼저 확정하고, 그 다음 로컬 데이터 연결, 마지막에 API/서버를 붙인다.**

즉:
1. 기능 정의
2. 화면 목업
3. 상태/카피 확정
4. local mock 또는 fake data 연결
5. domain / use case 설계
6. SQLite / local persistence 연결
7. 필요 시 API / backend 연결
8. QA / polish / release

이 순서를 기본 operating model로 채택한다.

---

## 11.2 상세 단계

### Step 0. 문제 정의
먼저 아래를 짧게 문서화한다.
- 이 기능이 해결하는 문제는 무엇인가
- 누구를 위한 것인가
- tracker 핵심 가치와 어떤 관계가 있는가
- must / should / later 범위는 무엇인가

### Step 1. 프론트 목업 우선
- lo-fi 또는 mid-fi mockup
- fake numbers / fake states 사용 가능
- 실제 DB/API 연결 전에 시각적으로 먼저 확인

이 단계의 목적은:
- UX를 빨리 본다
- 방향을 빨리 수정한다
- backend나 schema를 성급히 잠그지 않는다

### Step 2. 상태 설계 먼저
각 화면은 최소 아래 상태를 먼저 그린다.
- empty
- loading
- populated
- error
- edge case / warning

필요하면 추가:
- projected
- actual
- editing
- locked / disabled

### Step 3. mock data 기반 interactive prototype
- 실제 느낌으로 눌러볼 수 있어야 한다.
- 저장 전 preview / validation / CTA 흐름 확인
- 여기서 카피와 시각 우선순위를 조정한다.

### Step 4. 제품 확정 후 domain/use case 정리
화면이 어느 정도 고정되면 그때 아래를 정리한다.
- use case
- selector
- validation
- state ownership
- repository contract
- out-of-scope

### Step 5. local DB / persistence 연결
서버가 필요 없는 기능이라면 여기서 끝날 수도 있다.
local-first 제품이므로,
가능하면 local data path를 먼저 완성한다.

### Step 6. backend/API는 정말 필요할 때만 붙인다
API는 아래 조건에서만 붙인다.
- cross-device가 필요함
- server-owned data가 있음
- catalog / shared data가 필요함
- backup / sync / identity가 필요함

### Step 7. QA와 polish
- automated test
- manual smoke
- device reality
- copy/spacing
- release behavior

---

## 12. AI 에이전트 / 사람 협업 운영 규칙

### 문서 우선순위
1. Master Plan
2. Product Spec
3. Tech Architecture
4. Data Model and Calculation
5. Delivery Plan
6. Implementation Checklist
7. QA reports
8. Post-MVP Local Expansion Plan
9. Online Expansion Architecture
10. Backup and Restore Spec
11. 본 문서

### 작업 시작 전
모든 작업은 아래 3문장을 먼저 확인하고 시작한다.
- 이 작업은 tracker 핵심 가치를 강화하는가?
- local-first를 깨지 않는가?
- 실제 truth record와 suggestion/event를 혼동하지 않는가?

### 작업 완료 후
아래 중 해당 문서를 반드시 갱신한다.
- 제품 결정 변경 → Product Spec
- 구조/레이어 변경 → Tech Architecture
- 계산/DB 변경 → Data Model / Initial Schema
- milestone/순서 변경 → Delivery Plan
- 상태 변경 → Implementation Checklist
- post-MVP local UX 순서 변경 → Post-MVP Local Expansion Plan
- 검증 완료 → QA report

---

## 13. 지금 당장 추천하는 다음 실행 순서

가장 현실적인 바로 다음 순서는 아래다.

### Block 1 — Device Reality Lock
1. concrete native adapter 구현
2. Android real-device assisted smoke
3. iOS parity smoke
4. relaunch / permission / fallback QA

### Block 2 — Release-Ready Local Tracker
5. release signing / metadata / icons
6. first-run / empty-state / copy polish
7. release candidate smoke
8. 현재 setup flow pain point를 반영한 copy 점검

### Block 3 — Local Product UX Expansion
9. 비용 입력 스펙/스키마 변경 잠금 (`LXP-COST-01`)
10. `bi_weekly` / `tax_mode = none` / `billing_anchor_date` 구현
11. starter cost line UI 재작성
12. region preset / currency / tax selector UX 개선
13. gym search / autofill + radius `30m` default
14. onboarding을 최종 setup flow 위에서 재구성

### Block 4 — Broader Product Expansion
15. Home learning/projected/actual 상태 설계
16. estimator / planner lo-fi mockup
17. fake data interactive prototype
18. local scenario persistence 설계 및 연결

### Block 5 — Online Foundation
19. auth/backups/sync architecture note 작성
20. user identity + remote ownership 정의
21. backup/restore API부터 구현
22. 그 다음에 true sync 설계 시작

---

## 14. 추천 백로그 우선순위

### P0 — 반드시 먼저
- concrete native adapters
- Android/iOS real-device smoke
- release-ready QA
- first-run setup QA
- first-run polish

### P1 — tracker를 더 좋게 만드는 것
- cost system expansion
- region preset / tax selector UX
- gym search assist
- onboarding redesign
- learning/projected Home states
- better insights
- long-running active visit review polish
- estimator/planner local prototype

### P2 — online foundation
- auth
- account linking
- backup/restore
- sync metadata

### P3 — 더 큰 확장
- multi-device sync
- web read-only surface
- gym catalog
- regional pricing data
- referral / marketplace ideas

---

## 15. 하지 말아야 할 것

아래는 순서를 망치기 쉬우므로 의도적으로 피한다.

### 15.1 auth를 먼저 붙이고 tracker를 나중에 다듬는 것
이 경우 local-first 가치가 약해지고,
서버 구조가 실제 제품 학습보다 먼저 고정될 수 있다.

### 15.2 web과 mobile write를 동시에 크게 여는 것
conflict complexity가 너무 빨리 커진다.

### 15.3 mockup 없이 schema/API부터 잠그는 것
나중에 UX 변경 비용이 훨씬 커진다.

### 15.4 projected / scenario / actual 숫자를 한 카드에 섞는 것
사용자 신뢰를 해친다.

### 15.5 sync 전에 conflict policy 없이 remote save만 붙이는 것
버그보다 더 위험한 “겉으로만 되는 시스템”이 될 수 있다.

---

## 16. 최종 요약

앞으로의 방향은 단순하다.

1. **이미 만든 local-first tracker를 실제 기기 기준으로 잠근다.**
2. **release-ready quality까지 올린다.**
3. **그 다음 local-first 제품 확장을 시작하되, 먼저 비용 입력 모델과 setup UX를 다시 잡는다.**
4. **온라인 확장은 auth보다 먼저 backup/sync 계약부터 설계한다.**
5. **새 기능은 항상 mockup-first → local-first → API-last 순서로 개발한다.**

즉, 앞으로의 핵심은

**“지금 만든 코어 tracker를 확실히 완성한 뒤, 그 위에 더 큰 제품 축을 단계적으로 얹는 것”**

이다.

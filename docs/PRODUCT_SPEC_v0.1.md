# Gym Value App — Product Spec v0.1

## 문서 정보
- 문서명: Product Spec
- 버전: v0.1
- 상태: Draft
- 상위 문서: Master Plan v0.1
- 목적: 제품 기능, 사용자 플로우, 화면 요구사항, 상태 정책, 엣지 케이스를 하나의 기준 문서로 정의

---

## 1. 문서 목적

이 문서는 Gym Value App의 **제품 명세 문서**이다.

이 문서의 목적은 다음과 같다.
- 사용자가 무엇을 할 수 있어야 하는지 정의한다.
- 화면별 역할과 UI/UX 요구사항을 정의한다.
- 기능별 상태값과 정책을 정의한다.
- 누락, 오탐, 수동 수정 같은 현실적인 사용 상황을 반영한다.
- 이후 기술 문서(architecture, data model, delivery plan)의 기준점이 된다.

이 문서는 디자인 시안 문서가 아니라, **기능 중심 UX/제품 명세서**다.

---

## 2. 제품 요약

Gym Value App은 사용자가 gym 방문을 쉽게 기록하고, 총 지출 대비 방문당 비용과 시간당 비용을 확인할 수 있게 해주는 로컬 우선 앱이다.

핵심 컨셉은 다음과 같다.
- gym 근처에 오면 알림을 통해 체크인을 쉽게 제안한다.
- 사용자는 탭 1회로 방문을 기록할 수 있다.
- 자동화는 보조 역할을 하며, 최종 기록은 사용자가 수정/삭제/수동 추가할 수 있다.
- 가장 중요한 숫자는 **방문당 비용**이다.

---

## 3. 제품 목표

### 3.1 핵심 목표
1. 사용자가 gym 방문을 부담 없이 기록할 수 있어야 한다.
2. 위치 기능이 완벽하지 않아도 앱의 신뢰성이 유지되어야 한다.
3. 사용자가 자신의 gym membership 가치를 쉽게 체감할 수 있어야 한다.
4. MVP는 단순하지만, 나중에 다중 gym/동기화/고급 통계로 확장 가능해야 한다.

### 3.2 비목표
다음은 MVP의 목표가 아니다.
- 운동 종목/세트/반복 횟수 추적
- 개인 트레이닝 프로그램 관리
- 칼로리/심박수 추적
- 소셜 랭킹
- 복잡한 fitness analytics

---

## 4. 사용자 시나리오

### 4.1 시나리오 A — 정상 체크인
- 사용자는 gym에 도착한다.
- 앱은 geofence 진입을 감지한다.
- 앱은 로컬 알림으로 체크인을 제안한다.
- 사용자는 알림 또는 앱 홈에서 `Check In`을 누른다.
- 방문이 active 상태가 된다.
- 운동 후 사용자는 `End Visit`을 누르거나, 앱은 이탈 감지 후 종료를 제안한다.
- 방문 기록이 완료된다.
- 방문당 비용/시간당 비용이 업데이트된다.

### 4.2 시나리오 B — 체크인 놓침
- 사용자는 gym에 갔지만 알림을 못 봤거나, 휴대폰을 두고 갔다.
- 나중에 사용자는 앱에서 직접 `Add Visit`를 선택한다.
- 날짜, 시작시간, 종료시간을 수동으로 입력한다.
- 저장 후 통계가 업데이트된다.

### 4.3 시나리오 C — 오탐 또는 잘못된 기록
- 앱이 잘못된 시점에 체크인 후보를 띄웠다.
- 사용자는 무시하거나, 이미 생성된 기록을 삭제/수정한다.
- 통계는 수정된 값을 기준으로 재계산된다.

### 4.4 시나리오 D — 과거 기록 정리
- 사용자는 일주일치를 한꺼번에 회상해서 입력하고 싶다.
- 기록 화면에서 수동 방문을 여러 개 추가한다.
- 앱은 이 기록들을 일반 방문과 동일하게 통계에 반영한다.

---

## 5. 정보 구조 / 화면 구조

MVP 화면은 아래 4개를 기준으로 한다.

1. Home
2. Visits
3. Costs
4. Settings

추가적으로 공통 modal/sheet 화면이 있다.
- Add/Edit Visit
- Add/Edit Cost Item
- Gym Setup
- Permission Prompt / Education Sheet

---

## 6. Home 화면 명세

### 6.1 목적
Home은 앱의 핵심 가치가 가장 강하게 드러나는 화면이다.
사용자는 이 화면에서 **현재 자신의 gym 이용 가성비**를 즉시 이해해야 한다.

### 6.2 핵심 역할
- 메인 KPI 노출
- active visit 상태 표시
- 즉시 체크인/종료/수동추가 액션 제공
- 요약 통계 노출

### 6.3 상단 KPI 카드
가장 상단에는 가장 큰 숫자로 아래 값을 보여준다.

- **`$X.XX / visit`**

보조 정보 예시:
- This year: 42 visits
- Total time: 96h 30m
- Total paid: $241.50

### 6.4 KPI 카드 요구사항
- 숫자는 큰 폰트로 강조
- 기간 기준은 기본적으로 current year
- 값이 없으면 친절한 empty state 문구 노출

예:
- `No visits yet`
- `Add your first visit to start tracking your value`

### 6.5 Active Visit 카드
active visit가 있으면 KPI 카드 아래 별도의 상태 카드 표시

표시 내용:
- Checked in
- 시작 시간
- 경과 시간
- 현재 gym 이름
- 주요 버튼: `End Visit`

선택적으로 보조 버튼:
- `Edit Start Time`

### 6.6 주요 액션 버튼
Home에서 제공하는 최소 액션:
- `Check In`
- `End Visit` (active visit가 있을 때만)
- `Add Visit Manually`

버튼 정책:
- gym 근처일 때 `Check In`을 더 강조
- active visit 중에는 `Check In` 대신 `End Visit` 우선 노출
- 수동 추가 버튼은 항상 접근 가능

### 6.7 하단 요약 카드 / grid
Home 하단에는 compact card 또는 grid 형태로 아래 정보를 표시한다.
- Cost per hour
- This month visits
- Total hours this year
- Average visit length
- Recent visit
- Monthly paid estimate

### 6.8 Home empty state
아래 상황에서는 empty state가 필요하다.

#### A. gym 미설정
- 메시지: gym을 먼저 등록하라는 안내
- CTA: `Set Up Gym`

#### B. 비용 미설정
- 메시지: 비용을 추가해야 가치 계산이 가능하다는 안내
- CTA: `Add Costs`

#### C. 방문 기록 없음
- 메시지: 첫 방문을 추가하라는 안내
- CTA: `Add Visit`

---

## 7. Visits 화면 명세

### 7.1 목적
사용자가 자신의 방문 기록을 보고, 수정하고, 삭제하고, 새로 추가하는 중심 화면이다.

### 7.2 핵심 역할
- 전체 방문 기록 탐색
- 과거 방문 수정
- 잘못된 방문 삭제
- 수동 방문 추가
- 누락 방문 복구

### 7.3 기본 구성
- 상단 필터/정렬 영역
- 방문 리스트
- floating action 또는 상단 버튼: `Add Visit`

### 7.4 리스트 항목 정보
각 방문 row는 최소한 아래를 보여준다.
- 날짜
- 시작시간 ~ 종료시간
- 총 체류시간
- source indicator (optional, 작게)
- gym 이름 (MVP에서는 숨기거나 작게)

### 7.5 방문 상세 / 편집 진입
리스트 항목을 탭하면 편집 modal 또는 상세 화면으로 진입

수정 가능한 값:
- 날짜
- 시작 시간
- 종료 시간
- duration(직접 편집 대신 자동 계산 권장)
- notes (optional)

### 7.6 삭제 정책
- 사용자는 방문 기록을 삭제할 수 있어야 한다.
- 삭제 시 확인 다이얼로그 필요

예:
- `Delete this visit?`
- `This will update your totals and cost metrics.`

### 7.7 수동 방문 추가
사용자는 언제든 직접 방문 이벤트를 추가할 수 있어야 한다.
이 기능은 핵심이다.

입력 항목:
- 날짜
- 시작 시간
- 종료 시간
- gym
- notes (optional)

기본값 제안:
- 날짜: 오늘
- 시작/종료: 최근 사용 패턴 기반 또는 현재 시간 기준 근접값

### 7.8 방문 입력 validation
- 종료시간은 시작시간 이후여야 한다.
- duration이 0 또는 음수이면 저장 불가
- 비정상적으로 긴 방문(예: 12시간 이상)은 경고
- 날짜가 너무 미래면 저장 불가

### 7.9 누락 복구 후보
위치 이벤트가 있었지만 확정 방문이 없는 경우, Visits 화면 상단 또는 별도 섹션에서 제안 가능

예:
- `Possible missed gym visit on Mar 18, 6:12 PM`
- CTA: `Review`

사용자는 아래 중 하나를 선택 가능
- create visit
- ignore
- dismiss permanently

MVP에서는 이 기능이 없어도 되지만, 설계상 고려한다.

---

## 8. Costs 화면 명세

### 8.1 목적
사용자가 membership 관련 비용을 등록하고 관리하는 화면이다.
비용이 정확해야 방문당 비용과 시간당 비용이 유효해진다.

### 8.2 핵심 역할
- 비용 항목 추가
- 비용 항목 수정
- 비용 항목 삭제
- 세금 설정 확인
- 어떤 비용이 현재 계산에 반영되는지 이해할 수 있게 함

### 8.3 기본 비용 카테고리
기본 제공 카테고리:
- Monthly Membership
- Annual Fee
- Sign-up Fee
- Locker Fee
- PT
- Other

### 8.4 사용자 정의 항목 (비용 라인)
사용자는 `Other` 카테고리 또는 표시용 **커스텀 label**을 통해 자유롭게 **비용 항목(라인)**을 추가할 수 있어야 한다. 이는 “사용자가 스스로 항목을 정의한다”는 의미이며, **`fee_items.cadence` 값이 `custom`인 것과는 별개**다(§8.6.1 참고).

예:
- towel service
- parking
- class pass
- towel rental

### 8.5 비용 항목 속성
각 비용 항목은 아래 값을 가진다.
- label
- category
- amount
- cadence
- start date
- end date (optional)
- tax mode
- active 여부

### 8.6 cadence 종류
- one-time
- monthly
- annual
- `custom` — 스키마·데이터 모델 상 enum으로는 존재할 수 있으나, **v0.1 UI에서는 선택지로 노출하지 않는다**. 계산 규칙도 v0.1에서 확정하지 않는다(Data Model §13.5).

### 8.6.1 「사용자 정의 항목」과 `cadence = custom` 구분
| 구분 | 의미 | v0.1 |
|------|------|------|
| 사용자 정의 비용 **라인** | §8.4 — Other·label로 추가하는 항목 | 허용·UI 제공 |
| `cadence = custom` | 반복 규칙 enum 중 하나 | 스키마만, UI·계산 규칙 미확정 |

### 8.7 세금 설정 UX
각 비용 항목은 아래 둘 중 하나를 선택한다.
- inherit app default
- custom tax

custom tax 선택 시:
- GST rate
- PST rate

### 8.8 삭제와 비활성화
비용 항목은 완전 삭제 또는 inactive 처리 가능

정책:
- 과거 계산과 충돌을 피하려면 실제 구현에서는 soft-delete 또는 inactive가 더 안전
- 제품 UX에서는 사용자가 이해하기 쉽게 `Active / Inactive` 개념 제공 가능

### 8.9 Costs empty state
비용이 하나도 없을 때:
- 메시지: `Add your membership cost to start calculating value`
- CTA: `Add Cost Item`

---

## 9. Settings 화면 명세

### 9.1 목적
gym 설정, 권한, 알림, 기본 세금, 앱 환경 값을 관리한다. **비용 항목의 추가·수정·삭제(CRUD)는 Costs 탭**에서 수행하고, Settings는 전역 기본값·권한·tracking 등 **앱 단위 설정**에 집중한다.

### 9.2 섹션 구성
#### Gym
- gym 이름
- 위치
- 반경
- timezone

#### Permissions
- location permission status
- notifications permission status
- background behavior 안내

#### Tracking
- check-in suggestions on/off
- check-out suggestions on/off

#### Tax Defaults
- region preset
- default GST
- default PST

#### App
- currency
- locale
- about/help

### 9.3 gym 반경 설정
사용자는 반경을 조정할 수 있어야 한다.

예:
- 80m
- 100m
- 150m

설명 문구 예시:
- `If check-in suggestions trigger too early or too late, adjust your gym radius.`

### 9.4 권한 상태 표시
권한 화면/섹션에서는 현재 상태를 명확히 보여줘야 한다.

예:
- Location: Allowed While Using App
- Notifications: Allowed
- Background location: Not enabled

### 9.5 권한 교육 UX
사용자가 권한을 거부하더라도 앱은 계속 사용할 수 있어야 한다.
다만 특정 자동화 기능은 제한된다는 점을 설명해야 한다.

예:
- `You can still add visits manually without location access.`

---

## 10. Add / Edit Visit 화면 명세

### 10.1 목적
수동 방문 추가와 기존 방문 수정은 동일한 입력 경험으로 통합한다.

### 10.2 입력 필드
- date
- start time
- end time
- gym
- notes (optional)

### 10.3 자동 계산
- duration은 입력값으로 직접 받기보다 start/end로 계산
- 저장 전에 preview로 보여줄 수 있음

예:
- `Duration: 1h 24m`

### 10.4 편집 시 정책
기존 기록을 편집하면 모든 통계는 즉시 재계산된다.
사용자는 편집의 영향을 이해할 수 있어야 한다.

### 10.5 validation 메시지
예시:
- `End time must be after start time`
- `Please choose a valid date`
- `Visit duration looks unusually long`

---

## 11. Add / Edit Cost Item 화면 명세

### 11.1 입력 필드
- label
- category
- amount
- cadence
- start date
- end date (optional)
- tax mode
- GST/PST (custom일 때)
- active

### 11.2 입력 원칙
- amount는 숫자만 허용
- 음수 불가
- cadence에 따라 필요한 필드만 보여줌

### 11.3 예시 UX
예:
- Label: `Monthly Membership`
- Amount: `$49.99`
- Cadence: `Monthly`
- Tax: `Use app default`

---

## 12. Onboarding / 최초 설정 명세

### 12.1 목적
최초 실행 시 사용자가 빠르게 핵심 값을 설정하고 바로 앱을 쓸 수 있게 한다.

### 12.2 최초 설정 단계
1. Welcome
2. Add Gym
3. Add Costs
4. Enable Notifications
5. Enable Location (선택적으로 단계적 요청)
6. Finish / Go to Home

### 12.3 초기 설정 원칙
- 처음부터 너무 많은 권한을 강요하지 않는다.
- 권한 없이도 앱이 동작한다는 점을 명시한다.
- setup을 건너뛸 수는 있지만, Home에서 다시 설정 유도

### 12.4 최소 입력값
최초 사용 가능 상태가 되기 위한 최소 조건:
- gym 1개 등록
- 비용 1개 이상 등록

방문 기록은 이후에 바로 추가 가능

---

## 13. 알림 UX 명세

### 13.1 알림 목적
알림은 방문 기록을 쉽게 돕는 보조 수단이다.
강제 자동화가 아니라 **행동 유도형 UX**로 본다.

### 13.2 체크인 제안 알림
트리거:
- gym geofence 진입

알림 예시:
- Title: `At the gym?`
- Body: `Tap to check in and track this visit.`

액션:
- `Check In`
- `Later`

### 13.3 체크아웃 제안 알림
트리거:
- active visit 상태에서 gym 이탈 감지

알림 예시:
- Title: `Finished your workout?`
- Body: `End this visit to update your totals.`

액션:
- `End Visit`
- `Keep Active`

### 13.4 알림 실패 대비
알림을 보지 못한 경우에도 앱 사용에 문제가 없어야 한다.
따라서:
- manual add는 항상 가능
- edit/delete도 항상 가능
- location off여도 앱은 usable해야 함

---

## 14. 상태 모델

### 14.1 Visit 상태
방문 기록은 아래 상태를 가진다.
- active
- completed
- cancelled

#### active
- check-in 되었고 종료되지 않음
- Home에서 active card 노출

#### completed
- 시작/종료 시간이 모두 있고 통계에 반영됨

#### cancelled
- 잘못 생성되었거나 무효 처리됨
- 기본 리스트에서는 숨기거나 별도 표시 가능

### 14.2 Visit source
- manual
- prompted
- recovered

설명:
- manual: 사용자가 직접 추가
- prompted: 알림/앱 제안 기반 체크인
- recovered: 나중에 누락 방문을 복구해 만든 기록

### 14.3 Permission 상태
- unknown
- granted
- denied
- limited / partial (플랫폼별 대응)

### 14.4 Cost item 상태
- active
- inactive
- archived (향후용)

---

## 15. 계산 기준 UX 규칙

### 15.1 기본 기준 기간
- Home 메트릭 기본 기간: current year

### 15.2 방문당 비용 계산
- 총 비용 / completed visits 수

방문 수가 0이면:
- 값 대신 안내 문구 표시

예:
- `No completed visits yet`

### 15.3 시간당 비용 계산
- 총 비용 / 총 체류시간

총 체류시간이 0이면:
- 표시 대신 placeholder 또는 안내 문구

### 15.4 수동 추가 기록도 동일 반영
manual / prompted / recovered 구분 없이, completed 상태면 동일하게 통계에 반영

### 15.5 future visit 금지
미래 방문은 통계에 반영되지 않으며, 일반 사용자는 생성 불가

---

## 16. 검색, 필터, 정렬

### 16.1 Visits 필터
MVP에서 최소 제공 필터:
- This Month
- This Year
- All Time

### 16.2 정렬
기본 정렬:
- 최신순

향후 확장 가능:
- longest first
- shortest first
- oldest first

### 16.3 Costs 정렬
기본 정렬:
- active 우선
- category 순 또는 생성순

---

## 17. Empty states / Error states

### 17.1 공통 원칙
empty state는 단순히 비었다고 말하는 것이 아니라, 다음 행동을 제안해야 한다.

### 17.2 대표 empty states
#### Home
- gym 없음
- 비용 없음
- 방문 없음

#### Visits
- `No visits yet`
- CTA: `Add Visit`

#### Costs
- `No cost items yet`
- CTA: `Add Cost Item`

### 17.3 오류 상태
예시:
- 위치 확인 실패
- 권한 거부
- 저장 실패
- 계산 데이터 불일치

원칙:
- 기술적 에러 메시지 노출 금지
- 사용자 행동 중심 안내 제공

예:
- `Couldn’t get your current location.`
- `You can still add a visit manually.`

---

## 18. 엣지 케이스 정책

### 18.1 active visit 중 중복 체크인
정책:
- 기본적으로 허용하지 않음
- `You already have an active visit.` 메시지 노출
- CTA: `End Current Visit` / `Edit Visit`

### 18.2 active visit가 하루를 넘김
정책:
- 비정상 상태로 간주
- 앱 시작 시 복구/정리 prompt

예:
- `This visit is still active from yesterday. Review it now?`

### 18.3 시작/종료 시간이 동일
정책:
- 저장 불가

### 18.4 음수 duration
정책:
- 저장 불가

### 18.5 매우 긴 방문
정책:
- 경고 후 저장 허용 가능
- 예: 8시간 초과 시 주의 메시지

### 18.6 비용 항목 날짜 겹침
정책:
- 허용
- 계산 엔진이 겹치는 기간 기준으로 합산

### 18.7 gym 미설정인데 방문 추가 시도
정책:
- gym setup 먼저 유도
- 향후 multi-gym을 고려하면 gym 연결이 필요

### 18.8 위치 권한이 없는 상태
정책:
- check-in suggestions 비활성
- manual add는 정상 사용 가능

---

## 19. 접근성 / 사용성 원칙

### 19.1 접근성
- 숫자는 충분히 크게 보여야 함
- 중요한 CTA는 명확한 텍스트 사용
- 색만으로 상태를 구분하지 않음

### 19.2 사용성
- 가장 자주 하는 행동은 Home에서 가능해야 함
- 수동 추가는 2~3탭 이내로 도달 가능해야 함
- 삭제는 조심스럽게, 추가/수정은 빠르게

---

## 20. 카피 방향

### 20.1 톤
- 짧고 명확함
- 부담스럽지 않음
- 지나치게 fitness app스럽지 않음
- 숫자를 동기부여 요소로 사용

### 20.2 예시 문구
- `Your gym value this year`
- `Check in and lower your cost per visit`
- `Add a visit manually`
- `No visits yet`
- `You can still track manually without location access`

---

## 21. 분석 이벤트 제안 (선택)

MVP에서 필수는 아니지만, 향후 제품 개선을 위해 아래 이벤트는 정의해둘 수 있다.
- onboarding_completed
- gym_created
- cost_item_created
- checkin_prompt_shown
- checkin_started
- visit_completed
- visit_added_manually
- visit_edited
- visit_deleted
- permission_location_granted
- permission_notification_granted

MVP에서는 실제 analytics integration 없이 event naming만 정리해도 충분하다.

---

## 22. 출시 전 수용 기준

### 22.1 기능 수용 기준
- 사용자는 gym을 1개 등록할 수 있다.
- 사용자는 비용 항목을 추가/수정/삭제할 수 있다.
- 사용자는 수동으로 방문을 추가할 수 있다.
- 사용자는 기존 방문을 수정/삭제할 수 있다.
- 사용자는 active visit를 종료할 수 있다.
- Home에서 방문당 비용이 정상 계산된다.
- Home에서 시간당 비용이 정상 계산된다.
- 권한이 없어도 manual-only 모드로 앱 사용이 가능하다.

### 22.2 UX 수용 기준
- 첫 사용자가 5분 이내에 기본 세팅을 마칠 수 있다.
- 방문 수동 추가가 복잡하지 않다.
- empty state가 다음 행동을 안내한다.
- 위치 자동화가 실패해도 앱 전체 신뢰가 무너지지 않는다.

---

## 23. 관련 문서 (코어)

1. `TECH_ARCHITECTURE_v0.1.md` — 폴더 구조, 서비스·라이브러리, 모듈 설계  
2. `DATA_MODEL_AND_CALCULATION_v0.1.md` — SQLite schema, 비용·세금, 통계 규칙  
3. `DELIVERY_PLAN_v0.1.md` — 마일스톤, 체크리스트, 테스트/릴리즈 기준  

구현 단계별 실행 세부는 **`PHASE_0_1_IMPLEMENTATION_KICKOFF_v0.1.md`**, 초기 SQL 기준은 **`INITIAL_DB_SCHEMA_SQL_v0.1.md`** (Master Plan §15 companion).

---

## 24. 요약

이 제품 명세의 핵심은 다음과 같다.

- Home의 대표 숫자는 **방문당 비용**이다.
- 자동화는 보조 수단이며, 수동 입력/수정/삭제가 항상 가능해야 한다.
- 위치 기능이 없어도 앱은 가치가 있어야 한다.
- 수동 방문 추가는 예외 기능이 아니라 핵심 기능이다.
- MVP는 단일 gym, 로컬 우선, 단순한 UI를 유지한다.
- 사용자는 복잡한 fitness tracking이 아니라, **내 돈을 얼마나 잘 쓰고 있는지**를 보고 싶어 한다.

이 기준을 Tech·Data Model 문서에서 기술 구조와 데이터/계산 규칙으로 이어 받는다.

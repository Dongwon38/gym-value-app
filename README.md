# gym-value-app

로컬 우선 React Native 앱(Gym Value) 모노레포. 모바일 앱은 `apps/mobile`에 있습니다.

## 요구 사항

- **Node.js** 22.11 이상 (저장소 루트 `.nvmrc` 참고)
- **npm** (workspaces 사용)
- iOS: Xcode, CocoaPods (`bundle` + `pod`)
- Android: Android Studio, JDK

## 설치

저장소 루트에서:

```bash
npm install
```

## 자주 쓰는 명령 (루트에서)

| 명령 | 설명 |
|------|------|
| `npm run mobile` | Metro 번들러 시작 |
| `npm run mobile:ios` | iOS 앱 실행 |
| `npm run mobile:android` | Android 앱 실행 |
| `npm run mobile:pod-install` | iOS CocoaPods 설치/갱신 |

## iOS 최초 1회 (또는 Ruby 의존성 변경 후)

```bash
cd apps/mobile && bundle install
npm run mobile:pod-install
```

## 모바일 워크스페이스만 직접 실행할 때

```bash
npm run start -w apps/mobile
npm run ios -w apps/mobile
npm run android -w apps/mobile
npm run lint -w apps/mobile
npm run test -w apps/mobile
```

## 모노레포 (Android / Metro)

npm workspaces 때문에 `node_modules`는 저장소 **루트**에만 있습니다.

- **Android**: `apps/mobile/android/settings.gradle`, `apps/mobile/android/app/build.gradle`에서 루트 `node_modules`를 참조합니다.
- **Metro**: `apps/mobile/metro.config.js`의 `watchFolders` / `nodeModulesPaths`로 같은 이유를 반영합니다.

`metro.config.js`를 바꾼 뒤에는 Metro를 **`npm run mobile -- --reset-cache`** 로 한 번 띄우는 것이 안전합니다.

## 문서

`docs/` 기준 v0.1 문서 세트다.

**Core (5):** `MASTER_PLAN_v0.1.md` → `PRODUCT_SPEC_v0.1.md` → `TECH_ARCHITECTURE_v0.1.md` → `DATA_MODEL_AND_CALCULATION_v0.1.md` → `DELIVERY_PLAN_v0.1.md`

**Companion:** `PHASE_0_1_IMPLEMENTATION_KICKOFF_v0.1.md`, `INITIAL_DB_SCHEMA_SQL_v0.1.md`

상세한 역할 구분은 Master Plan §15를 본다.

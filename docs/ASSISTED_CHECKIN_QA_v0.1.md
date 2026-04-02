# Gym Value App - Assisted Check-In QA v0.1

## Scope
- AUTO-03 controller/provider wiring
- AUTO-04 fallback polish and recovery cues
- Workspace-level verification only

## Automated Evidence
- `npm run lint -w apps/mobile`
- `npm run test -w apps/mobile -- --watchAll=false --watchman=false`
- Controller coverage now verifies:
  - permission/status refresh and geofence sync
  - enter event -> raw prompt -> suggestion notification flow
  - notification action -> prompted visit start/complete flow
- UI coverage now verifies:
  - Settings assisted tracking fallback section
  - Visits active-visit restore copy
  - long-running active visit review heuristic

## Manual Fallback Guarantees
- If location or notification permissions are missing, Settings shows manual-only guidance.
- If assisted tracking errors, the app still keeps gym, cost, and visit CRUD usable.
- If an active visit exists on relaunch, Visits surfaces restored-session copy from local SQLite state.
- If an active visit stays open too long, Visits warns that KPI math may be skewed until the row is reviewed.

## Pending Native Smoke
- Concrete platform adapters are still noop/stub-backed in the workspace.
- Real-device smoke remains required for:
  - Android geofence enter/exit delivery
  - iOS geofence/background behavior
  - local notification display and action presses
  - permission request UX on device

## Suggested Manual Scenarios
1. Deny location permission and confirm Settings stays usable in manual-only mode.
2. Create an active visit, relaunch the app, and confirm Visits shows the restored-session guidance.
3. Leave an active visit open beyond the warning threshold and confirm the review warning appears.
4. Replace stub services with concrete adapters, then verify enter -> suggestion -> check-in and exit -> suggestion -> check-out on device.

# Gym Value Mobile

React Native app for the Gym Value App monorepo. The current workspace scope covers manual gym setup, costs, visits, KPI dashboarding, and assisted check-in wiring with stub platform services.

## Workspace Commands

Run these from the repo root:

```sh
npm run mobile
npm run mobile:android
npm run mobile:ios
npm run mobile:pod-install
```

## Local Checks

```sh
npm run lint -w apps/mobile
npm run test -w apps/mobile -- --watchAll=false --watchman=false
```

## Environment Notes

- Node engine target: `>=22.11.0`
- Install iOS native dependencies with `npm run mobile:pod-install`
- `react-native-nitro-sqlite` changes require a rebuild on simulator or device

## Source Layout

- `src/app`: app shell, navigation, providers
- `src/data`: SQLite client, migrations, repositories
- `src/domain`: models, constants, calculations, forms
- `src/features`: gym, costs, visits, settings, home, assisted check-in
- `src/screens`: tab-level screens
- `src/ui`: shared theme and UI components

## Related Docs

- [Master Plan](/Users/dongwon/Works/gym-value-app/docs/MASTER_PLAN_v0.1.md)
- [Implementation Checklist](/Users/dongwon/Works/gym-value-app/docs/IMPLEMENTATION_CHECKLIST_v0.1.md)
- [Assisted Check-In QA](/Users/dongwon/Works/gym-value-app/docs/ASSISTED_CHECKIN_QA_v0.1.md)

# IQROMAX MVP Deploy & Handover Checklist

## 1. Repository
- [ ] Git repository exists
- [ ] Client has admin/owner access
- [ ] README.md exists
- [ ] .env.example exists
- [ ] migrations folder exists
- [ ] tests folder exists

## 2. Server
- [ ] Production server is running
- [ ] Client has SSH access
- [ ] Deploy instructions documented
- [ ] Process manager configured
- [ ] SSL works
- [ ] Domain connected

## 3. Database
- [ ] PostgreSQL configured
- [ ] Client has DB credentials
- [ ] Backup created
- [ ] Restore instructions documented
- [ ] Migrations applied successfully

## 4. APIs
- [ ] /api/v1/examples/generate works
- [ ] /api/v1/examples/multiply works
- [ ] /api/v1/examples/divide works
- [ ] /api/v1/sessions/submit works
- [ ] /api/v1/admin/examples/preview works
- [ ] /api/v1/admin/examples/preview-multiple works
- [ ] /api/v1/admin/tests/stress-single works
- [ ] /api/v1/admin/tests/stress-suite works
- [ ] /api/v1/admin/qa/bundle works

## 5. Math Engine
- [ ] formulasiz add/sub verified
- [ ] 5 formula verified
- [ ] 10 formula verified
- [ ] mix formula verified
- [ ] multiply verified
- [ ] divide verified
- [ ] divide remainder always zero

## 6. Adaptive System
- [ ] difficulty easy works
- [ ] difficulty medium works
- [ ] difficulty hard works
- [ ] next_difficulty updates after session

## 7. Progress Engine
- [ ] XP updates correctly
- [ ] level updates correctly
- [ ] streak updates correctly
- [ ] topic progress updates correctly

## 8. Gamification
- [ ] leaderboard updates correctly
- [ ] badges are awarded correctly

## 9. Tests
- [ ] unit tests passed
- [ ] stress tests passed
- [ ] adaptive stress tests passed
- [ ] test report shared

## 10. Final Ownership
- [ ] domain is under client control
- [ ] repository is under client control
- [ ] server access is under client control
- [ ] database access is under client control
- [ ] backup is delivered

---

## Amaliy Test Rejasi

| # | Test | Tafsilotlar |
|---|------|-------------|
| 1 | Formulasiz add | 3 xona, 5 had |
| 2 | 5-lik formula +4 | easy / medium / hard |
| 3 | 10-lik formula +8 | preview va multiple preview |
| 4 | Mix formula -7 | sub operatsiya |
| 5 | Multiplication 3×1 | ko'paytirish |
| 6 | Division 4÷2 | qoldiqsiz bo'lish |
| 7 | Session submit | XP, next_difficulty |
| 8 | Badge | yangi badge chiqishi |
| 9 | Leaderboard | rank yangilanishi |

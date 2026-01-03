# IQROMAX Native App - Test Qo'llanmasi

## Boshlash uchun talab qilinadigan narsalar

### Barcha platformalar uchun:
- Node.js (v18 yoki undan yuqori)
- npm yoki yarn
- Git

### Android uchun:
- Android Studio (Arctic Fox yoki undan yangi)
- Android SDK (API 21+)
- Java JDK 11 yoki 17
- Android Emulator yoki jismoniy qurilma

### iOS uchun (faqat Mac):
- macOS Monterey yoki undan yangi
- Xcode 14 yoki undan yangi
- CocoaPods
- Apple Developer Account (jismoniy qurilmada test uchun)

---

## 1-Qadam: Loyihani GitHub'dan Klonlash

```bash
# 1. GitHub'ga eksport qiling (Lovable Settings → Connectors → GitHub)
# 2. Loyihani klonlang
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# 3. Dependencylarni o'rnating
npm install
```

---

## 2-Qadam: Capacitor Platformalarini Qo'shish

```bash
# Android platformasini qo'shish
npx cap add android

# iOS platformasini qo'shish (faqat Mac)
npx cap add ios
```

---

## 3-Qadam: Loyihani Build Qilish

```bash
# Production build
npm run build

# Capacitor bilan sinxronlash
npx cap sync
```

---

## 4-Qadam: Android Studio'da Ishga Tushirish

### A. Android Studio'ni Ochish

```bash
# Android loyihasini Android Studio'da ochish
npx cap open android
```

### B. Emulator Sozlash (agar yo'q bo'lsa)

1. Android Studio → Tools → Device Manager
2. "Create Device" tugmasini bosing
3. Telefon modelini tanlang (masalan, Pixel 6)
4. System image tanlang (API 33 tavsiya etiladi)
5. "Finish" tugmasini bosing

### C. Ilovani Ishga Tushirish

1. Yuqoridagi toolbar'da qurilmani tanlang
2. ▶️ (Run) tugmasini bosing
3. Ilova emulator yoki qurilmada ishga tushadi

### D. Jismoniy Qurilmada Test

1. Telefonda "Developer Options" yoqing:
   - Settings → About Phone → Build Number (7 marta bosing)
2. USB Debugging yoqing:
   - Settings → Developer Options → USB Debugging
3. Telefonni USB orqali ulang
4. Android Studio'da qurilmani tanlang va Run bosing

---

## 5-Qadam: Xcode'da Ishga Tushirish (faqat Mac)

### A. Xcode'ni Ochish

```bash
# iOS loyihasini Xcode'da ochish
npx cap open ios
```

### B. Signing & Capabilities Sozlash

1. Xcode'da loyihani oching
2. TARGETS → App tanlang
3. "Signing & Capabilities" tabiga o'ting
4. Team tanlang (Apple Developer Account)
5. Bundle Identifier o'zgartiring (unique bo'lishi kerak)

### C. Simulator'da Ishga Tushirish

1. Yuqoridagi toolbar'da simulatorni tanlang (masalan, iPhone 15)
2. ▶️ (Run) tugmasini bosing
3. Ilova simulatorda ishga tushadi

### D. Jismoniy Qurilmada Test

1. iPhone'ni USB orqali ulang
2. "Trust This Computer" ni tasdiqlang
3. Xcode'da qurilmani tanlang
4. Run tugmasini bosing
5. Birinchi marta: Settings → General → Device Management → Trust

---

## Hot Reload (Tezkor Yangilanish)

Capacitor config'da live reload allaqachon sozlangan:

```typescript
// capacitor.config.ts
server: {
  url: 'https://da340934-fc03-480c-b042-21f6c7553901.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

Bu sozlama bilan Lovable'da qilgan o'zgarishlaringiz darhol native appda ko'rinadi.

### Production Build Uchun

Production build yaratish uchun `capacitor.config.ts`dagi `server` blokini o'chiring yoki comment qiling:

```typescript
// Production uchun bu qismni o'chiring
// server: {
//   url: '...',
//   cleartext: true
// }
```

Keyin:
```bash
npm run build
npx cap sync
```

---

## Muammolarni Hal Qilish

### Android Muammolari

**"SDK location not found"**
```bash
# local.properties faylini yarating
echo "sdk.dir=/Users/YOUR_NAME/Library/Android/sdk" > android/local.properties
# Windows uchun: sdk.dir=C:\\Users\\YOUR_NAME\\AppData\\Local\\Android\\Sdk
```

**"Gradle build failed"**
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

**"INSTALL_FAILED_USER_RESTRICTED"**
- Developer Options → USB Debugging yoqilganligini tekshiring
- Telefonda "Install via USB" yoqing

### iOS Muammolari

**"No signing certificate"**
1. Xcode → Preferences → Accounts → Apple ID qo'shing
2. Team tanlang
3. "Download Manual Profiles" bosing

**"Provisioning profile doesn't include..."**
1. Bundle Identifier'ni o'zgartiring (unique qiling)
2. Yoki Apple Developer Portal'da yangi profile yarating

**Pod install xatoligi**
```bash
cd ios/App
pod install --repo-update
cd ../..
```

---

## Foydali Buyruqlar

```bash
# Android build va ishga tushirish
npx cap run android

# iOS build va ishga tushirish
npx cap run ios

# Faqat sinxronlash (kodni yangilash)
npx cap sync

# Capacitor versiyasini yangilash
npx cap update

# Plugin qo'shish
npm install @capacitor/camera
npx cap sync

# Android logs ko'rish
npx cap run android -l --external

# iOS logs ko'rish
npx cap run ios -l --external
```

---

## App Store / Play Store Uchun Build

### Android APK/AAB Yaratish

```bash
# Release build
cd android
./gradlew assembleRelease  # APK uchun
./gradlew bundleRelease    # AAB uchun (Play Store uchun tavsiya)
```

Fayl joylashuvi:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS IPA Yaratish

1. Xcode'da Product → Archive
2. Distribute App → App Store Connect
3. Upload yoki Export tanlang

---

## Keyingi Qadamlar

1. ✅ Loyihani GitHub'ga eksport qiling
2. ✅ Native platformalarni qo'shing
3. ✅ Emulator/Simulatorda test qiling
4. ✅ Jismoniy qurilmada test qiling
5. ⬜ App ikonlarini to'g'ri joylang
6. ⬜ Splash screen'ni sozlang
7. ⬜ Release build yarating
8. ⬜ App Store / Play Store'ga yuklang

---

## Yordam Kerakmi?

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Help](https://developer.android.com/studio/intro)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [Lovable Mobile Apps Guide](https://docs.lovable.dev/tips-tricks/native-mobile-apps)

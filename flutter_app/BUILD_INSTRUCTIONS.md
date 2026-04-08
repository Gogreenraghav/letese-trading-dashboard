# LETESE Trading - Flutter App

## Build Instructions

### Prerequisites
1. **Flutter SDK** (3.24.0 or later)
   - Download: https://docs.flutter.dev/get-started/install
   - Run: `flutter doctor`

2. **Android Studio** (for Android builds) OR Xcode (for iOS)

### Build Steps

```bash
# 1. Navigate to project
cd letese_trading

# 2. Install dependencies
flutter pub get

# 3. Build for Android (APK)
flutter build apk --release

# 4. Build for iOS
flutter build ios --release

# 5. Build for Web
flutter build web

# 6. Build for Linux Desktop
flutter build linux --release
```

### APK Location
After build:
- Android APK: `build/app/outputs/flutter-apk/app-release.apk`
- iOS: `build/ios/iphoneos/Runner.app`
- Web: `build/web/`

### Backend Connection
The app connects to: `http://139.59.65.82:3010`

Update API URL in:
`lib/services/api_service.dart` → `static const String baseUrl`

### App Screens
1. Login / Register
2. Dashboard (Portfolio, P&L, Stats)
3. Trades (Full trade history)
4. Profile (KYC, Broker Setup)

### Required Permissions
- Internet (for API calls)
- No special Android permissions needed

### Generate Debug APK
```bash
flutter build apk --debug
```

### Release Build (Play Store)
```bash
flutter build appbundle --release
```

# IQROMAX App Icons Guide

## Icon Files Created
- `public/app-icon-1024.png` - Master icon (1024x1024)
- `public/splash-screen.png` - Splash screen (1080x1920)

## iOS Icon Sizes Required
Place these in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:

| Size | Scale | Pixels | Usage |
|------|-------|--------|-------|
| 20pt | 1x | 20x20 | iPad Notifications |
| 20pt | 2x | 40x40 | iPhone Notifications |
| 20pt | 3x | 60x60 | iPhone Notifications |
| 29pt | 1x | 29x29 | iPad Settings |
| 29pt | 2x | 58x58 | iPhone Settings |
| 29pt | 3x | 87x87 | iPhone Settings |
| 40pt | 1x | 40x40 | iPad Spotlight |
| 40pt | 2x | 80x80 | iPhone Spotlight |
| 40pt | 3x | 120x120 | iPhone Spotlight |
| 60pt | 2x | 120x120 | iPhone App |
| 60pt | 3x | 180x180 | iPhone App |
| 76pt | 1x | 76x76 | iPad App |
| 76pt | 2x | 152x152 | iPad App |
| 83.5pt | 2x | 167x167 | iPad Pro App |
| 1024pt | 1x | 1024x1024 | App Store |

## Android Icon Sizes Required
Place these in `android/app/src/main/res/`:

| Folder | Size | DPI |
|--------|------|-----|
| mipmap-mdpi | 48x48 | 160 |
| mipmap-hdpi | 72x72 | 240 |
| mipmap-xhdpi | 96x96 | 320 |
| mipmap-xxhdpi | 144x144 | 480 |
| mipmap-xxxhdpi | 192x192 | 640 |

### Adaptive Icons (Android 8+)
Create foreground and background layers:
- `ic_launcher_foreground.png` - 432x432 with icon centered in 264x264 safe zone
- `ic_launcher_background.png` - 432x432 solid color or gradient

## Quick Generation Tools

### Option 1: Online Tools
- [App Icon Generator](https://appicon.co/) - Upload 1024x1024, get all sizes
- [Icon Kitchen](https://icon.kitchen/) - Create adaptive icons
- [MakeAppIcon](https://makeappicon.com/) - iOS and Android icons

### Option 2: Command Line (ImageMagick)
```bash
# iOS icons
convert app-icon-1024.png -resize 180x180 icon-60@3x.png
convert app-icon-1024.png -resize 120x120 icon-60@2x.png
convert app-icon-1024.png -resize 87x87 icon-29@3x.png
# ... etc

# Android icons
convert app-icon-1024.png -resize 192x192 mipmap-xxxhdpi/ic_launcher.png
convert app-icon-1024.png -resize 144x144 mipmap-xxhdpi/ic_launcher.png
convert app-icon-1024.png -resize 96x96 mipmap-xhdpi/ic_launcher.png
convert app-icon-1024.png -resize 72x72 mipmap-hdpi/ic_launcher.png
convert app-icon-1024.png -resize 48x48 mipmap-mdpi/ic_launcher.png
```

## Splash Screen
The splash screen (`public/splash-screen.png`) should be copied to:

### iOS
`ios/App/App/Assets.xcassets/Splash.imageset/`

### Android
`android/app/src/main/res/drawable/splash.png`

Configure in `capacitor.config.ts` (already done):
```typescript
SplashScreen: {
  launchShowDuration: 2000,
  backgroundColor: '#0A0A0F',
  androidSplashResourceName: 'splash',
  splashFullScreen: true,
  splashImmersive: true
}
```

## Marketing Materials
- `public/marketing/screenshot-1-dashboard.png` - Dashboard screenshot
- `public/marketing/screenshot-2-training.png` - Training screenshot
- `public/marketing/feature-graphic.png` - Feature graphic (1024x500)

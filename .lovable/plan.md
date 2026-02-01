
# Reja: Samsung to'liq ekran, Abakus Simulator va Interaktiv Amaliyot

## Umumiy ko'rinish

Foydalanuvchi uch xil funksionallik so'radi:
1. **Samsung telefonlarida to'liq ekran qo'llab-quvvatlashi** - PWA ni optimizatsiya qilish
2. **Abakus Simulator** - alohida sahifada interaktiv abakus
3. **Interaktiv Abakus Amaliyot** - ekran yarmida abakus, yarmida misollar (yangi boshlagan o'quvchilar uchun)

---

## 1-qism: Samsung va Android to'liq ekran rejimi

### Texnik yondashuv:

**A. PWA manifest yangilash** (`vite.config.ts`):
```javascript
display: "fullscreen" // "standalone" o'rniga
display_override: ["fullscreen", "standalone", "minimal-ui"]
```

**B. Android status bar va navigation bar yashirish** (`index.html`):
```html
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#22c55e" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#166534" media="(prefers-color-scheme: dark)">
```

**C. CSS optimizatsiyalar** (`src/index.css`):
```css
/* Samsung One UI uchun */
@supports (display-mode: fullscreen) {
  body { 
    min-height: 100vh;
    min-height: -webkit-fill-available;
  }
}
```

---

## 2-qism: Abakus Simulator (alohida sahifa)

### Yangi sahifa: `/abacus-simulator`

**Fayl**: `src/pages/AbacusSimulator.tsx`

### Funksionalliklar:

1. **Interaktiv Abakus Komponenti** - sensorli boshqaruv
   - Boncuklarni yuqoriga/pastga suring
   - Har bir ustun alohida boshqariladi
   - 1-5 ustunli (birliklar, o'nliklar, yuzliklar, mingliklar, o'n mingliklar)

2. **UI elementlari**:
   - Ustunlar sonini tanlash (1-5)
   - Joriy qiymatni ko'rsatish
   - Reset tugmasi
   - Ovozli qayta aloqa (boncuk harakati)

3. **Touch/Swipe gesturelar**:
   - Swipe yuqoriga = boncukni faollashtirish
   - Swipe pastga = boncukni o'chirish
   - Tap = toggle

### Yangi komponent: `src/components/InteractiveAbacus.tsx`

```text
+------------------------------------------+
|  [1-ustun] [2-ustun] [3-ustun] [Reset]   |
+------------------------------------------+
|                                          |
|        ●  (yuqori boncuk - 5 qiymat)     |
|       ═══════════════════════            |
|        ○                                 |
|        ○                                 |
|        ●  (pastki boncuklar - 1 qiymat)  |
|        ●                                 |
|                                          |
+------------------------------------------+
|     Qiymat: 7                            |
+------------------------------------------+
```

---

## 3-qism: Interaktiv Abakus Amaliyot (asosiy funksiya)

### Yangi sahifa: `/abacus-practice`

**Fayl**: `src/pages/AbacusPractice.tsx`

### Asosiy konsepsiya:

Ekran ikki qismga bo'linadi:
- **Chap/Yuqori qism**: Interaktiv abakus
- **O'ng/Pastki qism**: Misol va amallar ketma-ketligi

### O'yin jarayoni:

1. **Sozlamalar**:
   - Hadlar soni (3, 5, 7, 10)
   - Formula turi (formulasiz, kichik do'st, katta do'st, aralash)
   - Xonalar soni (1, 2, 3 xonali)
   - Misollar soni per session (10 ta standart)

2. **Misol ishlash**:
   ```text
   Misol: 3 + 2 - 1 + 4 = ?
   
   Qadam 1: Ekranda "3" ko'rsatiladi
            O'quvchi abakusda 3 ni qo'yadi
            Abakus qiymati = 3 bo'lganda → Keyingi qadam
   
   Qadam 2: Ekranda "+2" ko'rsatiladi
            O'quvchi abakusda 2 qo'shadi
            Abakus qiymati = 5 bo'lganda → Keyingi qadam
   
   Qadam 3: Ekranda "-1" ko'rsatiladi
            O'quvchi abakusda 1 ayiradi
            Abakus qiymati = 4 bo'lganda → Keyingi qadam
   
   Qadam 4: Ekranda "+4" ko'rsatiladi
            O'quvchi abakusda 4 qo'shadi
            Abakus qiymati = 8 bo'lganda → Misol tugadi
   
   Qadam 5: Javobni kiritish formasi
            O'quvchi "8" yozadi → To'g'ri!
   ```

3. **Har 10 ta misol uchun statistika**:
   - Umumiy vaqt
   - To'g'ri javoblar soni
   - O'rtacha vaqt per misol
   - Aniqlik foizi

### UI tuzilishi (mobil uchun vertikal, desktop uchun gorizontal):

```text
MOBIL (vertikal):
+----------------------------------+
|  Misol 3/10    Vaqt: 01:23       |
+----------------------------------+
|                                  |
|    [INTERAKTIV ABAKUS]           |
|                                  |
+----------------------------------+
|  Joriy amal:   + 4               |
|  Keyingi: + 2  - 1  ...          |
+----------------------------------+
|  [Javobni kiriting] [Tekshir]   |
+----------------------------------+

DESKTOP (gorizontal):
+-------------------+-------------------+
|                   |  Misol 3/10       |
|   INTERAKTIV      |  Vaqt: 01:23      |
|   ABAKUS          +-------------------+
|                   |  Joriy: + 4       |
|                   |  Keyingi: + 2     |
+-------------------+-------------------+
|     [Javobni kiriting] [Tekshir]     |
+-------------------------------------------+
```

### Texnik komponentlar:

1. **`InteractiveAbacus.tsx`** - sensorli abakus
2. **`AbacusPractice.tsx`** - asosiy sahifa
3. **`AbacusPracticeSettings.tsx`** - sozlamalar dialog
4. **`AbacusPracticeResults.tsx`** - natijalar komponenti

---

## Navigatsiya yangilanishi

**`src/App.tsx`** ga yangi routelar:
```javascript
<Route path="/abacus-simulator" element={<AbacusSimulator />} />
<Route path="/abacus-practice" element={<ProtectedRoute><AbacusPractice /></ProtectedRoute>} />
```

**MobileBottomNav** yoki bosh sahifada yangi bo'limlar:
- "Abakus Simulator" - ochiq, ro'yxatdan o'tmagan foydalanuvchilar uchun ham
- "Abakus Amaliyot" - faqat ro'yxatdan o'tganlar uchun

---

## Ma'lumotlar bazasi

**Mavjud jadval ishlatiladi**: `game_sessions`

Yangi session turlari:
- `section: 'abacus-practice'`
- `mode: 'interactive'`
- `difficulty: '1-digit-5terms'` (format)

---

## O'zgartirilishi kerak bo'lgan fayllar:

| Fayl | O'zgarish |
|------|-----------|
| `index.html` | Meta taglar - fullscreen, Samsung One UI |
| `vite.config.ts` | PWA manifest - fullscreen mode |
| `src/index.css` | Samsung/Android CSS fixes |
| `src/components/InteractiveAbacus.tsx` | YANGI - sensorli abakus komponenti |
| `src/pages/AbacusSimulator.tsx` | YANGI - simulator sahifasi |
| `src/pages/AbacusPractice.tsx` | YANGI - interaktiv amaliyot sahifasi |
| `src/App.tsx` | Yangi routelar qo'shish |

---

## Bajarilish ketma-ketligi:

### Bosqich 1: Mobil to'liq ekran
1. `index.html` - meta taglar yangilash
2. `vite.config.ts` - PWA fullscreen
3. `src/index.css` - Samsung CSS

### Bosqich 2: InteractiveAbacus komponenti
1. Sensorli boshqaruv (touch events)
2. Boncuk animatsiyalari
3. Ovozli qayta aloqa
4. Multi-ustun qo'llab-quvvatlash

### Bosqich 3: Abakus Simulator sahifasi
1. InteractiveAbacus integratsiyasi
2. Sozlamalar paneli
3. Qiymat ko'rsatkichi

### Bosqich 4: Abakus Amaliyot sahifasi
1. Split-screen layout (responsive)
2. Misol generatsiyasi (sorobanEngine ishlatiladi)
3. Qadam-baqadam tekshiruv
4. Vaqt va statistika
5. 10 misollik sessiyalar
6. Natijalarni saqlash

### Bosqich 5: Navigatsiya
1. App.tsx routelar
2. KidsHome yoki Dashboard dan havolalar

---

## Texnik tafsilotlar

### Touch gesturelar implementatsiyasi:

```javascript
// Swipe detection
const handleTouchStart = (e: TouchEvent) => {
  startY = e.touches[0].clientY;
};

const handleTouchEnd = (e: TouchEvent) => {
  const deltaY = e.changedTouches[0].clientY - startY;
  if (Math.abs(deltaY) > 20) {
    if (deltaY < 0) activateBead(); // swipe up
    else deactivateBead(); // swipe down
  }
};
```

### Abakus qiymatini tekshirish:

```javascript
// O'quvchi to'g'ri amal qilganini tekshirish
const checkAbacusValue = (expectedValue: number) => {
  if (abacusValue === expectedValue) {
    playSound('correct');
    proceedToNextStep();
  }
};
```

### Responsive layout:

```javascript
// useIsMobile hook ishlatiladi
const isMobile = useIsMobile();

return (
  <div className={cn(
    "flex",
    isMobile ? "flex-col" : "flex-row"
  )}>
    {/* Content */}
  </div>
);
```

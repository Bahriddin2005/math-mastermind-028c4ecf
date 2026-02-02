
# Abakus Simulatorni Rasmdagidek Uzun va Ko'p Ustunli Qilish

## Maqsad
Abakusni rasmdagidek 13 ustunli, gorizontal uzun va har bir QATOR alohida rangda bo'ladigan qilib o'zgartirish.

---

## Asosiy O'zgarishlar

### 1. Ustunlar sonini oshirish

**Hozirgi holat:**
- Minimal: 1, Maksimal: 5 ustun
- Default: 3 ustun

**Yangi holat:**
- Minimal: 3, Maksimal: 17 ustun  
- Default: 13 ustun (rasmdagidek)
- Qiymat: 0 dan 99,999,999,999,999,999 gacha

---

### 2. Rang tizimini o'zgartirish

**Hozirgi logika:**
Har bir USTUN o'z rangida (column-based rainbow)

**Yangi logika (rasmdagidek):**
Pastki toshlar QATOR BO'YICHA ranglanadi (row-based):

```text
Yuqori tosh:  Yashil (green) - barcha ustunlarda
---------------------------------------------
Pastki toshlar (yuqoridan pastga):
  Qator 1 (top):     Qizil (red)
  Qator 2:           To'q sariq (orange)  
  Qator 3:           Sariq (yellow)
  Qator 4 (bottom):  Havorang (cyan)
```

---

### 3. Fayllar va o'zgarishlar

**AbacusColumn.tsx:**
- Rang logikasini ustun-based dan qator-based ga o'zgartirish
- Har bir pastki tosh o'z qator indeksiga qarab rang oladi
- `getLowerBeadColor(beadIndex)` funksiyasi qo'shiladi

**AbacusSimulator.tsx:**
- Default ustunlar: 3 -> 13
- Maksimal ustunlar: 5 -> 17
- Ustun nomlari kengaytiriladi (100M, 1B, 10B, 100B, 1T, 10T, 100T)
- Tosh o'lchamini avtomatik moslashtirish (ko'p ustunda kichikroq)

**RealisticAbacus.tsx:**
- Ko'p ustunlar uchun responsive dizayn
- Horizontal scroll qo'shish (agar kerak bo'lsa)
- Kompakt rejim uchun optimallashtirish

---

## Vizual taqqoslash

```text
HOZIRGI (3-5 ustun):
┌─────────────────┐
│  🟢  🟢  🟢    │
│ ═══════════════ │
│  🔴  🟠  🟡    │  <- har ustun o'z rangida
│  🔴  🟠  🟡    │
│  🔴  🟠  🟡    │
│  🔴  🟠  🟡    │
└─────────────────┘

YANGI (13 ustun, rasmdagidek):
┌─────────────────────────────────────────────────────┐
│  🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢         │
│ ═══════════════════════════════════════════════════ │
│  🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴         │  <- qator 1: qizil
│  🟠 🟠 🟠 🟠 🟠 🟠 🟠 🟠 🟠 🟠 🟠 🟠 🟠         │  <- qator 2: orange
│  🟡 🟡 🟡 🟡 🟡 🟡 🟡 🟡 🟡 🟡 🟡 🟡 🟡         │  <- qator 3: sariq
│  🩵 🩵 🩵 🩵 🩵 🩵 🩵 🩵 🩵 🩵 🩵 🩵 🩵         │  <- qator 4: cyan
└─────────────────────────────────────────────────────┘
```

---

## Texnik tafsilotlar

### AbacusColumn.tsx o'zgarishlari:
```typescript
// Yangi rang logikasi - qator bo'yicha
const ROW_COLORS: BeadColorType[] = ['red', 'orange', 'yellow', 'cyan'];

// Har bir tosh o'z qator indeksiga qarab rang oladi
const getLowerBeadColorByRow = (rowIndex: number): BeadColorType => {
  return ROW_COLORS[rowIndex] || 'cyan';
};
```

### AbacusSimulator.tsx o'zgarishlari:
```typescript
// Default va maksimal ustunlar
const [columns, setColumns] = useState(13);
const maxColumns = 17;

// Tosh o'lchami - ustunlar soniga qarab moslashadi
const getBeadSize = (cols: number) => {
  if (cols <= 5) return 40;
  if (cols <= 9) return 32;
  if (cols <= 13) return 28;
  return 24;
};
```

### RealisticAbacus.tsx o'zgarishlari:
- Ustunlar orasidagi gap: 12px -> 6-8px (kompakt)
- Frame padding optimallashtiriladi
- Horizontal overflow qo'shiladi

---

## Natija
- 13 ustunli real Soroban abakus (rasmdagidek)
- Qator bo'yicha rainbow ranglar
- 0 dan 9,999,999,999,999 gacha hisoblash imkoniyati
- Responsive va mobil-friendly

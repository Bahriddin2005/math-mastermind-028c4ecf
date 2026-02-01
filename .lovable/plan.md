
# Rejalashtirish: "O'ynab o'rgan" tugmasini /train ga yo'naltirish va musobaqa admin paneli

## Umumiy ko'rinish

Foydalanuvchi ikkita so'rov qildi:
1. "O'ynab o'rgan" tugmasini bosganda `/train` sahifasiga o'tsin
2. `/weekly-game` sahifasida faqat admin musobaqalarni yarata olsin (admin panel)

---

## 1-qism: Tugma navigatsiyasini o'zgartirish

### O'zgartirilishi kerak bo'lgan fayl:
**`src/pages/KidsHome.tsx`** (230-qator)

### Hozirgi holat:
```javascript
onClick={() => navigate('/mental-arithmetic')}
```

### Yangi holat:
```javascript
onClick={() => navigate('/train')}
```

---

## 2-qism: Musobaqa admin panelini /weekly-game sahifasiga qo'shish

### Arxitektura yondashuvi:

**`src/pages/WeeklyGame.tsx`** sahifasiga admin uchun qo'shimcha funksionallik qo'shiladi:

1. **Admin tekshiruvi** - `user_roles` jadvalidan admin huquqini tekshirish
2. **Musobaqa yaratish dialog** - faqat admin uchun ko'rinadigan "+" tugmasi
3. **Mavjud musobaqalar ro'yxati** - admin barcha haftalik musobaqalarni ko'ra oladi

### Texnik tafsilotlar:

#### A. Admin rolini tekshirish:
```javascript
const { data: isAdmin } = useQuery({
  queryKey: ['is-admin', user?.id],
  queryFn: async () => {
    if (!user) return false;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    return !!data;
  },
  enabled: !!user,
});
```

#### B. Musobaqa yaratish formasi:
- Hafta boshlanish sanasi (avtomatik hisoblash)
- Formula turi (oddiy, formula5, formula10plus, formula10minus, hammasi)
- Raqamlar soni (1-4 xonali)
- Tezlik (0.3s - 2s)
- Misollar soni (5-20)

#### C. UI komponenti:
```text
+------------------------------------------+
|  Haftalik Musobaqa                       |
|  [Musobaqa ma'lumotlari]                 |
|                                          |
|  [Admin uchun: + Yangi musobaqa yaratish]|
+------------------------------------------+
```

### Ma'lumotlar bazasi:

**Jadval**: `weekly_challenges` (mavjud)
- `id` - UUID
- `week_start` - DATE
- `week_end` - DATE  
- `formula_type` - TEXT
- `digit_count` - INTEGER
- `speed` - NUMERIC
- `problem_count` - INTEGER
- `seed` - INTEGER

**RLS siyosatlari** (allaqachon mavjud):
- Har kim ko'ra oladi (SELECT)
- Faqat admin yarata oladi (INSERT)
- Faqat admin yangilaya oladi (UPDATE)
- Faqat admin o'chira oladi (DELETE)

---

## O'zgartirilishi kerak bo'lgan fayllar:

| Fayl | O'zgarish |
|------|-----------|
| `src/pages/KidsHome.tsx` | Tugma navigatsiyasini `/train` ga o'zgartirish |
| `src/pages/WeeklyGame.tsx` | Admin panel qo'shish (musobaqa yaratish/tahrirlash/o'chirish) |

---

## Bajarilishi kerak bo'lgan qadamlar:

1. **KidsHome.tsx** - "O'ynab o'rgan" tugmasidagi `navigate('/mental-arithmetic')` ni `navigate('/train')` ga o'zgartirish

2. **WeeklyGame.tsx** - Quyidagilarni qo'shish:
   - Admin rolini tekshirish query
   - Barcha haftalik musobaqalar ro'yxatini olish query
   - Musobaqa yaratish mutation
   - Musobaqani tahrirlash mutation
   - Musobaqani o'chirish mutation
   - Dialog komponenti (yaratish/tahrirlash formasi)
   - Admin uchun boshqaruv tugmalari (yaratish, tahrirlash, o'chirish)

3. **UI dizayni**:
   - Faol musobaqa kartasi ustida admin tugmasi
   - Musobaqalar ro'yxati (jadval shaklida)
   - Form validatsiyasi

---

## Xavfsizlik:

- Admin tekshiruvi server tomonida (RLS orqali) amalga oshiriladi
- Client tomonida ham tekshiruv bo'ladi (UI uchun)
- `has_role()` funksiyasi SECURITY DEFINER bilan ishlaydi

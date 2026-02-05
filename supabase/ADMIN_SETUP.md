# Birinchi adminni qanday qo'shish

`user_roles` jadvali bo'sh bo'lsa, birinchi adminni **faqat server (Supabase) orqali** qo'shish mumkin.

## 1-qadam: Foydalanuvchi ID ni olish

1. [Supabase Dashboard](https://supabase.com/dashboard) → loyihangizni tanlang  
2. **Authentication** → **Users**  
3. Admin qilmoqchi bo'lgan foydalanuvchini toping  
4. **UUID** (masalan: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`) ni nusxalang  

Agar bu foydalanuvchi hali yo'q bo'lsa, avval saytda ro'yxatdan o'ting (Auth sahifasi orqali), keyin Dashboard’dan UUID ni oling.

## 2-qadam: SQL orqali admin qo'shish

1. Supabase Dashboard → **SQL Editor**  
2. **New query**  
3. Quyidagi SQL ni yozing va `YOUR_USER_UUID` o'rniga 1-qadamda nusxalagan UUID ni qo'ying:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_UUID', 'admin');
```

Misol (UUID o'rniga o'zingiznikini yozing):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin');
```

4. **Run** (yoki Ctrl+Enter) bosing.

## 3-qadam: Tekshirish

- Saytga shu hisob bilan kiring  
- Navbar’da **Admin panel** paydo bo'lishi kerak  
- Yoki to'g'ridan-to'g'ri `/admin` sahifasiga o'ting  

Keyinchalik bu admin boshqa foydalanuvchilarni ham Admin panel → Users bo'limidan admin qilishi mumkin.

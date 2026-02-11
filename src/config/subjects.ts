import { Calculator, BookOpen, PenTool, Type, Grid3X3, type LucideIcon } from 'lucide-react';

export interface SubjectConfig {
  id: string;
  name: string;
  nameShort: string;
  description: string;
  icon: LucideIcon;
  emoji: string;
  gradient: string;
  color: string;
  route: string;
  isActive: boolean;
  features: string[];
  difficultyLevels: DifficultyLevel[];
  practiceTypes: PracticeType[];
}

export interface DifficultyLevel {
  id: string;
  label: string;
  description: string;
  minAge?: number;
  maxAge?: number;
}

export interface PracticeType {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const SUBJECTS: SubjectConfig[] = [
  {
    id: 'mental-arithmetic',
    name: 'Mental Arifmetika',
    nameShort: 'Arifmetika',
    description: 'Soroban/abakus yordamida tez hisoblash mashqlari',
    icon: Calculator,
    emoji: '🧮',
    gradient: 'from-violet-500 to-purple-600',
    color: 'violet',
    route: '/abacus-practice',
    isActive: true,
    features: ['Flash card', 'Abakus simulyator', 'Tezlik mashqlari', 'Musobaqalar'],
    difficultyLevels: [
      { id: 'beginner', label: 'Boshlang\'ich', description: '1 xonali sonlar', minAge: 5, maxAge: 7 },
      { id: 'elementary', label: 'Oddiy', description: '2 xonali sonlar', minAge: 7, maxAge: 9 },
      { id: 'intermediate', label: 'O\'rta', description: '3 xonali sonlar', minAge: 9, maxAge: 12 },
      { id: 'advanced', label: 'Murakkab', description: '4+ xonali sonlar', minAge: 10, maxAge: 14 },
    ],
    practiceTypes: [
      { id: 'flash-card', label: 'Flash Card', description: 'Tez ko\'rsatish mashqlari', icon: '⚡' },
      { id: 'abacus', label: 'Abakus', description: 'Abakusda hisoblash', icon: '🧮' },
      { id: 'mental', label: 'Og\'zaki', description: 'Og\'zaki hisoblash', icon: '🧠' },
    ],
  },
  {
    id: 'speed-reading',
    name: 'Tez O\'qish',
    nameShort: 'Tez o\'qish',
    description: 'So\'z tezligi, matnni tushunish va ko\'z mashqlari',
    icon: BookOpen,
    emoji: '📖',
    gradient: 'from-blue-500 to-cyan-500',
    color: 'blue',
    route: '/subjects/speed-reading',
    isActive: true,
    features: ['So\'z tezligi', 'Matn tushunish', 'Ko\'z mashqlari', 'Schulte jadvali'],
    difficultyLevels: [
      { id: 'beginner', label: 'Boshlang\'ich', description: '50-80 so\'z/min', minAge: 6, maxAge: 8 },
      { id: 'elementary', label: 'Oddiy', description: '80-120 so\'z/min', minAge: 8, maxAge: 10 },
      { id: 'intermediate', label: 'O\'rta', description: '120-200 so\'z/min', minAge: 10, maxAge: 13 },
      { id: 'advanced', label: 'Ilg\'or', description: '200+ so\'z/min', minAge: 12, maxAge: 14 },
    ],
    practiceTypes: [
      { id: 'word-speed', label: 'So\'z tezligi', description: 'So\'zlarni tez o\'qish', icon: '⚡' },
      { id: 'comprehension', label: 'Tushunish', description: 'Matnni o\'qib tushunish', icon: '📝' },
      { id: 'eye-exercise', label: 'Ko\'z mashqi', description: 'Ko\'z harakati mashqlari', icon: '👁️' },
      { id: 'schulte', label: 'Schulte jadvali', description: 'Raqamlarni ketma-ket topish', icon: '🔢' },
    ],
  },
  {
    id: 'calligraphy',
    name: 'Husni Xat',
    nameShort: 'Husni xat',
    description: 'Chiroyli yozuv va harflarni to\'g\'ri yozish mashqlari',
    icon: PenTool,
    emoji: '✍️',
    gradient: 'from-emerald-500 to-green-600',
    color: 'emerald',
    route: '/subjects/calligraphy',
    isActive: true,
    features: ['Harf yozish', 'Chiziqqa rioya', 'So\'z yozish', 'Jumla yozish'],
    difficultyLevels: [
      { id: 'beginner', label: 'Boshlang\'ich', description: 'Bosma harflar', minAge: 5, maxAge: 7 },
      { id: 'elementary', label: 'Oddiy', description: 'Yozma harflar', minAge: 7, maxAge: 9 },
      { id: 'intermediate', label: 'O\'rta', description: 'So\'z va jumlalar', minAge: 9, maxAge: 12 },
    ],
    practiceTypes: [
      { id: 'letters', label: 'Harflar', description: 'Harflarni yozish', icon: '🔤' },
      { id: 'words', label: 'So\'zlar', description: 'So\'zlarni yozish', icon: '📝' },
      { id: 'sentences', label: 'Jumlalar', description: 'Jumlalarni yozish', icon: '📄' },
    ],
  },
  {
    id: 'literacy',
    name: 'Savodxonlik',
    nameShort: 'Savod',
    description: 'Harflar, bo\'g\'inlar, so\'z yasash va imlo mashqlari',
    icon: Type,
    emoji: '🔤',
    gradient: 'from-orange-500 to-amber-500',
    color: 'orange',
    route: '/subjects/literacy',
    isActive: true,
    features: ['Harflarni tanish', 'Bo\'g\'in o\'qish', 'So\'z yasash', 'Imlo tekshiruv'],
    difficultyLevels: [
      { id: 'beginner', label: 'Boshlang\'ich', description: 'Harflarni o\'rganish', minAge: 5, maxAge: 7 },
      { id: 'elementary', label: 'Oddiy', description: 'Bo\'g\'inlar', minAge: 6, maxAge: 8 },
      { id: 'intermediate', label: 'O\'rta', description: 'So\'z yasash', minAge: 7, maxAge: 10 },
      { id: 'advanced', label: 'Ilg\'or', description: 'Imlo va grammatika', minAge: 9, maxAge: 14 },
    ],
    practiceTypes: [
      { id: 'letters', label: 'Harflar', description: 'Harflarni tanish', icon: '🔡' },
      { id: 'syllables', label: 'Bo\'g\'inlar', description: 'Bo\'g\'in mashqlari', icon: '📖' },
      { id: 'word-building', label: 'So\'z yasash', description: 'So\'zlarni tuzish', icon: '🧩' },
      { id: 'spelling', label: 'Imlo', description: 'To\'g\'ri yozish', icon: '✅' },
    ],
  },
  {
    id: 'multiplication',
    name: 'Ko\'paytirish Jadvali',
    nameShort: 'Karra',
    description: 'Ko\'paytirish jadvalini o\'rganish va mashq qilish',
    icon: Grid3X3,
    emoji: '✖️',
    gradient: 'from-rose-500 to-pink-600',
    color: 'rose',
    route: '/subjects/multiplication',
    isActive: true,
    features: ['Jadval o\'rganish', 'Tezlik testi', 'Aralash mashqlar', 'Musobaqa'],
    difficultyLevels: [
      { id: 'beginner', label: 'Boshlang\'ich', description: '2-5 jadvali', minAge: 7, maxAge: 9 },
      { id: 'elementary', label: 'Oddiy', description: '6-9 jadvali', minAge: 8, maxAge: 10 },
      { id: 'intermediate', label: 'O\'rta', description: 'Aralash 2-9', minAge: 9, maxAge: 12 },
      { id: 'advanced', label: 'Ilg\'or', description: '10-20 jadvali', minAge: 10, maxAge: 14 },
    ],
    practiceTypes: [
      { id: 'learn', label: 'O\'rganish', description: 'Jadval kartochkalari', icon: '📚' },
      { id: 'speed-test', label: 'Tezlik testi', description: 'Vaqt bilan mashq', icon: '⏱️' },
      { id: 'mixed', label: 'Aralash', description: 'Barcha jadvallar', icon: '🎲' },
    ],
  },
];

export const getSubjectById = (id: string): SubjectConfig | undefined => {
  return SUBJECTS.find(s => s.id === id);
};

export const getActiveSubjects = (): SubjectConfig[] => {
  return SUBJECTS.filter(s => s.isActive);
};

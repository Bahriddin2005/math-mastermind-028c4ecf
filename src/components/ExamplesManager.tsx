import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Calculator,
  Loader2,
  Lightbulb,
  BookOpen,
  Search,
  Upload,
  FileSpreadsheet,
  Download
} from 'lucide-react';

interface MathExample {
  id: string;
  question: string;
  answer: number;
  difficulty: string;
  category: string;
  lesson_id: string | null;
  is_active: boolean;
  hint: string | null;
  explanation: string | null;
  order_index: number;
}

interface Lesson {
  id: string;
  title: string;
  course_id: string;
}

const difficultyOptions = [
  { value: 'easy', label: "Oson" },
  { value: 'medium', label: "O'rta" },
  { value: 'hard', label: "Qiyin" },
];

const categoryOptions = [
  { value: 'add-sub', label: "Qo'shish/Ayirish" },
  { value: 'multiply', label: "Ko'paytirish" },
  { value: 'divide', label: "Bo'lish" },
  { value: 'mix', label: "Aralash" },
];

export const ExamplesManager = () => {
  const [examples, setExamples] = useState<MathExample[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    difficulty: 'easy',
    category: 'add-sub',
    lesson_id: '',
    hint: '',
    explanation: '',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch examples
    const { data: examplesData } = await supabase
      .from('math_examples')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (examplesData) {
      setExamples(examplesData);
    }

    // Fetch lessons for dropdown
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('id, title, course_id')
      .order('title', { ascending: true });
    
    if (lessonsData) {
      setLessons(lessonsData);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      difficulty: 'easy',
      category: 'add-sub',
      lesson_id: '',
      hint: '',
      explanation: '',
      is_active: true,
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.answer) {
      toast.error("Savol va javobni kiriting");
      return;
    }

    const payload = {
      question: formData.question.trim(),
      answer: parseInt(formData.answer),
      difficulty: formData.difficulty,
      category: formData.category,
      lesson_id: formData.lesson_id || null,
      hint: formData.hint.trim() || null,
      explanation: formData.explanation.trim() || null,
      is_active: formData.is_active,
      order_index: editingId ? undefined : examples.length,
    };

    if (editingId) {
      const { error } = await supabase
        .from('math_examples')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        toast.error("Xatolik yuz berdi");
      } else {
        toast.success("Misol yangilandi");
        resetForm();
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('math_examples')
        .insert([payload]);

      if (error) {
        toast.error("Xatolik yuz berdi");
      } else {
        toast.success("Misol qo'shildi");
        resetForm();
        fetchData();
      }
    }
  };

  const handleEdit = (example: MathExample) => {
    setFormData({
      question: example.question,
      answer: example.answer.toString(),
      difficulty: example.difficulty,
      category: example.category,
      lesson_id: example.lesson_id || '',
      hint: example.hint || '',
      explanation: example.explanation || '',
      is_active: example.is_active,
    });
    setEditingId(example.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Misolni o'chirmoqchimisiz?")) return;

    const { error } = await supabase
      .from('math_examples')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Xatolik yuz berdi");
    } else {
      toast.success("Misol o'chirildi");
      fetchData();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('math_examples')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchData();
    }
  };

  // CSV/Excel import handler
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row if exists
      const startIndex = lines[0].toLowerCase().includes('question') ? 1 : 0;
      
      const newExamples = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        // Support both comma and semicolon delimiters
        const delimiter = line.includes(';') ? ';' : ',';
        const parts = line.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''));
        
        if (parts.length >= 2) {
          const question = parts[0];
          const answer = parseInt(parts[1]);
          const difficulty = parts[2] || 'easy';
          const category = parts[3] || 'add-sub';
          const hint = parts[4] || null;
          const explanation = parts[5] || null;

          if (question && !isNaN(answer)) {
            newExamples.push({
              question,
              answer,
              difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'easy',
              category: ['add-sub', 'multiply', 'divide', 'mix'].includes(category) ? category : 'add-sub',
              hint,
              explanation,
              is_active: true,
              order_index: examples.length + successCount,
            });
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      }

      if (newExamples.length > 0) {
        const { error } = await supabase
          .from('math_examples')
          .insert(newExamples);

        if (error) {
          toast.error("Import xatoligi: " + error.message);
        } else {
          toast.success(`${successCount} ta misol import qilindi${errorCount > 0 ? `, ${errorCount} ta xato` : ''}`);
          fetchData();
        }
      } else {
        toast.error("Hech qanday misol topilmadi");
      }
    } catch (error) {
      console.error(error);
      toast.error("Faylni o'qishda xatolik");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Download sample CSV template
  const downloadTemplate = () => {
    const template = `question,answer,difficulty,category,hint,explanation
"5 + 3 = ?",8,easy,add-sub,"5 ga 3 ni qo'shing","5 + 3 = 8"
"12 × 4 = ?",48,medium,multiply,"12 ni 4 marta qo'shing","12 × 4 = 48"
"100 ÷ 5 = ?",20,hard,divide,"100 ni 5 ga bo'ling","100 ÷ 5 = 20"`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'misollar-shablon.csv';
    link.click();
  };

  const filteredExamples = examples.filter(example => {
    const matchesSearch = example.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || example.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || example.difficulty === filterDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyBadge = (difficulty: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      easy: { bg: 'bg-success/10', text: 'text-success' },
      medium: { bg: 'bg-warning/10', text: 'text-warning' },
      hard: { bg: 'bg-destructive/10', text: 'text-destructive' },
    };
    const { bg, text } = config[difficulty] || config.easy;
    return <Badge className={`${bg} ${text}`}>{difficultyOptions.find(d => d.value === difficulty)?.label}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    return <Badge variant="secondary">{categoryOptions.find(c => c.value === category)?.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">CSV/Excel import</h3>
                <p className="text-sm text-muted-foreground">
                  Misollarni fayldan yuklang
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Shablon
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="gap-2"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {importing ? "Yuklanmoqda..." : "Import qilish"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            {editingId ? "Misolni tahrirlash" : "Yangi misol qo'shish"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Question */}
              <div className="space-y-2">
                <Label>Savol *</Label>
                <Input
                  placeholder="Masalan: 25 + 17 = ?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                />
              </div>

              {/* Answer */}
              <div className="space-y-2">
                <Label>Javob *</Label>
                <Input
                  type="number"
                  placeholder="42"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                />
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label>Qiyinlik darajasi</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Kategoriya</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lesson */}
              <div className="space-y-2">
                <Label>Darsga biriktirish (ixtiyoriy)</Label>
                <Select
                  value={formData.lesson_id || "none"}
                  onValueChange={(v) => setFormData({ ...formData, lesson_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Dars tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Biriktirilmagan</SelectItem>
                    {lessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active toggle */}
              <div className="space-y-2">
                <Label>Holat</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.is_active ? "Faol" : "Nofaol"}
                  </span>
                </div>
              </div>
            </div>

            {/* Hint */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                Maslahat (ixtiyoriy)
              </Label>
              <Textarea
                placeholder="O'quvchiga yordam berish uchun maslahat..."
                value={formData.hint}
                onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                rows={2}
              />
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Tushuntirish (ixtiyoriy)
              </Label>
              <Textarea
                placeholder="Javobning to'liq tushuntirishi..."
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" className="gap-2">
                {editingId ? (
                  <>
                    <Save className="h-4 w-4" />
                    Saqlash
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Qo'shish
                  </>
                )}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Bekor qilish
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Kategoriya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kategoriyalar</SelectItem>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Qiyinlik" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha darajalar</SelectItem>
            {difficultyOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Examples List */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Misollar ro'yxati</span>
            <Badge variant="secondary">{filteredExamples.length} ta</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExamples.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Misollar topilmadi</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredExamples.map((example) => (
                <div
                  key={example.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    example.is_active 
                      ? 'bg-card border-border/40' 
                      : 'bg-secondary/30 border-border/20 opacity-60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {getDifficultyBadge(example.difficulty)}
                      {getCategoryBadge(example.category)}
                      {!example.is_active && (
                        <Badge variant="outline" className="text-muted-foreground">Nofaol</Badge>
                      )}
                    </div>
                    <p className="font-mono text-lg font-semibold truncate">
                      {example.question}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Javob: <span className="font-semibold text-primary">{example.answer}</span>
                      {example.hint && (
                        <span className="ml-2 text-warning">• Maslahat bor</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={example.is_active}
                      onCheckedChange={() => toggleActive(example.id, example.is_active)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(example)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(example.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Video,
  BookOpen,
  GraduationCap,
  Loader2,
  Eye,
  EyeOff,
  Upload
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  difficulty: string;
  is_published: boolean;
  order_index: number;
  created_at: string;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string | null;
  duration_minutes: number;
  order_index: number;
  is_published: boolean;
}

interface CourseManagerProps {
  isAdmin: boolean;
}

const DIFFICULTY_OPTIONS = [
  { label: "Boshlang'ich", value: 'beginner' },
  { label: "O'rta", value: 'intermediate' },
  { label: 'Murakkab', value: 'advanced' },
];

export const CourseManager = ({ isAdmin }: CourseManagerProps) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Course dialog
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    is_published: false,
  });
  const [savingCourse, setSavingCourse] = useState(false);

  // Lesson dialog
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    video_url: '',
    duration_minutes: 10,
    is_published: false,
  });
  const [savingLesson, setSavingLesson] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchCourses();
    }
  }, [isAdmin]);

  const fetchCourses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (data) {
      setCourses(data);
      // Fetch lessons for all courses
      for (const course of data) {
        fetchLessons(course.id);
      }
    }
    setLoading(false);
  };

  const fetchLessons = async (courseId: string) => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    if (data) {
      setLessons(prev => ({ ...prev, [courseId]: data }));
    }
  };

  // Course handlers
  const openCourseDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title: course.title,
        description: course.description || '',
        difficulty: course.difficulty,
        is_published: course.is_published,
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        title: '',
        description: '',
        difficulty: 'beginner',
        is_published: false,
      });
    }
    setCourseDialogOpen(true);
  };

  const handleSaveCourse = async () => {
    if (!courseForm.title) {
      toast.error("Kurs nomini kiriting");
      return;
    }
    setSavingCourse(true);
    try {
      if (editingCourse) {
        await supabase.from('courses').update(courseForm).eq('id', editingCourse.id);
        toast.success("Kurs yangilandi");
      } else {
        await supabase.from('courses').insert({ ...courseForm, order_index: courses.length });
        toast.success("Kurs yaratildi");
      }
      setCourseDialogOpen(false);
      fetchCourses();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Kursni o'chirishni xohlaysizmi? Barcha darslar ham o'chiriladi!")) return;
    await supabase.from('courses').delete().eq('id', id);
    toast.success("Kurs o'chirildi");
    fetchCourses();
  };

  const toggleCoursePublish = async (course: Course) => {
    await supabase.from('courses').update({ is_published: !course.is_published }).eq('id', course.id);
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_published: !c.is_published } : c));
    toast.success(course.is_published ? "Kurs yashirildi" : "Kurs chop etildi");
  };

  // Lesson handlers
  const openLessonDialog = (courseId: string, lesson?: Lesson) => {
    setSelectedCourse(courses.find(c => c.id === courseId) || null);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        description: lesson.description || '',
        video_url: lesson.video_url || '',
        duration_minutes: lesson.duration_minutes,
        is_published: lesson.is_published,
      });
    } else {
      setEditingLesson(null);
      setLessonForm({
        title: '',
        description: '',
        video_url: '',
        duration_minutes: 10,
        is_published: false,
      });
    }
    setLessonDialogOpen(true);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video hajmi 100MB dan oshmasligi kerak");
      return;
    }

    setUploadingVideo(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('course-videos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from('course-videos')
        .getPublicUrl(fileName);

      setLessonForm(prev => ({ ...prev, video_url: publicUrl.publicUrl }));
      toast.success("Video yuklandi");
    } catch (error) {
      console.error(error);
      toast.error("Video yuklashda xatolik");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title || !selectedCourse) {
      toast.error("Dars nomini kiriting");
      return;
    }
    setSavingLesson(true);
    try {
      const courseLessons = lessons[selectedCourse.id] || [];
      if (editingLesson) {
        await supabase.from('lessons').update(lessonForm).eq('id', editingLesson.id);
        toast.success("Dars yangilandi");
      } else {
        await supabase.from('lessons').insert({
          ...lessonForm,
          course_id: selectedCourse.id,
          order_index: courseLessons.length,
        });
        toast.success("Dars yaratildi");
      }
      setLessonDialogOpen(false);
      fetchLessons(selectedCourse.id);
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!confirm("Darsni o'chirishni xohlaysizmi?")) return;
    await supabase.from('lessons').delete().eq('id', lesson.id);
    toast.success("Dars o'chirildi");
    fetchLessons(lesson.course_id);
  };

  const toggleLessonPublish = async (lesson: Lesson) => {
    await supabase.from('lessons').update({ is_published: !lesson.is_published }).eq('id', lesson.id);
    setLessons(prev => ({
      ...prev,
      [lesson.course_id]: prev[lesson.course_id]?.map(l => 
        l.id === lesson.id ? { ...l, is_published: !l.is_published } : l
      )
    }));
    toast.success(lesson.is_published ? "Dars yashirildi" : "Dars chop etildi");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Kurslar boshqaruvi</h3>
          <p className="text-sm text-muted-foreground">Video darslar va kurslarni boshqaring</p>
        </div>
        <Button onClick={() => openCourseDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Yangi kurs
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="p-8 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Hali kurslar yo'q</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge variant={course.is_published ? "default" : "secondary"}>
                        {course.is_published ? "Chop etilgan" : "Qoralama"}
                      </Badge>
                      <Badge variant="outline">
                        {DIFFICULTY_OPTIONS.find(d => d.value === course.difficulty)?.label}
                      </Badge>
                    </div>
                    <CardDescription>{course.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleCoursePublish(course)}
                    >
                      {course.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openCourseDialog(course)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Darslar ({lessons[course.id]?.length || 0})</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openLessonDialog(course.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Dars qo'shish
                    </Button>
                  </div>
                  
                  {lessons[course.id]?.length > 0 && (
                    <div className="space-y-1 mt-3">
                      {lessons[course.id].map((lesson, index) => (
                        <div 
                          key={lesson.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground w-6">
                              {index + 1}.
                            </span>
                            <div>
                              <p className="font-medium text-sm">{lesson.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {lesson.duration_minutes} daq · {lesson.video_url ? 'Video bor' : 'Video yo\'q'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant={lesson.is_published ? "default" : "outline"} className="text-xs">
                              {lesson.is_published ? "Faol" : "Yashirin"}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleLessonPublish(lesson)}
                            >
                              {lesson.is_published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openLessonDialog(course.id, lesson)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteLesson(lesson)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? "Kursni tahrirlash" : "Yangi kurs yaratish"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kurs nomi</Label>
              <Input
                value={courseForm.title}
                onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Mental arifmetika asoslari"
              />
            </div>
            <div>
              <Label>Tavsif</Label>
              <Textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kurs haqida qisqacha..."
              />
            </div>
            <div>
              <Label>Qiyinchilik darajasi</Label>
              <Select 
                value={courseForm.difficulty} 
                onValueChange={(v) => setCourseForm(prev => ({ ...prev, difficulty: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Chop etish</Label>
              <Switch
                checked={courseForm.is_published}
                onCheckedChange={(v) => setCourseForm(prev => ({ ...prev, is_published: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>Bekor</Button>
            <Button onClick={handleSaveCourse} disabled={savingCourse}>
              {savingCourse && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? "Darsni tahrirlash" : "Yangi dars qo'shish"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Dars nomi</Label>
              <Input
                value={lessonForm.title}
                onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="1-dars: Kirish"
              />
            </div>
            <div>
              <Label>Tavsif</Label>
              <Textarea
                value={lessonForm.description}
                onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Dars haqida qisqacha..."
              />
            </div>
            <div>
              <Label>Video</Label>
              <div className="space-y-2">
                {lessonForm.video_url && (
                  <video src={lessonForm.video_url} className="w-full h-32 object-cover rounded-lg" controls />
                )}
                <div className="flex gap-2">
                  <Input
                    value={lessonForm.video_url}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="Video URL yoki yuklang..."
                    className="flex-1"
                  />
                  <Button variant="outline" asChild disabled={uploadingVideo}>
                    <label className="cursor-pointer">
                      {uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={handleVideoUpload}
                      />
                    </label>
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label>Davomiyligi (daqiqa)</Label>
              <Input
                type="number"
                value={lessonForm.duration_minutes}
                onChange={(e) => setLessonForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Chop etish</Label>
              <Switch
                checked={lessonForm.is_published}
                onCheckedChange={(v) => setLessonForm(prev => ({ ...prev, is_published: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>Bekor</Button>
            <Button onClick={handleSaveLesson} disabled={savingLesson}>
              {savingLesson && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
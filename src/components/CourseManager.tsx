import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { uploadResumableToPublicBucket } from '@/lib/resumableUpload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  thumbnail_url?: string | null;
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
    thumbnail_url: '',
    difficulty: 'beginner',
    is_published: false,
  });
  const [savingCourse, setSavingCourse] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Lesson dialog
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration_minutes: 10,
    is_published: false,
  });
  const [savingLesson, setSavingLesson] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingLessonThumbnail, setUploadingLessonThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCourseThumbnailDragging, setIsCourseThumbnailDragging] = useState(false);
  const [isLessonThumbnailDragging, setIsLessonThumbnailDragging] = useState(false);

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
        thumbnail_url: course.thumbnail_url || '',
        difficulty: course.difficulty,
        is_published: course.is_published,
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        title: '',
        description: '',
        thumbnail_url: '',
        difficulty: 'beginner',
        is_published: false,
      });
    }
    setCourseDialogOpen(true);
  };

  const processCourseThumbnail = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm hajmi 5MB dan oshmasligi kerak");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Faqat rasm fayllar qo'llab-quvvatlanadi");
      return;
    }

    setUploadingThumbnail(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
      const fileName = `thumbnails/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from('course-videos')
        .upload(fileName, file);

      if (error) {
        const errorDetail = (error as any)?.statusCode 
          ? `Status: ${(error as any).statusCode} - ${error.message}`
          : error.message;
        throw new Error(errorDetail);
      }

      const { data: publicUrl } = supabase.storage
        .from('course-videos')
        .getPublicUrl(fileName);

      setCourseForm(prev => ({ ...prev, thumbnail_url: publicUrl.publicUrl }));
      toast.success("Rasm yuklandi");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Rasm yuklashda xatolik';
      toast.error(message);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processCourseThumbnail(file);
  };

  const handleCourseThumbnailDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCourseThumbnailDragging(true);
  };

  const handleCourseThumbnailDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCourseThumbnailDragging(false);
  };

  const handleCourseThumbnailDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCourseThumbnailDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processCourseThumbnail(files[0]);
    }
  };

  const handleSaveCourse = async () => {
    if (!courseForm.title) {
      toast.error("Kurs nomini kiriting");
      return;
    }
    setSavingCourse(true);
    try {
      const dataToSave = {
        title: courseForm.title,
        description: courseForm.description,
        thumbnail_url: courseForm.thumbnail_url || null,
        difficulty: courseForm.difficulty,
        is_published: courseForm.is_published,
      };
      
      if (editingCourse) {
        await supabase.from('courses').update(dataToSave).eq('id', editingCourse.id);
        toast.success("Kurs yangilandi");
      } else {
        await supabase.from('courses').insert({ ...dataToSave, order_index: courses.length });
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
        thumbnail_url: lesson.thumbnail_url || '',
        duration_minutes: lesson.duration_minutes,
        is_published: lesson.is_published,
      });
    } else {
      setEditingLesson(null);
      setLessonForm({
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        duration_minutes: 10,
        is_published: false,
      });
    }
    setLessonDialogOpen(true);
  };

  const processLessonThumbnail = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm hajmi 5MB dan oshmasligi kerak");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Faqat rasm fayllar qo'llab-quvvatlanadi");
      return;
    }

    setUploadingLessonThumbnail(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
      const fileName = `lesson-thumbnails/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from('course-videos')
        .upload(fileName, file);

      if (error) {
        const errorDetail = (error as any)?.statusCode 
          ? `Status: ${(error as any).statusCode} - ${error.message}`
          : error.message;
        throw new Error(errorDetail);
      }

      const { data: publicUrl } = supabase.storage
        .from('course-videos')
        .getPublicUrl(fileName);

      setLessonForm(prev => ({ ...prev, thumbnail_url: publicUrl.publicUrl }));
      toast.success("Rasm yuklandi");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Rasm yuklashda xatolik';
      toast.error(message);
    } finally {
      setUploadingLessonThumbnail(false);
    }
  };

  const handleLessonThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processLessonThumbnail(file);
  };

  const handleLessonThumbnailDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLessonThumbnailDragging(true);
  };

  const handleLessonThumbnailDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLessonThumbnailDragging(false);
  };

  const handleLessonThumbnailDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLessonThumbnailDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processLessonThumbnail(files[0]);
    }
  };

  const processVideoFile = async (file: File) => {
    const maxSize = 500 * 1024 * 1024; // 500MB

    if (file.size > maxSize) {
      toast.error("Video hajmi 500MB dan oshmasligi kerak");
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast.error("Faqat video fayllar qo'llab-quvvatlanadi");
      return;
    }

    setUploadingVideo(true);
    setUploadProgress(0);

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
      const objectName = `videos/${Date.now()}-${safeName}`;

      let videoUrl: string;

      // Resumable upload for large files (50MB+)
      if (file.size > 50 * 1024 * 1024) {
        toast.info("Katta fayl - davom ettiriladigan yuklash (resumable) boshlandi...");
        videoUrl = await uploadResumableToPublicBucket({
          bucket: 'course-videos',
          objectName,
          file,
          onProgress: (pct) => setUploadProgress(pct),
        });
      } else {
        // Regular upload (small files)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => (prev >= 90 ? 90 : prev + 10));
        }, 250);

        const { error } = await supabase.storage
          .from('course-videos')
          .upload(objectName, file);

        clearInterval(progressInterval);

        if (error) throw error;

        setUploadProgress(100);

        const { data: publicUrl } = supabase.storage
          .from('course-videos')
          .getPublicUrl(objectName);

        videoUrl = publicUrl.publicUrl;
      }

      setLessonForm((prev) => ({ ...prev, video_url: videoUrl }));
      toast.success("Video yuklandi");
    } catch (error: any) {
      console.error('Video upload error:', error);
      let message = 'Video yuklashda xatolik';
      if (error?.statusCode) {
        message = `Xato ${error.statusCode}: ${error.message || 'Noma\'lum xato'}`;
      } else if (error?.message) {
        message = error.message;
      }
      if (error?.cause) {
        console.error('Error cause:', error.cause);
      }
      toast.error(message, { duration: 6000 });
    } finally {
      setTimeout(() => {
        setUploadingVideo(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processVideoFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processVideoFile(files[0]);
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
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 blur-xl animate-pulse" />
          <div className="relative p-4 rounded-full bg-gradient-to-br from-card/80 to-muted/50 border border-border/50 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 dark:from-primary/20 dark:via-accent/15 dark:to-primary/10 border border-primary/20 dark:border-primary/30">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">Kurslar boshqaruvi</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Video darslar va kurslarni boshqaring</p>
          </div>
        </div>
        <Button 
          onClick={() => openCourseDialog()} 
          size="sm"
          className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yangi kurs
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center bg-gradient-to-br from-card via-card/95 to-muted/50 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-900/80 border-dashed border-2 border-border/50 dark:border-slate-600/50">
          <div className="p-4 rounded-full bg-gradient-to-br from-muted to-muted/50 dark:from-slate-700 dark:to-slate-800 w-fit mx-auto mb-4">
            <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Hali kurslar yo'q</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Yangi kurs qo'shish uchun yuqoridagi tugmani bosing</p>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden bg-gradient-to-br from-card via-card/95 to-muted/30 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-slate-900/80 border-border/50 dark:border-slate-600/50 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-primary/10">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                      <CardTitle className="text-sm sm:text-lg truncate">{course.title}</CardTitle>
                      <Badge 
                        variant={course.is_published ? "default" : "secondary"}
                        className={`text-[10px] sm:text-xs shrink-0 ${course.is_published ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0' : 'dark:bg-slate-700 dark:text-slate-300'}`}
                      >
                        {course.is_published ? "Chop etilgan" : "Qoralama"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 dark:border-slate-600 dark:text-slate-300">
                        {DIFFICULTY_OPTIONS.find(d => d.value === course.difficulty)?.label}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs sm:text-sm line-clamp-2 text-muted-foreground/80 dark:text-slate-400">{course.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 self-start sm:self-auto">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleCoursePublish(course)}
                      className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-primary/10 dark:hover:bg-primary/20"
                    >
                      {course.is_published ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openCourseDialog(course)}
                      className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-primary/10 dark:hover:bg-primary/20"
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 dark:from-slate-700/50 dark:to-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      <span className="text-xs sm:text-sm font-medium text-foreground">Darslar ({lessons[course.id]?.length || 0})</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openLessonDialog(course.id)}
                      className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3 bg-background/50 dark:bg-slate-800/50 border-border/50 dark:border-slate-600/50 hover:bg-primary/10 dark:hover:bg-primary/20 hover:border-primary/50"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      <span className="hidden xs:inline">Dars</span> qo'shish
                    </Button>
                  </div>
                  
                  {lessons[course.id]?.length > 0 && (
                    <div className="space-y-1.5 sm:space-y-2">
                      {lessons[course.id].map((lesson, index) => (
                        <div 
                          key={lesson.id}
                          className="flex flex-col xs:flex-row xs:items-center justify-between p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-secondary/60 to-secondary/40 dark:from-slate-700/60 dark:to-slate-700/40 border border-border/30 dark:border-slate-600/30 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-200 gap-2 xs:gap-0"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30 flex items-center justify-center shrink-0">
                              <span className="text-[10px] sm:text-xs font-bold text-primary">{index + 1}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-xs sm:text-sm truncate text-foreground">{lesson.title}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground/80 dark:text-slate-400 flex items-center gap-1">
                                <span>{lesson.duration_minutes} daq</span>
                                <span>·</span>
                                <span className={lesson.video_url ? 'text-green-500 dark:text-green-400' : 'text-muted-foreground/60'}>
                                  {lesson.video_url ? 'Video bor' : 'Video yo\'q'}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 sm:gap-1 justify-end xs:justify-start">
                            <Badge 
                              variant={lesson.is_published ? "default" : "outline"} 
                              className={`text-[9px] sm:text-xs shrink-0 ${lesson.is_published ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0' : 'dark:border-slate-600 dark:text-slate-300'}`}
                            >
                              {lesson.is_published ? "Faol" : "Yashirin"}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-primary/10 dark:hover:bg-primary/20"
                              onClick={() => toggleLessonPublish(lesson)}
                            >
                              {lesson.is_published ? <EyeOff className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-primary/10 dark:hover:bg-primary/20"
                              onClick={() => openLessonDialog(course.id, lesson)}
                            >
                              <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteLesson(lesson)}
                            >
                              <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-muted/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              {editingCourse ? "Kursni tahrirlash" : "Yangi kurs yaratish"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm">Kurs nomi</Label>
              <Input
                value={courseForm.title}
                onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Mental arifmetika asoslari"
                className="mt-1.5 text-sm dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Tavsif</Label>
              <Textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kurs haqida qisqacha..."
                className="mt-1.5 text-sm min-h-[80px] dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Kurs rasmi</Label>
              <div className="space-y-2 mt-1.5">
                {courseForm.thumbnail_url && (
                  <img 
                    src={courseForm.thumbnail_url} 
                    alt="Thumbnail" 
                    className="w-full h-24 sm:h-32 object-cover rounded-lg border border-border/50 dark:border-slate-600/50"
                  />
                )}
                
                {/* Drag and Drop Zone for Course Thumbnail */}
                <div
                  onDragOver={handleCourseThumbnailDragOver}
                  onDragLeave={handleCourseThumbnailDragLeave}
                  onDrop={handleCourseThumbnailDrop}
                  className={`relative border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-all ${
                    isCourseThumbnailDragging 
                      ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                      : 'border-border/50 dark:border-slate-600/50 hover:border-primary/50 dark:hover:border-primary/40'
                  } ${uploadingThumbnail ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                    <Upload className={`h-5 w-5 sm:h-6 sm:w-6 ${isCourseThumbnailDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-xs sm:text-sm">
                      <span className="text-muted-foreground">Rasmni shu yerga tashlang yoki </span>
                      <label className="text-primary cursor-pointer hover:underline font-medium">
                        tanlang
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleThumbnailUpload}
                          disabled={uploadingThumbnail}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground/70">Maksimum 5MB</p>
                    {uploadingThumbnail && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                  </div>
                </div>

                {/* URL Input */}
                <Input
                  value={courseForm.thumbnail_url}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  placeholder="Yoki rasm URL kiriting..."
                  className="text-xs sm:text-sm dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Qiyinchilik darajasi</Label>
              <Select 
                value={courseForm.difficulty} 
                onValueChange={(v) => setCourseForm(prev => ({ ...prev, difficulty: v }))}
              >
                <SelectTrigger className="mt-1.5 text-sm dark:bg-slate-800/50 dark:border-slate-600/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-600/50">
                  {DIFFICULTY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50 dark:bg-slate-800/50">
              <Label className="text-xs sm:text-sm">Chop etish</Label>
              <Switch
                checked={courseForm.is_published}
                onCheckedChange={(v) => setCourseForm(prev => ({ ...prev, is_published: v }))}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCourseDialogOpen(false)} className="w-full sm:w-auto text-sm dark:bg-slate-800/50 dark:border-slate-600/50 dark:hover:bg-slate-700/50">Bekor</Button>
            <Button onClick={handleSaveCourse} disabled={savingCourse} className="w-full sm:w-auto text-sm bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
              {savingCourse && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-muted/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30">
                <Video className="h-4 w-4 text-primary" />
              </div>
              {editingLesson ? "Darsni tahrirlash" : "Yangi dars qo'shish"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm">Dars nomi</Label>
              <Input
                value={lessonForm.title}
                onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="1-dars: Kirish"
                className="mt-1.5 text-sm dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Tavsif</Label>
              <Textarea
                value={lessonForm.description}
                onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Dars haqida qisqacha..."
                className="mt-1.5 text-sm min-h-[60px] dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Dars rasmi</Label>
              <div className="space-y-2 mt-1.5">
                {lessonForm.thumbnail_url && (
                  <img 
                    src={lessonForm.thumbnail_url} 
                    alt="Thumbnail" 
                    className="w-full h-20 sm:h-24 object-cover rounded-lg border border-border/50 dark:border-slate-600/50"
                  />
                )}
                
                {/* Drag and Drop Zone for Lesson Thumbnail */}
                <div
                  onDragOver={handleLessonThumbnailDragOver}
                  onDragLeave={handleLessonThumbnailDragLeave}
                  onDrop={handleLessonThumbnailDrop}
                  className={`relative border-2 border-dashed rounded-lg p-2.5 sm:p-3 text-center transition-all ${
                    isLessonThumbnailDragging 
                      ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                      : 'border-border/50 dark:border-slate-600/50 hover:border-primary/50 dark:hover:border-primary/40'
                  } ${uploadingLessonThumbnail ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Upload className={`h-4 w-4 sm:h-5 sm:w-5 ${isLessonThumbnailDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-[10px] sm:text-xs">
                      <span className="text-muted-foreground">Rasmni tashlang yoki </span>
                      <label className="text-primary cursor-pointer hover:underline font-medium">
                        tanlang
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleLessonThumbnailUpload}
                          disabled={uploadingLessonThumbnail}
                        />
                      </label>
                    </div>
                    {uploadingLessonThumbnail && (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-primary" />
                    )}
                  </div>
                </div>

                {/* URL Input */}
                <Input
                  value={lessonForm.thumbnail_url}
                  onChange={(e) => setLessonForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  placeholder="Yoki rasm URL kiriting..."
                  className="text-xs dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Video</Label>
              <div className="space-y-2 mt-1.5">
                {lessonForm.video_url && (
                  <video src={lessonForm.video_url} className="w-full h-24 sm:h-32 object-cover rounded-lg border border-border/50 dark:border-slate-600/50" controls />
                )}
                
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-all ${
                    isDragging 
                      ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                      : 'border-border/50 dark:border-slate-600/50 hover:border-primary/50 dark:hover:border-primary/40'
                  } ${uploadingVideo ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                    <Upload className={`h-6 w-6 sm:h-8 sm:w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-xs sm:text-sm">
                      <span className="text-muted-foreground">Videoni shu yerga tashlang yoki </span>
                      <label className="text-primary cursor-pointer hover:underline font-medium">
                        tanlang
                        <input 
                          type="file" 
                          accept="video/*" 
                          className="hidden" 
                          onChange={handleVideoUpload}
                          disabled={uploadingVideo}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground/70">Maksimum 500MB (chunked upload)</p>
                  </div>
                </div>

                {/* URL Input */}
                <Input
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="Yoki video URL kiriting..."
                  className="text-xs sm:text-sm dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
                />
                
                {/* Progress Bar */}
                {uploadingVideo && (
                  <div className="space-y-1.5 p-2.5 rounded-lg bg-muted/50 dark:bg-slate-800/50">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                      {uploadProgress < 90 ? 'Yuklanmoqda...' : 'Yakunlanmoqda...'} {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Davomiyligi (daqiqa)</Label>
              <Input
                type="number"
                value={lessonForm.duration_minutes}
                onChange={(e) => setLessonForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                className="mt-1.5 text-sm dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
              />
            </div>
            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50 dark:bg-slate-800/50">
              <Label className="text-xs sm:text-sm">Chop etish</Label>
              <Switch
                checked={lessonForm.is_published}
                onCheckedChange={(v) => setLessonForm(prev => ({ ...prev, is_published: v }))}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)} className="w-full sm:w-auto text-sm dark:bg-slate-800/50 dark:border-slate-600/50 dark:hover:bg-slate-700/50">Bekor</Button>
            <Button onClick={handleSaveLesson} disabled={savingLesson} className="w-full sm:w-auto text-sm bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
              {savingLesson && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
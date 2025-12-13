import { useState, useEffect, useRef, ReactNode, cloneElement, isValidElement } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useLocation } from 'react-router-dom';
import api from '@/config/axiosConfig';

interface LessonWrapperProps {
  lessonId: number;
  courseId: number;
  lessonType: string;
  isDoneInitial: boolean;
  children: ReactNode;
  videoDuration?: number; // Thời lượng video từ data (tính bằng phút)
}

const LessonWrapper = ({
  lessonId,
  courseId,
  lessonType,
  isDoneInitial,
  children,
  videoDuration = 0,
}: LessonWrapperProps) => {
  // Tính 50% thời lượng video (chuyển từ phút sang giây)
  // Nếu không có duration thì mặc định 10 giây
  const requiredWatchTime = videoDuration > 0 
    ? Math.floor((videoDuration * 60) * 0.5) 
    : 10;
  const { toast } = useToast();
  const { courseIsDone } = useLocation().state || { courseIsDone: false };

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDone, setIsDone] = useState<boolean>(isDoneInitial);
  const [isAllowedToComplete, setIsAllowedToComplete] =
    useState<boolean>(isDoneInitial);

  const unlockToastRef = useRef(false);
  const watchTimeRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);

  const type = lessonType?.trim().toLowerCase();

  // Callback nhận từ VideoLesson khi thời gian xem video thay đổi
  const handleVideoWatchTimeUpdate = (seconds: number) => {
    watchTimeRef.current = seconds;
    
    if (seconds >= requiredWatchTime && !isAllowedToComplete && !isDone) {
      setIsAllowedToComplete(true);
      if (!unlockToastRef.current) {
        unlockToastRef.current = true;
        toast({
          title: 'Bài học đã mở khóa! 🎉',
          description: 'Bạn có thể đánh dấu bài học này là đã hoàn thành.',
          className: 'bg-green-600 text-white border-none',
        });
      }
    }
  };

  // Fetch lesson progress from course endpoint
  const fetchLessonProgress = async () => {
    if (courseIsDone) {
      unlockToastRef.current = true;
      setIsDone(true);
      setIsAllowedToComplete(true);
      return;
    }

    try {
      const resCourse = await api.get(`/student/courses/${courseId}`);
      if (resCourse?.data?.result?.sectionProgress) {
        const course = resCourse.data.result;
        for (const sec of course.sectionProgress) {
          for (const l of sec.lessons) {
            if (l.lessonId === lessonId) {
              setIsDone(!!l.isDone);
              setIsAllowedToComplete(!!l.isDone);
              unlockToastRef.current = !!l.isDone;
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch lesson progress:', error);
    }

    setIsDone(false);
    setIsAllowedToComplete(false);
    unlockToastRef.current = false;
    watchTimeRef.current = 0;
  };

  useEffect(() => {
    fetchLessonProgress();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, courseId, courseIsDone]);

  // Auto-unlock countdown cho Reading lesson (video dùng callback riêng)
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (courseIsDone) return;
    if (isDone) return;
    // Chỉ đếm tự động cho reading, video sẽ dùng callback từ YouTube player
    if (type !== 'reading') return;

    intervalRef.current = window.setInterval(() => {
      watchTimeRef.current += 1;

      if (watchTimeRef.current >= requiredWatchTime && !isAllowedToComplete) {
        setIsAllowedToComplete(true);
        if (!unlockToastRef.current) {
          unlockToastRef.current = true;
          toast({
            title: 'Bài học đã mở khóa! 🎉',
            description: 'Bạn có thể đánh dấu bài học này là đã hoàn thành.',
            className: 'bg-green-600 text-white border-none',
          });
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [type, isDone, isAllowedToComplete, courseIsDone, toast, requiredWatchTime]);

  const refreshLessonStatusFromCourse = async () => {
    try {
      const res = await api.get(`/student/courses/${courseId}`);
      const course = res.data.result;
      if (!course?.sectionProgress) return;

      for (const section of course.sectionProgress) {
        for (const l of section.lessons) {
          if (l.lessonId === lessonId) {
            setIsDone(!!l.isDone);
            setIsAllowedToComplete(!!l.isDone);
            unlockToastRef.current = !!l.isDone;
            return;
          }
        }
      }
    } catch {
      // ignore
    }
  };

  const markLessonCompleted = async () => {
    if (courseIsDone) return;

    try {
      setIsUpdating(true);

      const payload = {
        isDone: true,
        watchedDuration: Number(watchTimeRef.current || 0),
      };

      const res = await api.post(
        `/student/lessons/${lessonId}/progress`,
        payload
      );

      if (res?.data?.code === 0) {
        toast({
          title: 'Đã hoàn thành ✔',
          description: 'Tiến độ của bạn đã được lưu.',
          className: 'bg-green-600 text-white border-none',
        });

        await fetchLessonProgress();
        await refreshLessonStatusFromCourse();
      } else {
        toast({
          variant: 'destructive',
          title: 'Thất bại',
          description: 'Không thể lưu tiến độ.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể kết nối đến máy chủ.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Clone children và inject props cho VideoLesson
  const renderChildren = () => {
    if (isValidElement(children) && type === 'video') {
      return cloneElement(children, {
        onWatchTimeUpdate: handleVideoWatchTimeUpdate,
        requiredWatchTime: requiredWatchTime,
      } as Record<string, unknown>);
    }
    return children;
  };

  return (
    <div className="lg:col-span-2">
      {renderChildren()}

      {/* MARK COMPLETE BUTTON */}
      <div className="flex justify-end mt-4 mb-8">
        <Button
          disabled={
            isDone || !isAllowedToComplete || isUpdating || courseIsDone
          }
          onClick={markLessonCompleted}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white shadow-md disabled:opacity-40 rounded-full"
        >
          {isDone || courseIsDone
            ? 'Đã hoàn thành'
            : !isAllowedToComplete
              ? 'Xem để mở khóa'
              : isUpdating
                ? 'Đang lưu...'
                : 'Đánh dấu hoàn thành'}
        </Button>
      </div>
    </div>
  );
};

export default LessonWrapper;

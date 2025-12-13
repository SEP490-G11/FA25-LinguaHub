import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CourseDetailView } from '@/components/shared/CourseDetailView';
import { coursesApi } from './api';
import type { Course } from './types';

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetail();
    }
  }, [courseId]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      const data = await coursesApi.getCourseDetail(courseId!);
      setCourse(data);
    } catch (error) {
      console.error('Error fetching course detail:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CourseDetailView
      course={course}
      loading={loading}
      backUrl="/admin/courses"
      backLabel="Quay lại danh sách"
    />
  );
}

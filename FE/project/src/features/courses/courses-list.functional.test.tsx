/**
 * 🎯 FUNCTION TEST: Show List Courses
 * 
 * Test hiển thị danh sách khóa học từ góc độ người dùng
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import CoursesGrid from '@/pages/LanguageCourses/components/sections/courses-grid';
import type { Course } from '@/types/Course';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

/**
 * Helper: Render component với providers
 */
const renderWithProviders = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

/**
 * Mock courses data
 */
const mockCourses: Course[] = [
  {
    id: 1,
    title: 'English for Beginners',
    description: 'Complete English course for beginners',
    shortDescription: 'Learn English from scratch',
    thumbnailURL: 'https://example.com/thumb1.jpg',
    categoryName: 'English',
    level: 'Beginner',
    tutorName: 'John Doe',
    tutorID: 1,
    learnerCount: 150,
    avgRating: 4.5,
    totalRatings: 30,
    duration: 20,
    language: 'English',
    price: 500000,
    status: 'ACTIVE',
    createdAt: '2024-01-01',
    isWishListed: false,
  },
  {
    id: 2,
    title: 'Advanced Spanish',
    description: 'Advanced Spanish conversation course',
    shortDescription: 'Master Spanish conversation',
    thumbnailURL: 'https://example.com/thumb2.jpg',
    categoryName: 'Spanish',
    level: 'Advanced',
    tutorName: 'Maria Garcia',
    tutorID: 2,
    learnerCount: 80,
    avgRating: 4.8,
    totalRatings: 20,
    duration: 30,
    language: 'Spanish',
    price: 750000,
    status: 'ACTIVE',
    createdAt: '2024-02-01',
    isWishListed: true,
  },
];

/**
 * Test Suite: Courses List Functional Tests
 */
describe('Courses List Functional Tests', () => {
  /**
   * Setup: Chạy trước mỗi test
   */
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  /**
   * TEST 1: Hiển thị danh sách courses
   */
  it('Shows list of courses with correct information', async () => {
    // 1️⃣ ARRANGE
    renderWithProviders(<CoursesGrid courses={mockCourses} />);

    // 2️⃣ ACT & ASSERT
    // Verify hiển thị 2 courses
    const courseCards = screen.getAllByRole('link');
    expect(courseCards).toHaveLength(2);

    // Verify course 1
    expect(screen.getByText('English for Beginners')).toBeInTheDocument();
    expect(screen.getByText('By John Doe')).toBeInTheDocument();
    expect(screen.getByText('Learn English from scratch')).toBeInTheDocument();
    expect(screen.getAllByText('English').length).toBeGreaterThan(0);
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument(); // learnerCount
    expect(screen.getByText('4.5')).toBeInTheDocument(); // rating

    // Verify course 2
    expect(screen.getByText('Advanced Spanish')).toBeInTheDocument();
    expect(screen.getByText('By Maria Garcia')).toBeInTheDocument();
    expect(screen.getByText('Master Spanish conversation')).toBeInTheDocument();
    expect(screen.getAllByText('Spanish').length).toBeGreaterThan(0);
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  /**
   * TEST 2: Hiển thị "Đang tải" khi loading
   */
  it('Shows loading state when loading is true', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<CoursesGrid courses={[]} loading={true} />);

    // 2️⃣ ASSERT
    expect(screen.getByText(/đang tải khóa học/i)).toBeInTheDocument();
  });

  /**
   * TEST 3: Hiển thị "Không có khóa học" khi danh sách rỗng
   */
  it('Shows empty state when no courses available', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<CoursesGrid courses={[]} loading={false} />);

    // 2️⃣ ASSERT
    expect(screen.getByText(/không có khóa học/i)).toBeInTheDocument();
    expect(
      screen.getByText(/bạn đã mua tất cả các khóa học có sẵn/i)
    ).toBeInTheDocument();
  });

  /**
   * TEST 4: Click vào course card navigate đến detail page
   */
  it('Navigates to course detail when clicking on course card', async () => {
    // 1️⃣ ARRANGE
    renderWithProviders(<CoursesGrid courses={mockCourses} />);

    // 2️⃣ ACT
    const firstCourseLink = screen.getAllByRole('link')[0];
    expect(firstCourseLink).toHaveAttribute('href', '/courses/1');

    const secondCourseLink = screen.getAllByRole('link')[1];
    expect(secondCourseLink).toHaveAttribute('href', '/courses/2');
  });

  /**
   * TEST 5: Click "Tham gia" button
   */
  it('Can click "Tham gia" button on course card', async () => {
    // 1️⃣ ARRANGE
    renderWithProviders(<CoursesGrid courses={mockCourses} />);

    // 2️⃣ ACT
    const joinButtons = screen.getAllByRole('button', { name: /tham gia/i });
    expect(joinButtons).toHaveLength(2);

    // Click first button
    await userEvent.click(joinButtons[0]);

    // 3️⃣ ASSERT
    // Button có thể click được
    expect(joinButtons[0]).toBeEnabled();
  });

  /**
   * TEST 6: Hiển thị đúng giá tiền
   */
  it('Displays course prices', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<CoursesGrid courses={mockCourses} />);

    // 2️⃣ ASSERT
    // Verify có hiển thị giá (toLocaleString format)
    const priceElements = screen.getAllByText(/₫/);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  /**
   * TEST 7: Hiển thị rating và số lượng reviews
   */
  it('Displays ratings and review counts', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<CoursesGrid courses={mockCourses} />);

    // 2️⃣ ASSERT
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(30)')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('(20)')).toBeInTheDocument();
  });

  /**
   * TEST 8: Hiển thị duration và language
   */
  it('Displays course duration and language', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<CoursesGrid courses={mockCourses} />);

    // 2️⃣ ASSERT
    expect(screen.getByText('20 giờ')).toBeInTheDocument();
    expect(screen.getByText('30 giờ')).toBeInTheDocument();
    
    // Language badges
    const languageBadges = screen.getAllByText('English');
    expect(languageBadges.length).toBeGreaterThan(0);
  });

  /**
   * TEST 9: Hiển thị category và level badges
   */
  it('Displays category and level badges', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<CoursesGrid courses={mockCourses} />);

    // 2️⃣ ASSERT
    // Categories (có thể có nhiều "English" vì category + language)
    expect(screen.getAllByText('English').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Spanish').length).toBeGreaterThan(0);

    // Levels
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  /**
   * TEST 10: Hiển thị learner count
   */
  it('Displays learner count for each course', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<CoursesGrid courses={mockCourses} />);

    // 2️⃣ ASSERT
    expect(screen.getByText('150')).toBeInTheDocument(); // Course 1
    expect(screen.getByText('80')).toBeInTheDocument(); // Course 2
  });

  /**
   * TEST 11: Hiển thị tutor name
   */
  it('Displays tutor name for each course', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<CoursesGrid courses={mockCourses} />);

    // 2️⃣ ASSERT
    expect(screen.getByText('By John Doe')).toBeInTheDocument();
    expect(screen.getByText('By Maria Garcia')).toBeInTheDocument();
  });

  /**
   * TEST 12: Course card có thumbnail image
   */
  it('Displays thumbnail images for courses', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<CoursesGrid courses={mockCourses} />);

    // 2️⃣ ASSERT
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/thumb1.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://example.com/thumb2.jpg');
    expect(images[0]).toHaveAttribute('alt', 'English for Beginners');
    expect(images[1]).toHaveAttribute('alt', 'Advanced Spanish');
  });
});

/**
 * 📊 Test Coverage Summary
 * 
 * ✅ Display: Hiển thị danh sách courses
 * ✅ Loading: Hiển thị loading state
 * ✅ Empty: Hiển thị empty state
 * ✅ Navigation: Click course card
 * ✅ Button: Click "Tham gia" button
 * ✅ Price: Hiển thị giá đúng format
 * ✅ Rating: Hiển thị rating và reviews
 * ✅ Duration: Hiển thị duration và language
 * ✅ Badges: Hiển thị category và level
 * ✅ Learners: Hiển thị số lượng học viên
 * ✅ Tutor: Hiển thị tên giáo viên
 * ✅ Image: Hiển thị thumbnail
 * 
 * Total: 12 tests
 */

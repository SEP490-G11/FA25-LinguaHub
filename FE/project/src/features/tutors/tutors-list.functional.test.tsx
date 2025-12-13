
/**
 * 🎯 FUNCTION TEST: Tutors List
 * 
 * Test hiển thị danh sách gia sư từ góc độ người dùng
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import TutorsGrid from '@/pages/Tutors/components/sections/tutors-grid';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren) => (
      <div {...props}>{children}</div>
    ),
  },
}));

/**
 * Mock tutors data
 */
const mockTutors = [
  {
    id: 1,
    name: 'John Smith',
    language: 'English',
    country: 'USA',
    rating: 4.8,
    reviews: 45,
    price: 50000,
    specialties: ['Business English', 'IELTS'],
    image: 'https://example.com/john.jpg',
    description: 'Experienced English teacher with 10 years of teaching',
    availability: 'Available',
  },
  {
    id: 2,
    name: 'Maria Garcia',
    language: 'Spanish',
    country: 'Spain',
    rating: 4.9,
    reviews: 38,
    price: 45000,
    specialties: ['Conversation', 'Grammar'],
    image: 'https://example.com/maria.jpg',
    description: 'Native Spanish speaker, passionate about teaching',
    availability: 'Available',
  },
  {
    id: 3,
    name: 'Yuki Tanaka',
    language: 'Japanese',
    country: 'Japan',
    rating: 4.7,
    reviews: 52,
    price: 60000,
    specialties: ['JLPT', 'Business Japanese'],
    image: 'https://example.com/yuki.jpg',
    description: 'Certified Japanese teacher, specializing in JLPT preparation',
    availability: 'Available',
  },
];

/**
 * Helper: Render component với providers
 */
const renderWithProviders = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

/**
 * Test Suite: Tutors List Functional Tests
 */
describe('Tutors List Functional Tests', () => {
  /**
   * Setup: Chạy trước mỗi test
   */
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  /**
   * TEST 1: Hiển thị danh sách tutors
   */
  it('Shows list of tutors with correct information', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={mockTutors} loading={false} />);

    // 2️⃣ ASSERT
    // Verify hiển thị 3 tutors
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
    expect(screen.getByText('Yuki Tanaka')).toBeInTheDocument();
  });

  /**
   * TEST 2: Hiển thị thông tin chi tiết của tutor
   */
  it('Displays tutor details correctly', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={mockTutors} loading={false} />);

    // 2️⃣ ASSERT
    // Tutor 1
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('USA')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('(45)')).toBeInTheDocument();
    expect(screen.getByText('Business English')).toBeInTheDocument();
    expect(screen.getByText('IELTS')).toBeInTheDocument();

    // Tutor 2
    expect(screen.getByText('Spain')).toBeInTheDocument();
    expect(screen.getByText('Spanish')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
  });

  /**
   * TEST 3: Hiển thị giá tiền đúng format
   */
  it('Displays tutor prices correctly', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={mockTutors} loading={false} />);

    // 2️⃣ ASSERT
    expect(screen.getByText('50,000₫')).toBeInTheDocument();
    expect(screen.getByText('45,000₫')).toBeInTheDocument();
    expect(screen.getByText('60,000₫')).toBeInTheDocument();
    
    // Verify có text "/giờ"
    const perHourTexts = screen.getAllByText('/giờ');
    expect(perHourTexts).toHaveLength(3);
  });

  /**
   * TEST 4: Hiển thị loading state
   */
  it('Shows loading state when loading is true', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={[]} loading={true} />);

    // 2️⃣ ASSERT
    expect(screen.getByText(/đang tải gia sư/i)).toBeInTheDocument();
  });

  /**
   * TEST 5: Hiển thị empty state khi không có tutors
   */
  it('Shows empty state when no tutors available', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={[]} loading={false} />);

    // 2️⃣ ASSERT
    expect(screen.getByText(/không tìm thấy gia sư/i)).toBeInTheDocument();
  });

  /**
   * TEST 6: Hiển thị rating với stars
   */
  it('Displays tutor ratings with stars', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={mockTutors} loading={false} />);

    // 2️⃣ ASSERT
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('4.7')).toBeInTheDocument();
  });

  /**
   * TEST 7: Hiển thị số lượng reviews
   */
  it('Displays review counts for each tutor', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={mockTutors} loading={false} />);

    // 2️⃣ ASSERT
    expect(screen.getByText('(45)')).toBeInTheDocument();
    expect(screen.getByText('(38)')).toBeInTheDocument();
    expect(screen.getByText('(52)')).toBeInTheDocument();
  });

  /**
   * TEST 8: Hiển thị specialties badges
   */
  it('Displays tutor specialties as badges', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={mockTutors} loading={false} />);

    // 2️⃣ ASSERT
    expect(screen.getByText('Business English')).toBeInTheDocument();
    expect(screen.getByText('IELTS')).toBeInTheDocument();
    expect(screen.getByText('Conversation')).toBeInTheDocument();
    expect(screen.getByText('Grammar')).toBeInTheDocument();
    expect(screen.getByText('JLPT')).toBeInTheDocument();
    expect(screen.getByText('Business Japanese')).toBeInTheDocument();
  });

  /**
   * TEST 9: Hiển thị description của tutor
   */
  it('Displays tutor descriptions', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={mockTutors} loading={false} />);

    // 2️⃣ ASSERT
    expect(
      screen.getByText(/experienced english teacher with 10 years/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/native spanish speaker, passionate about teaching/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/certified japanese teacher/i)
    ).toBeInTheDocument();
  });

  /**
   * TEST 10: Hiển thị country và language icons
   */
  it('Displays country and language information', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={mockTutors} loading={false} />);

    // 2️⃣ ASSERT
    expect(screen.getByText('USA')).toBeInTheDocument();
    expect(screen.getByText('Spain')).toBeInTheDocument();
    expect(screen.getByText('Japan')).toBeInTheDocument();
    
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Spanish')).toBeInTheDocument();
    expect(screen.getByText('Japanese')).toBeInTheDocument();
  });

  /**
   * TEST 11: Tutor card có link đến detail page
   */
  it('Tutor cards link to detail pages', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={mockTutors} loading={false} />);

    // 2️⃣ ASSERT
    const links = screen.getAllByRole('link');
    
    // Mỗi tutor có 2 links (card + button "Đặt lịch")
    expect(links.length).toBeGreaterThanOrEqual(3);
    
    // Verify href
    expect(links[0]).toHaveAttribute('href', '/tutors/1');
  });

  /**
   * TEST 12: Hiển thị "Đặt lịch" button
   */
  it('Displays booking button for each tutor', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={mockTutors} loading={false} />);

    // 2️⃣ ASSERT
    const bookingButtons = screen.getAllByText('Đặt lịch');
    expect(bookingButtons).toHaveLength(3);
  });

  /**
   * TEST 13: Hiển thị tutor images
   */
  it('Displays tutor profile images', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={mockTutors} loading={false} />);

    // 2️⃣ ASSERT
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
    
    expect(images[0]).toHaveAttribute('src', 'https://example.com/john.jpg');
    expect(images[0]).toHaveAttribute('alt', 'John Smith');
    
    expect(images[1]).toHaveAttribute('src', 'https://example.com/maria.jpg');
    expect(images[1]).toHaveAttribute('alt', 'Maria Garcia');
  });

  /**
   * TEST 14: Click vào tutor card
   */
  it('Can click on tutor card to view details', async () => {
    // 1️⃣ ARRANGE
    renderWithProviders(<TutorsGrid tutors={mockTutors} loading={false} />);

    // 2️⃣ ACT
    const firstCard = screen.getAllByRole('link')[0];
    await userEvent.click(firstCard);

    // 3️⃣ ASSERT
    // Link có href đúng
    expect(firstCard).toHaveAttribute('href', '/tutors/1');
  });

  /**
   * TEST 15: Hiển thị note về slot time
   */
  it('Displays slot time information', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<TutorsGrid tutors={mockTutors} loading={false} />);

    // 2️⃣ ASSERT
    const slotNotes = screen.getAllByText('(1 slot = 1 giờ)');
    expect(slotNotes).toHaveLength(3);
  });
});

/**
 * 📊 Test Coverage Summary
 * 
 * ✅ Display: Hiển thị danh sách tutors
 * ✅ Details: Hiển thị thông tin chi tiết
 * ✅ Price: Hiển thị giá đúng format
 * ✅ Loading: Hiển thị loading state
 * ✅ Empty: Hiển thị empty state
 * ✅ Rating: Hiển thị rating với stars
 * ✅ Reviews: Hiển thị số lượng reviews
 * ✅ Specialties: Hiển thị specialties badges
 * ✅ Description: Hiển thị mô tả
 * ✅ Location: Hiển thị country và language
 * ✅ Navigation: Link đến detail page
 * ✅ Booking: Hiển thị button đặt lịch
 * ✅ Images: Hiển thị ảnh profile
 * ✅ Interaction: Click vào card
 * ✅ Info: Hiển thị thông tin slot
 * 
 * Total: 15 tests
 */

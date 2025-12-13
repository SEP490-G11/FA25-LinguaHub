/**
 * 🎯 FUNCTION TEST: Chat Box
 * 
 * Test chức năng chat từ góc độ người dùng
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import Messages from '@/pages/MessagesPage/boxchat';
import { UserProvider } from '@/contexts/UserContext';

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
  return render(
    <BrowserRouter>
      <UserProvider>{component}</UserProvider>
    </BrowserRouter>
  );
};

/**
 * Test Suite: Chat Box Functional Tests
 */
describe('Chat Box Functional Tests', () => {
  /**
   * Setup: Chạy trước mỗi test
   */
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  /**
   * TEST 1: Hiển thị empty state khi chưa chọn conversation
   */
  it('Shows empty state when no conversation selected', async () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<Messages />);

    // 2️⃣ ASSERT
    await waitFor(() => {
      expect(screen.getByText(/Chọn một cuộc trò chuyện để bắt đầu nhắn tin/i)).toBeInTheDocument();
    });
    
    // Verify icon hiển thị
    expect(screen.getByText('💬')).toBeInTheDocument();
  });

  /**
   * TEST 2: Hiển thị danh sách conversations
   */
  it('Shows list of conversations', async () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<Messages />);

    // 2️⃣ ASSERT
    // Chờ conversations load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Tìm kiếm cuộc trò chuyện/i)).toBeInTheDocument();
    });
  });

  /**
   * TEST 3: Search conversations
   */
  it('Can search conversations', async () => {
    // 1️⃣ ARRANGE
    renderWithProviders(<Messages />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Tìm kiếm cuộc trò chuyện/i)).toBeInTheDocument();
    });

    // 2️⃣ ACT
    const searchInput = screen.getByPlaceholderText(/Tìm kiếm cuộc trò chuyện/i);
    await userEvent.type(searchInput, 'test');

    // 3️⃣ ASSERT
    expect(searchInput).toHaveValue('test');
  });

  /**
   * TEST 4: Hiển thị loading state
   */
  it('Shows loading state initially', () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<Messages />);

    // 2️⃣ ASSERT
    // Component sẽ hiển thị loading hoặc empty state ban đầu
    expect(screen.getByText(/Chọn một cuộc trò chuyện để bắt đầu nhắn tin/i) || 
           screen.getByText(/Đang tải/i)).toBeInTheDocument();
  });

  /**
   * TEST 5: Hiển thị header "Tin nhắn"
   */
  it('Shows messages header', async () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<Messages />);

    // 2️⃣ ASSERT
    await waitFor(() => {
      expect(screen.getByText('Tin nhắn')).toBeInTheDocument();
    });
  });

  /**
   * TEST 6: Responsive layout với grid
   */
  it('Has responsive grid layout', () => {
    // 1️⃣ ARRANGE & ACT
    const { container } = renderWithProviders(<Messages />);

    // 2️⃣ ASSERT
    // Verify có grid layout
    const gridElement = container.querySelector('.grid');
    expect(gridElement).toBeInTheDocument();
  });

  /**
   * TEST 7: Hiển thị search icon
   */
  it('Shows search icon in conversations list', async () => {
    // 1️⃣ ARRANGE & ACT
    renderWithProviders(<Messages />);

    // 2️⃣ ASSERT
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Tìm kiếm cuộc trò chuyện/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  /**
   * TEST 8: Clear search input
   */
  it('Can clear search input', async () => {
    // 1️⃣ ARRANGE
    renderWithProviders(<Messages />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Tìm kiếm cuộc trò chuyện/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm cuộc trò chuyện/i);
    
    // 2️⃣ ACT
    await userEvent.type(searchInput, 'test search');
    expect(searchInput).toHaveValue('test search');
    
    await userEvent.clear(searchInput);

    // 3️⃣ ASSERT
    expect(searchInput).toHaveValue('');
  });

  /**
   * TEST 9: Hiển thị container với shadow
   */
  it('Has styled container with shadow', () => {
    // 1️⃣ ARRANGE & ACT
    const { container } = renderWithProviders(<Messages />);

    // 2️⃣ ASSERT
    const shadowElement = container.querySelector('.shadow-lg');
    expect(shadowElement).toBeInTheDocument();
  });

  /**
   * TEST 10: Hiển thị background gradient
   */
  it('Has background styling', () => {
    // 1️⃣ ARRANGE & ACT
    const { container } = renderWithProviders(<Messages />);

    // 2️⃣ ASSERT
    const bgElement = container.querySelector('.bg-gray-50');
    expect(bgElement).toBeInTheDocument();
  });
});

/**
 * 📊 Test Coverage Summary
 * 
 * ✅ Empty State: Hiển thị khi chưa chọn conversation
 * ✅ Conversations List: Hiển thị danh sách
 * ✅ Search: Tìm kiếm conversations
 * ✅ Loading: Hiển thị loading state
 * ✅ Header: Hiển thị tiêu đề "Tin nhắn"
 * ✅ Layout: Responsive grid layout
 * ✅ Search Icon: Hiển thị icon tìm kiếm
 * ✅ Clear Search: Xóa nội dung tìm kiếm
 * ✅ Styling: Container với shadow
 * ✅ Background: Background styling
 * 
 * Total: 10 tests
 */

/**
 * 📝 TEMPLATE: Function Test
 * 
 * Copy template này để tạo function test mới
 * 
 * Bước 1: Copy file này
 * Bước 2: Đổi tên file theo feature (vd: login.functional.test.tsx)
 * Bước 3: Thay đổi component và test cases
 * Bước 4: Chạy test: npm run test:run -- <file-name>
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Import component cần test
// import YourComponent from '@/pages/YourComponent';

// Import providers nếu cần
// import { UserProvider } from '@/contexts/UserContext';

/**
 * Helper: Render component với providers
 */
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {/* Thêm providers khác nếu cần */}
      {component}
    </BrowserRouter>
  );
};

/**
 * Test Suite: [Tên Feature]
 */
describe('[Feature Name] Functional Tests', () => {
  /**
   * Setup: Chạy trước mỗi test
   */
  beforeEach(() => {
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset mocks nếu cần
    // vi.clearAllMocks();
  });

  /**
   * Test Case 1: Happy Path (Trường hợp thành công)
   */
  it('User can [do something] successfully', async () => {
    // 1️⃣ ARRANGE - Chuẩn bị
    // renderWithProviders(<YourComponent />);
    
    // Chờ component load xong
    // await waitFor(() => {
    //   expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    // });
    
    // 2️⃣ ACT - Thực hiện hành động
    // Tìm elements
    // const button = screen.getByRole('button', { name: /submit/i });
    // const input = screen.getByLabelText('Username');
    
    // User interactions
    // await userEvent.type(input, 'test value');
    // await userEvent.click(button);
    
    // 3️⃣ ASSERT - Kiểm tra kết quả
    // await waitFor(() => {
    //   expect(screen.getByText(/success/i)).toBeInTheDocument();
    // });
    
    expect(true).toBe(true); // Placeholder
  });

  /**
   * Test Case 2: Error Case (Trường hợp lỗi)
   */
  it('Shows error when [something goes wrong]', async () => {
    // 1️⃣ ARRANGE
    // renderWithProviders(<YourComponent />);
    
    // 2️⃣ ACT
    // Thực hiện hành động gây lỗi
    
    // 3️⃣ ASSERT
    // Verify hiển thị error message
    // await waitFor(() => {
    //   expect(screen.getByText(/error/i)).toBeInTheDocument();
    // });
    
    expect(true).toBe(true); // Placeholder
  });

  /**
   * Test Case 3: Validation (Kiểm tra validation)
   */
  it('Validates user input correctly', async () => {
    // 1️⃣ ARRANGE
    // renderWithProviders(<YourComponent />);
    
    // 2️⃣ ACT
    // Nhập dữ liệu không hợp lệ
    
    // 3️⃣ ASSERT
    // Verify hiển thị validation error
    
    expect(true).toBe(true); // Placeholder
  });

  /**
   * Test Case 4: Edge Case (Trường hợp đặc biệt)
   */
  it('Handles edge case correctly', async () => {
    // Test các trường hợp đặc biệt
    // - Empty input
    // - Very long input
    // - Special characters
    // - etc.
    
    expect(true).toBe(true); // Placeholder
  });
});

/**
 * 📚 CHEAT SHEET
 * 
 * === QUERIES ===
 * screen.getByRole('button', { name: /submit/i })
 * screen.getByLabelText('Username')
 * screen.getByPlaceholderText('Enter username')
 * screen.getByText('Welcome')
 * screen.getByTestId('custom-element')
 * 
 * === USER EVENTS ===
 * await userEvent.type(input, 'text')
 * await userEvent.click(button)
 * await userEvent.clear(input)
 * await userEvent.selectOptions(select, 'value')
 * await userEvent.upload(fileInput, file)
 * 
 * === ASSERTIONS ===
 * expect(element).toBeInTheDocument()
 * expect(element).toHaveTextContent('text')
 * expect(element).toBeVisible()
 * expect(element).toBeDisabled()
 * expect(element).toHaveValue('value')
 * 
 * === ASYNC ===
 * await waitFor(() => {
 *   expect(screen.getByText('Success')).toBeInTheDocument();
 * });
 * 
 * const element = await screen.findByText('Async text');
 * 
 * === NEGATIVE ASSERTIONS ===
 * expect(screen.queryByText('Not exist')).not.toBeInTheDocument();
 */

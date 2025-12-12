## Công nghệ sử dụng


### Core Technologies
- **React 18.3**: Thư viện UI chính
- **TypeScript 5.5**: Ngôn ngữ lập trình với type safety
- **Vite 5.4**: Build tool và dev server
- **Tailwind CSS 3.4**: Utility-first CSS framework

### UI Components & Styling
- **Radix UI**: Bộ component primitives (Dialog, Dropdown, Select, Toast, Tabs, v.v.)
- **shadcn/ui**: Component system dựa trên Radix UI
- **Lucide React**: Icon library
- **Framer Motion**: Animation library
- **Sonner**: Toast notifications
- **Class Variance Authority**: Quản lý variants cho components

### State Management & Data Fetching
- **React Context API**: Quản lý state toàn cục (UserContext, SidebarContext)
- **TanStack React Query 5.90**: Quản lý gọi API và cache dữ liệu
- **Axios 1.12**: HTTP client

### Routing & Forms
- **React Router DOM 7.9**: Định tuyến và chuyển trang
- **React Hook Form 7.65**: Quản lý form
- **Zod 4.1**: Schema validation


### Additional Libraries
- **React Player**: Video player component
- **React Quill**: Rich text editor
- **JWT Decode**: Giải mã JWT tokens
- **Date-fns**: Xử lý ngày tháng
- **QRCode**: Tạo mã QR
- **MiniSearch**: Full-text search engine
- **Supabase**: Backend as a Service
- **Google OAuth**: Đăng nhập với Google

### Testing
- **Vitest 4.0**: Test runner và framework
- **@vitest/ui**: UI cho Vitest
- **React Testing Library 16.3**: Testing utilities
- **@testing-library/user-event**: Mô phỏng tương tác người dùng
- **@testing-library/jest-dom**: Custom matchers cho DOM
- **MSW 2.12**: Mock Service Worker cho API mocking
- **jsdom**: DOM implementation cho testing

```

## Cấu trúc thư mục

src/
 api/                   # API client và endpoints
 components/            # Các component của dự án
    booking/            # Components liên quan đến booking
    charts/             # Components biểu đồ và thống kê
    layout/             # Layout components (Header, Footer, Sidebar)
    shared/             # Components chia sẻ (modal, table, ...)
    ui/                 # Bộ component shadcn/ui
 config/                # Cấu hình ứng dụng (axios, env, ...)
 contexts/              # React Context (UserContext, SidebarContext)
 features/              # Feature-based modules (functional tests)
 hooks/                 # Custom hooks (useNotifications, useTutorSearch, ...)
 lib/                   # Utility functions và helpers
 pages/                 # Các trang của dự án
 queries/               # React Query: gọi API theo feature
 routes/                # Router, protected routes, điều hướng
 test/                  # Test setup và mocks
 types/                 # TypeScript interfaces và types
 utils/                 # Utility functions (jwt-decode, validation, ...)
 ```

```
Ngôn ngữ chính:
 TypeScript - Ngôn ngữ lập trình chính với type safety
 TSX/JSX - Cú pháp cho React components
 CSS - Styling với Tailwind CSS

```






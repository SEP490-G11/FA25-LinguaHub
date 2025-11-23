## Sử dụng

- \*\*React
- **Vite**
- \*\*Tailwindcss
- **shadcn/ui** (dựa trên Radix UI): Bộ component UI chính của dự án
- **TanStack React Query**: Quản lý gọi API và cache dữ liệu
- **React Router v6**: Định tuyến và chuyển trang
- **Zod** cùng **react-hook-form**: Xác thực và kiểm soát form
- **Axios**

- Node.js >= 18
- npm >= 9 (hoặc dùng pnpm/yarn, tùy chọn)
Mở dự án tại port `http://localhost:3000`
- Thêm CORS ở BE để cho phép FE truy cập
---

## Cấu trúc thư mục
```
src/
components/        # Chứa các component của dự  án
pages/             # Các trang của dự án
routes/            # Router, protected routes, hooks điều hướng
queries/           # React Query: gọi API theo feature
lib/               # utils chung (api.ts, utils.ts)
hooks/             # hooks dùng chung (debounce, use-mobile, ...)
constants/         # chứa các biến cố định, mock data, icon svg
components/ui/     # Bộ component shadcn/ui
components/shared/ # Component chia sẻ (modal, table, ...)
type/              # chứa các interface TypeScript mô tả các đối tượng dữ liệu
```
```
Ngôn ngữ chính:
 TypeScript - Ngôn ngữ lập trình chính với type safety
 TSX/JSX - Cú pháp cho React components
 CSS - Styling với Tailwind CSS

```

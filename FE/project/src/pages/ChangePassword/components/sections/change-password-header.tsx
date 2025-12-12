import { Lock } from "lucide-react";

export const ChangePasswordHeader = () => {
  return (
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Đổi mật khẩu</h1>
              <p className="text-sm text-gray-500">
                Cập nhật mật khẩu để giữ tài khoản của bạn an toàn.
              </p>
            </div>
          </div>
        </div>
      </div>
  );
};

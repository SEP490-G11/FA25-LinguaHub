import { User } from "lucide-react";

export const ProfileHeader = () => {
  return (
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hồ sơ của tôi</h1>
              <p className="text-sm text-gray-500">Quản lý thông tin cá nhân của bạn</p>
            </div>
          </div>
        </div>
      </div>
  );
};

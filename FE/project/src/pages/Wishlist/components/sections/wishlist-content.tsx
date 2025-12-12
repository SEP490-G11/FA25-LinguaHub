import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  Star,
  Clock,
  Users,
  Trash2,
  ShoppingCart,
} from "lucide-react";

interface WishlistItem {
  id: number;
  title: string;
  shortDescription?: string;
  description: string;
  duration: number | null;
  price: number;
  language: string;
  thumbnailURL: string;
  categoryName: string;
  tutorName: string;
  level?: string;
  learnerCount: number | null;
  avgRating: number | null;
  totalRatings: number | null;
}

interface WishlistContentProps {
  wishlistItems: WishlistItem[];
  onRemoveItem: (id: number) => void;
  loading: boolean;
}

const WishlistContent = ({
  wishlistItems,
  onRemoveItem,
  loading,
}: WishlistContentProps) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: { staggerChildren: 0.1 },
    },
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  if (loading) {
    return (
      <section className="py-16 text-center">
        <p className="text-gray-500 text-lg">Đang tải danh sách yêu thích...</p>
      </section>
    );
  }

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <motion.div
            className="text-center py-16"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Không tìm thấy khóa học
            </h2>
            <p className="text-gray-600 mb-8">
              Thử thay đổi bộ lọc hoặc thêm khóa học mới!
            </p>
            <Link
              to="/languages"
              className="bg-blue-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-600 transition-colors"
            >
              Khám phá khóa học
            </Link>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <motion.div
          key={wishlistItems.map((t) => t.id).join("-")}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {wishlistItems.map((item) => (
            <motion.div
              key={item.id}
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group border border-blue-100 flex flex-col h-full"
            >
              <Link
                to={`/courses/${item.id}`}
                className="block hover:no-underline"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={item.thumbnailURL}
                    alt={item.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Badges ở góc trên */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-yellow-400 text-blue-900 text-xs px-2 py-1 rounded-full font-semibold">
                      {item.categoryName || "Uncategorized"}
                    </span>
                    {item.level && (
                      <span className="bg-white text-gray-800 text-xs px-2 py-1 rounded-full font-semibold border border-gray-300">
                        {item.level}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  {/* Title */}
                  <h3
                    className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[56px]"
                    title={item.title}
                  >
                    {item.title}
                  </h3>

                  {/* Tutor name */}
                  <p
                    className="text-gray-600 mb-3 text-sm truncate"
                    title={item.tutorName}
                  >
                    by {item.tutorName}
                  </p>

                  {/* Short Description */}
                  <p
                    className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-3"
                    title={
                      item.shortDescription ||
                      item.description ||
                      "Không có mô tả"
                    }
                  >
                    {item.shortDescription ||
                      item.description ||
                      "Không có mô tả"}
                  </p>

                  {/* Rating + Learners */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{item.learnerCount ?? 0}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>
                        {item.avgRating !== null
                          ? item.avgRating.toFixed(1)
                          : "N/A"}
                      </span>
                      <span className="text-xs opacity-70">
                        ({item.totalRatings ?? 0})
                      </span>
                    </div>
                  </div>

                  {/* Duration + Language */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{item.duration ?? 0} giờ</span>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                      {item.language || "N/A"}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-auto pt-3 border-t">
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Actions */}
              <div className="border-t border-blue-100 bg-blue-50 px-6 py-4 rounded-b-xl flex justify-between items-center gap-3">
                <Link
                  to={`/courses/${item.id}`}
                  className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Xem chi tiết</span>
                </Link>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  title="Xóa khỏi danh sách yêu thích"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WishlistContent;

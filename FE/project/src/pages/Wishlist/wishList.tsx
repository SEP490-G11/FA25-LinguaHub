import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/config/axiosConfig";
import { useToast } from "@/components/ui/use-toast";
import { ROUTES } from "@/constants/routes";
import HeroSection from "./components/sections/hero-section";
import FiltersSection from "./components/sections/filters-section";
import WishlistContent from "./components/sections/wishlist-content";
import Pagination from "./components/sections/pagination";
import { getApiErrorMessage } from "@/utils/errorMessages";

interface WishlistItem {
  id: number;
  title: string;
  shortDescription?: string;
  description: string;
  requirement?: string;
  level?: string;
  duration: number | null;
  price: number;
  language: string;
  thumbnailURL: string;
  categoryName: string;
  tutorName: string;
  status: string;
  isWishListed: boolean;
  isPurchased: boolean;
  learnerCount: number | null;
  tutorAvatarURL: string | null;
  tutorAddress: string | null;
  avgRating: number | null;
  totalRatings: number | null;
  createdAt: string;
}

const Wishlist = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedLevel, setSelectedLevel] = useState("Tất cả");
  const [selectedRating, setSelectedRating] = useState(0);
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");

  // Lấy danh sách danh mục có sẵn
  const categories = useMemo(() => {
    const cats = new Set(
      wishlistItems.map((item) => item.categoryName).filter(Boolean)
    );
    return ["Tất cả", ...Array.from(cats)];
  }, [wishlistItems]);

  // Compute filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = wishlistItems.filter((item) => {
      // Search
      const matchSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase());

      // Category
      const matchCategory =
        selectedCategory === "Tất cả" || item.categoryName === selectedCategory;

      // Level
      const matchLevel =
        selectedLevel === "Tất cả" || item.level === selectedLevel;

      // Rating
      const matchRating =
        selectedRating === 0 || (item.avgRating ?? 0) >= selectedRating;

      return matchSearch && matchCategory && matchLevel && matchRating;
    });

    // Sort by price
    if (priceSort === "asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (priceSort === "desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [wishlistItems, searchTerm, selectedCategory, selectedLevel, selectedRating, priceSort]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedLevel, selectedRating, priceSort]);

  // Fetch wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);

      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

      if (!token) {
        toast({
          variant: "destructive",
          title: "Bạn chưa đăng nhập",
          description: "Vui lòng đăng nhập để xem danh sách yêu thích.",
        });
        navigate(ROUTES.SIGN_IN);
        return;
      }

      try {
        const res = await api.get("/wishlist");

        let items: WishlistItem[] = [];
        if (Array.isArray(res.data)) {
          items = res.data;
        } else if (Array.isArray(res.data?.result)) {
          items = res.data.result;
        }

        // Filter out purchased items
        const purchasedItems = items.filter((item) => item.isPurchased === true);
        const notPurchasedItems = items.filter(
          (item) => item.isPurchased === false || item.isPurchased === null
        );

        // Auto-remove purchased courses
        if (purchasedItems.length > 0) {
          for (const item of purchasedItems) {
            try {
              await api.delete(`/wishlist/${item.id}`);
            } catch (err) {
              console.error(`Failed to remove course ${item.id}:`, err);
            }
          }
          toast({
            title: "Đã cập nhật danh sách yêu thích",
            description: `${purchasedItems.length} khóa học đã mua được tự động xóa.`,
          });
        }

        setWishlistItems(notPurchasedItems);
      } catch (error) {
        console.error("Wishlist Error:", error);
        const errorMsg = getApiErrorMessage(error, "Vui lòng thử lại sau.");
        toast({
          variant: "destructive",
          title: "Không thể tải danh sách yêu thích",
          description: errorMsg,
        });
        navigate(ROUTES.SIGN_IN);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [navigate, toast]);

  // Remove wishlist item
  const removeFromWishlist = async (id: number) => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    if (!token) {
      toast({
        variant: "destructive",
        title: "Bạn chưa đăng nhập",
        description: "Vui lòng đăng nhập để xóa mục.",
      });
      navigate(ROUTES.SIGN_IN);
      return;
    }

    try {
      await api.delete(`/wishlist/${id}`);
      setWishlistItems((prev) => prev.filter((item) => item.id !== id));
      toast({
        variant: "success",
        title: "Đã xóa khỏi danh sách yêu thích",
      });
    } catch (error) {
      const errorMsg = getApiErrorMessage(error, "Vui lòng thử lại sau.");
      toast({
        variant: "destructive",
        title: "Xóa thất bại",
        description: errorMsg,
      });
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Auto reset if page > total
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection
        itemCount={wishlistItems.length}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
      />

      {/* Filters */}
      <FiltersSection
        categories={categories}
        selectedCategory={selectedCategory}
        selectedLevel={selectedLevel}
        selectedRating={selectedRating}
        priceSort={priceSort}
        itemCount={filteredItems.length}
        onCategoryChange={(v: string) => {
          setSelectedCategory(v);
          setCurrentPage(1);
        }}
        onLevelChange={(v: string) => {
          setSelectedLevel(v);
          setCurrentPage(1);
        }}
        onRatingChange={(r: number) => {
          setSelectedRating(r);
          setCurrentPage(1);
        }}
        onPriceSortChange={(s: "none" | "asc" | "desc") => {
          setPriceSort(s);
          setCurrentPage(1);
        }}
      />

      {/* Wishlist Grid */}
      <WishlistContent
        wishlistItems={paginatedItems}
        onRemoveItem={removeFromWishlist}
        loading={loading}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
};

export default Wishlist;

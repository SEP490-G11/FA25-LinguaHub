import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Bell, Menu, X, Languages, Heart, User, LogOut,
    GraduationCap, CreditCard, Lock, MessageCircle, DollarSign, Calendar
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/constants/routes";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/contexts/UserContext";
import { SafeAvatar } from "@/components/ui/safe-avatar";

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const { user, setUser, refreshUser, loading } = useUser();

    const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

    const isAuthenticated = !!token;

    const { recentNotifications, unreadCount, markAsRead } = useNotifications();

    // === Logout ===
    const handleLogout = () => {
        // Clear all tokens
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        
        // Clear user state
        setUser(null);
        
        // Redirect to sign in page with full reload to clear all state
        window.location.href = ROUTES.SIGN_IN;
    };

    const isActive = (path: string) => location.pathname === path;

    // Refresh user when coming back from profile page
    useEffect(() => {
        if (isAuthenticated && location.pathname !== ROUTES.PROFILE) {
            // Small delay to ensure profile updates are saved
            const timer = setTimeout(() => {
                refreshUser();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [location.pathname]);

    return (
        <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
            <div className="w-full px-8 lg:px-16">
                <div className="flex justify-between items-center h-16 gap-4">
                    {/* ===== Logo ===== */}
                    <Link
                        to={ROUTES.HOME}
                        className="flex items-center gap-2 flex-shrink-0"
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ minWidth: 'fit-content' }}
                    >
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg flex-shrink-0">
                            <Languages className="w-6 h-6 text-white flex-shrink-0" />
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-foreground whitespace-nowrap flex-shrink-0">
                            Lingua<span className="text-primary">Hub</span>
                        </div>
                    </Link>

                    {/* ===== Navigation (ẩn trên mobile & tablet) ===== */}
                    <nav className="hidden xl:flex items-center ml-8">
                        <div className="flex space-x-4 xl:space-x-6 2xl:space-x-8">
                            <Link
                                to={ROUTES.HOME}
                                className={cn(
                                    "font-medium transition-colors whitespace-nowrap text-sm xl:text-base",
                                    isActive(ROUTES.HOME)
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-primary"
                                )}
                            >
                                Trang chủ
                            </Link>
                            <Link
                                to={ROUTES.LANGUAGES}
                                className={cn(
                                    "font-medium transition-colors whitespace-nowrap text-sm xl:text-base",
                                    isActive(ROUTES.LANGUAGES)
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-primary"
                                )}
                            >
                                Ngôn ngữ
                            </Link>
                            <Link
                                to={ROUTES.TUTORS}
                                className={cn(
                                    "font-medium transition-colors whitespace-nowrap text-sm xl:text-base",
                                    isActive(ROUTES.TUTORS)
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-primary"
                                )}
                            >
                                Gia sư
                            </Link>
                            <Link
                                to={ROUTES.BECOME_TUTOR}
                                className={cn(
                                    "font-medium transition-colors whitespace-nowrap text-sm xl:text-base",
                                    isActive(ROUTES.BECOME_TUTOR)
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-primary"
                                )}
                            >
                                Trở thành gia sư
                            </Link>
                        </div>
                    </nav>
                    
                    {/* Spacer to push right section to the right */}
                    <div className="flex-1" />

                    {/* ===== Right Section ===== */}
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                        {/* Wishlist - chỉ hiện khi đã đăng nhập và không phải Admin */}
                        {isAuthenticated && user?.role !== 'Admin' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="flex-shrink-0"
                                onClick={() => navigate(ROUTES.WISHLIST)}
                            >
                                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                        )}

                        {/* Notifications - chỉ hiện khi đã đăng nhập và không phải Admin */}
                        {isAuthenticated && user?.role !== 'Admin' && (
                            <DropdownMenu
                                open={notificationsOpen}
                                onOpenChange={setNotificationsOpen}
                            >
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="relative flex-shrink-0"
                                    >
                                        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                                        {unreadCount > 0 && (
                                            <Badge 
                                                variant="destructive" 
                                                className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs"
                                            >
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </Badge>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="w-80">
                                    <DropdownMenuLabel className="flex items-center justify-between">
                                        <span>Thông báo</span>
                                        {unreadCount > 0 && (
                                            <Badge variant="secondary" className="ml-2">
                                                {unreadCount} mới
                                            </Badge>
                                        )}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    
                                    {recentNotifications.length === 0 ? (
                                        <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                                            Không có thông báo
                                        </div>
                                    ) : (
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {recentNotifications.map((notification) => (
                                                <DropdownMenuItem
                                                    key={notification.notificationId}
                                                    className={cn(
                                                        "flex flex-col items-start gap-1 p-3 cursor-pointer",
                                                        !notification.isRead && "bg-blue-50/50"
                                                    )}
                                                    onClick={async () => {
                                                        // Mark as read
                                                        if (!notification.isRead) {
                                                            await markAsRead(notification.notificationId);
                                                        }
                                                        
                                                        // Navigate to URL
                                                        if (notification.primaryActionUrl) {
                                                            navigate(notification.primaryActionUrl);
                                                        }
                                                        setNotificationsOpen(false);
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between w-full gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
                                                                {notification.content}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                        {!notification.isRead && (
                                                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                                                        )}
                                                    </div>
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                    )}
                                    
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="justify-center text-primary font-medium cursor-pointer"
                                        onClick={() => {
                                            navigate(ROUTES.NOTIFICATIONS);
                                            setNotificationsOpen(false);
                                        }}
                                    >
                                        Tất cả thông báo
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        {/* Auth menu */}
                        {!isAuthenticated ? (
                            <>
                                <Button variant="ghost" asChild className="hidden sm:flex">
                                    <Link to={ROUTES.SIGN_IN}>Đăng nhập</Link>
                                </Button>
                                <Button asChild className="hidden sm:flex">
                                    <Link to={ROUTES.SIGN_UP}>Đăng ký</Link>
                                </Button>
                            </>
                        ) : (

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-10 w-10 rounded-full p-0 flex-shrink-0"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                                        ) : (
                                            <SafeAvatar
                                                src={user?.avatarURL}
                                                alt={user?.fullName || "Ảnh đại diện"}
                                                fallback={user?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                                                className="h-10 w-10 border-2 border-white shadow-md"
                                            />
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {user?.fullName || "Loading..."}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                 {user?.email || ""}
                                             </span>
                                        </div>
                                    </DropdownMenuLabel>

                                    <DropdownMenuSeparator />

                                    {/* Chỉ hiển thị các menu item cho user không phải Admin */}
                                    {user?.role !== 'Admin' && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link to={ROUTES.PROFILE}>
                                                    <User className="mr-2 h-4 w-4" /> Hồ sơ
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem asChild>
                                                <Link to={ROUTES.MY_ENROLLMENTS}>
                                                    <GraduationCap className="mr-2 h-4 w-4" /> Tiến độ học tập
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem asChild>
                                                <Link to="/learner/bookings" className="cursor-pointer">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    <span>Lịch học của tôi</span>
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem asChild>
                                                <Link to="/messages">
                                                    <MessageCircle className="mr-2 h-4 w-4" />Hộp chat
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem asChild>
                                                <Link to={ROUTES.REFUND_REQUESTS} className="cursor-pointer">
                                                    <DollarSign className="mr-2 h-4 w-4" />
                                                    <span>Yêu cầu hoàn tiền</span>
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem asChild>
                                                <Link to={ROUTES.PAYMENT_HISTORY}>
                                                    <CreditCard className="mr-2 h-4 w-4" /> Lịch sử thanh toán
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem asChild>
                                                <Link to={ROUTES.CHANGE_PASSWORD}>
                                                    <Lock className="mr-2 h-4 w-4" /> Đổi mật khẩu
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />
                                        </>
                                    )}

                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Mobile menu toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="xl:hidden flex-shrink-0"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* ===== Mobile Navigation ===== */}
                {mobileMenuOpen && (
                    <div className="xl:hidden border-t bg-white shadow-lg">
                        <nav className="flex flex-col p-4 space-y-1">
                            {!isAuthenticated && (
                                <>
                                    <Link 
                                        to={ROUTES.SIGN_IN} 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="sm:hidden px-4 py-3 text-sm font-medium text-primary hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        Đăng nhập
                                    </Link>
                                    <Link 
                                        to={ROUTES.SIGN_UP} 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="sm:hidden px-4 py-3 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors text-center"
                                    >
                                        Đăng ký
                                    </Link>
                                    <div className="sm:hidden h-px bg-gray-200 my-2" />
                                </>
                            )}
                            <Link 
                                to={ROUTES.HOME} 
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                    isActive(ROUTES.HOME)
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                Trang chủ
                            </Link>
                            <Link
                                to={ROUTES.LANGUAGES}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                    isActive(ROUTES.LANGUAGES)
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                Ngôn ngữ
                            </Link>
                            <Link
                                to={ROUTES.TUTORS}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                    isActive(ROUTES.TUTORS)
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                Gia sư
                            </Link>
                            <Link
                                to={ROUTES.BECOME_TUTOR}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                    isActive(ROUTES.BECOME_TUTOR)
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                Trở thành gia sư
                            </Link>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;

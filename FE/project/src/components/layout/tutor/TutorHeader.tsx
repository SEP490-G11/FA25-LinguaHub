import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Bell, Languages, User, LogOut,
    Settings, Lock, LayoutDashboard
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

const TutorHeader = () => {
    const navigate = useNavigate();
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const { user, setUser, refreshUser, loading } = useUser();

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

    return (
        <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
            <div className="w-full px-8 lg:px-16">
                <div className="flex justify-between items-center h-16 gap-4">
                    {/* ===== Logo ===== */}
                    <Link
                        to={ROUTES.TUTOR_DASHBOARD}
                        className="flex items-center gap-2 flex-shrink-0"
                        style={{ minWidth: 'fit-content' }}
                    >
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg flex-shrink-0">
                            <Languages className="w-6 h-6 text-white flex-shrink-0" />
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-foreground whitespace-nowrap flex-shrink-0">
                            Lingua<span className="text-primary">Hub</span>
                        </div>
                    </Link>
                    
                    {/* Spacer to push right section to the right */}
                    <div className="flex-1" />

                    {/* ===== Right Section ===== */}
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                        {/* Notifications */}
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

                        {/* ROLE BADGE */}
                        <div className="hidden sm:flex px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold bg-purple-100 text-purple-700 rounded-full border border-purple-200 whitespace-nowrap flex-shrink-0">
                            Gia sư
                        </div>

                        {/* User Menu */}
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
                                        <img
                                            src={user?.avatarURL || "https://placehold.co/200x200?text=No+Image"}
                                            alt={user?.fullName || "User avatar"}
                                            className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-md"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://placehold.co/200x200?text=No+Image";
                                            }}
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

                                <DropdownMenuItem asChild>
                                    <Link to={ROUTES.PROFILE}>
                                        <User className="mr-2 h-4 w-4" /> Hồ sơ
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem asChild>
                                    <Link to={ROUTES.TUTOR_DASHBOARD}>
                                        <LayoutDashboard className="mr-2 h-4 w-4" /> Bảng điều khiển
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem asChild>
                                    <Link to={ROUTES.CHANGE_PASSWORD}>
                                        <Lock className="mr-2 h-4 w-4" /> Đổi mật khẩu
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem asChild>
                                    <Link to="/tutor/settings">
                                        <Settings className="mr-2 h-4 w-4" /> Cài đặt
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TutorHeader;

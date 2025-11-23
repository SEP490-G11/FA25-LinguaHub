import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Bell, Menu, X, Languages, Heart, User, LogOut,
    Settings, GraduationCap, CreditCard, Lock, LayoutDashboard, MessageCircle, DollarSign, Calendar
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import api from "@/config/axiosConfig";
import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { notificationApi } from "@/queries/notification-api";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface User {
    fullName: string;
    email: string;
    avatarURL?: string;
    role: "Admin" | "Tutor" | "Learner";
}

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

    const isAuthenticated = !!token;
    const [user, setUser] = useState<User | null>(null);
    

    const { recentNotifications, unreadCount, refetch } = useNotifications();


    useEffect(() => {
        if (!isAuthenticated) return;

        api
            .get("/users/myInfo")
            .then((res) => setUser(res.data.result as User))
            .catch(() => {
                localStorage.removeItem("access_token");
                sessionStorage.removeItem("access_token");
                navigate(ROUTES.SIGN_IN);
            });
    }, [isAuthenticated, navigate]);

    // === Logout ===
    const handleLogout = () => {
        // Clear all tokens
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        
        // Clear user state
        setUser(null);
        
        // Navigate to sign in
        navigate(ROUTES.SIGN_IN, { replace: true });
        
        // Force reload to clear all state
        window.location.reload();
    };

    const getUserInitial = (fullName: string) => {
        if (!fullName) return "U";
        return fullName.trim()[0].toUpperCase();
    };

    const isTutorPage = /^\/tutor(\/|$)/.test(location.pathname);
    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
            <div className="w-full px-8 lg:px-16">
                <div className="flex justify-between items-center h-16">
                    {/* ===== Logo ===== */}
                    <Link
                        to={ROUTES.HOME}
                        className="flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                            <Languages className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            Lingua<span className="text-primary">Hub</span>
                        </div>
                    </Link>

                    {/* ===== Navigation (ẩn trên mobile) ===== */}
                    {!isTutorPage && (
                        <nav className="hidden md:flex w-full items-center justify-between px-8">
                            <div className="flex space-x-8 pl-6">
                                <Link
                                    to={ROUTES.HOME}
                                    className={cn(
                                        "font-medium transition-colors",
                                        isActive(ROUTES.HOME)
                                            ? "text-primary"
                                            : "text-muted-foreground hover:text-primary"
                                    )}
                                >
                                    Home
                                </Link>
                                <Link
                                    to={ROUTES.LANGUAGES}
                                    className={cn(
                                        "font-medium transition-colors",
                                        isActive(ROUTES.LANGUAGES)
                                            ? "text-primary"
                                            : "text-muted-foreground hover:text-primary"
                                    )}
                                >
                                    Languages
                                </Link>
                                <Link
                                    to={ROUTES.TUTORS}
                                    className={cn(
                                        "font-medium transition-colors",
                                        isActive(ROUTES.TUTORS)
                                            ? "text-primary"
                                            : "text-muted-foreground hover:text-primary"
                                    )}
                                >
                                    Tutors
                                </Link>
                                <Link
                                    to={ROUTES.BECOME_TUTOR}
                                    className={cn(
                                        "font-medium transition-colors",
                                        isActive(ROUTES.BECOME_TUTOR)
                                            ? "text-primary"
                                            : "text-muted-foreground hover:text-primary"
                                    )}
                                >
                                    Become Tutor
                                </Link>
                            </div>

                            <div className="flex items-center space-x-6 pr-6">
                                <Link
                                    to={ROUTES.POLICY}
                                    className={cn(
                                        "hidden lg:block font-medium transition-colors opacity-70 hover:opacity-100",
                                        isActive(ROUTES.POLICY)
                                            ? "text-primary"
                                            : "text-muted-foreground hover:text-primary"
                                    )}
                                >
                                    Privacy & Terms
                                </Link>
                            </div>
                        </nav>
                    )}

                    {/* ===== Right Section ===== */}
                    <div className="flex items-center space-x-4">
                        {/* Wishlist */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (!isAuthenticated) {
                                    const redirectURL = encodeURIComponent(location.pathname);
                                    navigate(`${ROUTES.SIGN_IN}?redirect=${redirectURL}`);

                                    toast({
                                        variant: "destructive",
                                        title: "You are not logged in",
                                        description: "Please login to view your wishlist.",
                                    });
                                    return;
                                }
                                navigate(ROUTES.WISHLIST);

                            }}
                        >
                            <Heart className="w-5 h-5" />
                        </Button>

                        {/* Notifications */}
                        <DropdownMenu
                            open={isAuthenticated ? notificationsOpen : false}
                            onOpenChange={(open) => {
                                if (!isAuthenticated) {
                                    const redirectURL = encodeURIComponent(location.pathname);
                                    navigate(`${ROUTES.SIGN_IN}?redirect=${redirectURL}`);

                                    toast({
                                        variant: "destructive",
                                        title: "You are not logged in",
                                        description: "Please login to view notifications.",
                                    });
                                    return;
                                }
                                setNotificationsOpen(open);
                            }}
                        >
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative"
                                    onClick={() => {
                                        if (!isAuthenticated) {
                                            toast({
                                                variant: "destructive",
                                                title: "You are not logged in",
                                                description: "Please login to view notifications.",
                                            });
                                        }
                                    }}
                                >
                                    <Bell className="w-5 h-5" />
                                    {isAuthenticated && unreadCount > 0 && (
                                        <Badge 
                                            variant="destructive" 
                                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                                        >
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>

                            {isAuthenticated && (
                                <DropdownMenuContent align="end" className="w-80">
                                    <DropdownMenuLabel className="flex items-center justify-between">
                                        <span>Notifications</span>
                                        {unreadCount > 0 && (
                                            <Badge variant="secondary" className="ml-2">
                                                {unreadCount} new
                                            </Badge>
                                        )}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    
                                    {recentNotifications.length === 0 ? (
                                        <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                                            No notifications
                                        </div>
                                    ) : (
                                        <>
                                            <div className="max-h-[400px] overflow-y-auto">
                                                {recentNotifications.map((notification) => (
                                                    <DropdownMenuItem
                                                        key={notification.notificationId}
                                                        className={cn(
                                                            "flex flex-col items-start gap-1 p-3 cursor-pointer",
                                                            !notification.isRead && "bg-blue-50/50"
                                                        )}
                                                        onClick={async () => {
                                                            try {
                                                                // Mark as read nếu chưa đọc và đợi refetch
                                                                if (!notification.isRead) {
                                                                    await notificationApi.markAsRead(notification.notificationId);
                                                                    await refetch(); // Đợi refetch hoàn thành
                                                                }
                                                                
                                                                setNotificationsOpen(false);
                                                                
                                                                // Tutor không navigate, chỉ đánh dấu đã đọc
                                                                if (user?.role !== "Tutor" && notification.primaryActionUrl) {
                                                                    navigate(notification.primaryActionUrl);
                                                                }
                                                            } catch (error) {
                                                                console.error('Failed to mark notification as read:', error);
                                                                setNotificationsOpen(false);
                                                                // Vẫn navigate dù có lỗi (trừ Tutor)
                                                                if (user?.role !== "Tutor" && notification.primaryActionUrl) {
                                                                    navigate(notification.primaryActionUrl);
                                                                }
                                                            }
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
                                            
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="justify-center text-primary font-medium cursor-pointer"
                                                onClick={() => {
                                                    navigate(ROUTES.NOTIFICATIONS);
                                                    setNotificationsOpen(false);
                                                }}
                                            >
                                                All Notifications
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            )}
                        </DropdownMenu>
                        {/* ROLE BADGE */}
                        {isAuthenticated && user?.role === "Tutor" && (
                            <div className="px-3 py-1 text-sm font-semibold bg-purple-100 text-purple-700 rounded-full">
                                Tutor
                            </div>
                        )}
                        {/* Auth menu */}
                        {!isAuthenticated ? (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link to={ROUTES.SIGN_IN}>Sign In</Link>
                                </Button>
                                <Button asChild>
                                    <Link to={ROUTES.SIGN_UP}>Sign Up</Link>
                                </Button>
                            </>
                        ) : (

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-10 w-10 rounded-full p-0"
                                    >
                                        <Avatar>
                                            <AvatarImage src={user?.avatarURL} />
                                            <AvatarFallback className="bg-blue-600 text-white font-semibold">
                                                {getUserInitial(user?.fullName || "")}
                                            </AvatarFallback>
                                        </Avatar>

                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {user?.fullName}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                 {user?.email}
                                             </span>
                                        </div>
                                    </DropdownMenuLabel>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem asChild>
                                        <Link to={ROUTES.PROFILE}>
                                            <User className="mr-2 h-4 w-4" /> Profile
                                        </Link>
                                    </DropdownMenuItem>

                                    {user?.role === "Tutor" && (
                                        <DropdownMenuItem asChild>
                                            <Link to={ROUTES.TUTOR_DASHBOARD}>
                                                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    
                                    {user?.role === "Admin" && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link to="/admin/dashboard">
                                                    <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link to="/admin/refund-management">
                                                    <DollarSign className="mr-2 h-4 w-4" /> Refund Management
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link to={ROUTES.MY_ENROLLMENTS}>
                                                    <GraduationCap className="mr-2 h-4 w-4" /> My Progress
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    <DropdownMenuItem asChild>
                                        <Link to="/my-bookings" className="cursor-pointer">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            <span>My study schedule</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/messages">
                                            <MessageCircle className="mr-2 h-4 w-4" />Box Chat
                                        </Link>
                                    </DropdownMenuItem>
                                    {user?.role !== "Tutor" && (
                                        <DropdownMenuItem asChild>
                                            <Link to={ROUTES.REFUND_REQUESTS} className="cursor-pointer">
                                                <DollarSign className="mr-2 h-4 w-4" />
                                                <span>Request a refund</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem asChild>
                                        <Link to={ROUTES.PAYMENT_HISTORY}>
                                            <CreditCard className="mr-2 h-4 w-4" /> Payment History
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link to={ROUTES.CHANGE_PASSWORD}>
                                            <Lock className="mr-2 h-4 w-4" /> Change Password
                                        </Link>
                                    </DropdownMenuItem>

                                    {(user?.role === "Tutor" || user?.role === "Admin") && (
                                        <DropdownMenuItem asChild>
                                            <Link
                                                to={
                                                    user.role === "Tutor"
                                                        ? "/tutor/settings"
                                                        : "/settings"
                                                }
                                            >
                                                <Settings className="mr-2 h-4 w-4" /> Settings
                                            </Link>
                                        </DropdownMenuItem>
                                    )}

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" /> Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Mobile menu toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
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
                {!isTutorPage && mobileMenuOpen && (
                    <div className="md:hidden border-t bg-white shadow-md">
                        <nav className="flex flex-col p-4 space-y-2">
                            <Link to={ROUTES.HOME} onClick={() => setMobileMenuOpen(false)}>
                                Home
                            </Link>
                            <Link
                                to={ROUTES.LANGUAGES}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Languages
                            </Link>
                            <Link
                                to={ROUTES.TUTORS}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Tutors
                            </Link>
                            <Link
                                to={ROUTES.BECOME_TUTOR}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Become Tutor
                            </Link>
                            <Link
                                to={ROUTES.POLICY}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Privacy & Terms
                            </Link>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;

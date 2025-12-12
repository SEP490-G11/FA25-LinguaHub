import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Menu, X, User, LogOut, Settings, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/contexts/SidebarContext";
import { useToast } from "@/components/ui/use-toast";
import { ROUTES } from "@/constants/routes";

const AdminHeader = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { isOpen, toggle } = useSidebar();
    const [user] = useState({
        fullName: "Admin User",
        email: "admin@linguahub.com",
        avatarURL: "",
        role: "Admin" as const
    });

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");
        toast({
            title: "Đăng xuất thành công",
            description: "Hẹn gặp lại!",
        });
        navigate(ROUTES.SIGN_IN);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 h-16">
                {/* Left: Logo & Menu Toggle */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggle}
                        className="hover:bg-gray-100"
                    >
                        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>

                    <Link to={ROUTES.ADMIN_DASHBOARD} className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 rounded-lg">
                            <LayoutDashboard className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-xl font-bold">
                            Lingua<span className="text-purple-600">Hub</span>
                            <span className="ml-2 text-xs font-normal text-gray-500">Admin</span>
                        </div>
                    </Link>
                </div>

                {/* Right: User Menu */}
                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-3 hover:bg-gray-100">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatarURL} alt={user.fullName} />
                                    <AvatarFallback className="bg-purple-100 text-purple-600">
                                        {user.fullName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-left hidden md:block">
                                    <p className="text-sm font-medium">{user.fullName}</p>
                                    <p className="text-xs text-gray-500">{user.role}</p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span className="font-semibold">{user.fullName}</span>
                                    <span className="text-xs text-gray-500">{user.email}</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)}>
                                <User className="mr-2 h-4 w-4" />
                                Hồ sơ
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Cài đặt
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                <LogOut className="mr-2 h-4 w-4" />
                                Đăng xuất
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;

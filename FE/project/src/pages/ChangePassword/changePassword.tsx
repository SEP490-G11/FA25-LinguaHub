import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChangePasswordForm } from "./components/sections/change-password-form";
import { ChangePasswordHeader } from "./components/sections/change-password-header";
import { ROUTES } from "@/constants/routes";
import { useToast } from "@/components/ui/use-toast";

const ChangePassword = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const token =
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token");

        if (!token) {
            toast({
                variant: "destructive",
                title: "Bạn chưa đăng nhập",
                description: "Vui lòng đăng nhập để thay đổi mật khẩu.",
            });

            navigate(ROUTES.SIGN_IN);
        }
    }, [navigate, toast]);

    return (
        <div className="min-h-screen bg-gray-50">
            <ChangePasswordHeader />
            <div className="max-w-2xl mx-auto px-4 py-8">
                <ChangePasswordForm />
            </div>
        </div>
    );
};

export default ChangePassword;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileForm } from "./components/sections/profile-form";
import { ProfileHeader } from "./components/sections/profile-header";
import { ROUTES } from "@/constants/routes";
import { useToast } from "@/components/ui/use-toast";

const Profile = () => {
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
                description: "Vui lòng đăng nhập để truy cập hồ sơ của bạn.",
            });

            navigate(ROUTES.SIGN_IN);
        }
    }, [navigate, toast]);

    return (
        <div className="min-h-screen bg-gray-50">
            <ProfileHeader />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <ProfileForm />
            </div>
        </div>
    );
};

export default Profile;

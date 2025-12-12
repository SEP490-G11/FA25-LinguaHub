import { Languages } from "lucide-react";

const HeaderSkeleton = () => {
    return (
        <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
            <div className="w-full px-8 lg:px-16">
                <div className="flex justify-between items-center h-16 gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg flex-shrink-0">
                            <Languages className="w-6 h-6 text-white flex-shrink-0" />
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-foreground whitespace-nowrap flex-shrink-0">
                            Lingua<span className="text-primary">Hub</span>
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Right Section Skeleton */}
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                        {/* Skeleton for icons */}
                        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default HeaderSkeleton;

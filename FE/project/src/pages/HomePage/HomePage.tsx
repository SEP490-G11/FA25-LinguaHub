import { useState, useEffect } from "react";
import { useUserInfo } from "@/hooks/useUserInfo";
import HeroBanner from "./components/sections/hero-banner";
import OneOnOneAd from "./components/sections/one-on-one-ad";
import PopularLanguages from "./components/sections/popular-languages";
import CourseSection from "./components/sections/course-section";
import TopTutors from "./components/sections/top-tutors";
import BecomeTutorCTA from "./components/sections/become-tutor-cta";
import FloatingElements from "./components/sections/floating-elements";
import ContinueLearning from "./components/sections/continue-learning";
import RecommendedCourses from "./components/sections/recommended-courses";
import LearningActivity from "./components/sections/learning-activity";

export default function HomePage() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const { user, loading } = useUserInfo();
    useEffect(() => {
        const token =
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token");

        setIsAuthenticated(Boolean(token));
    }, []);
    if (isAuthenticated === null || loading) return null;
    if (isAuthenticated) {
        const isTutorOrAdmin =
            user?.role === "Tutor" || user?.role === "Admin";

        return (
            <>
                <HeroBanner />
                <ContinueLearning />
                <RecommendedCourses />
                <LearningActivity />
                <PopularLanguages />
                <TopTutors />
                {!isTutorOrAdmin && <BecomeTutorCTA />}
                <FloatingElements />
            </>
        );
    }
    return (
        <>
            <HeroBanner />
            <OneOnOneAd />
            <PopularLanguages />
            <CourseSection />
            <TopTutors />
            <BecomeTutorCTA />
            <FloatingElements />
        </>
    );
}

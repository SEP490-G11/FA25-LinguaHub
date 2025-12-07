package edu.lms.repository;

import edu.lms.entity.BookingPlan;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingPlanRepository extends JpaRepository<BookingPlan, Long> {
    
    /**
     * Tìm tất cả booking plan của một tutor
     */
    List<BookingPlan> findByTutorID(Long tutorID);

    /**
     * Tìm booking plan theo tutorID và title (thứ trong tuần)
     */
    List<BookingPlan> findByTutorIDAndTitle(Long tutorID, String title);

    /**
     * Kiểm tra xem có booking plan nào overlap với thời gian cho trước không
     * (cùng tutor, cùng title/ngày, và thời gian overlap)
     * Sử dụng pessimistic lock để tránh race condition
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT bp FROM BookingPlan bp
        WHERE bp.tutorID = :tutorID
          AND bp.title = :title
          AND bp.isActive = true
          AND (:excludeId IS NULL OR bp.bookingPlanID <> :excludeId)
          AND NOT (bp.endHours <= :startTime OR bp.startHours >= :endTime)
        """)
    List<BookingPlan> findOverlappingPlans(
            @Param("tutorID") Long tutorID,
            @Param("title") String title,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId
    );

    List<BookingPlan> findByTutorIDAndIsActiveTrueOrderByTitleAscStartHoursAsc(Long tutorID);

    /**
     * Đếm số ngày làm việc duy nhất (distinct titles) của tutor
     * Giới hạn tối đa 4 ngày/tuần
     * Sử dụng pessimistic lock để tránh race condition
     */
    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("""
        SELECT COUNT(DISTINCT bp.title) FROM BookingPlan bp
        WHERE bp.tutorID = :tutorID
          AND bp.isActive = true
        """)
    Long countDistinctDaysByTutorID(@Param("tutorID") Long tutorID);
}

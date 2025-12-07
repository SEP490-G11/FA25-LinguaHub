package edu.lms.repository;

import edu.lms.entity.BookingPlanSlot;
import edu.lms.entity.User;
import edu.lms.enums.SlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingPlanSlotRepository extends JpaRepository<BookingPlanSlot, Long> {

    boolean existsByBookingPlanID(Long bookingPlanID);

    boolean existsByTutorIDAndStartTimeAndEndTime(Long tutorID, LocalDateTime startTime, LocalDateTime endTime);

    List<BookingPlanSlot> findAllByPaymentID(Long paymentId);

    // Lấy slot mà learner đã book
    List<BookingPlanSlot> findByUserID(Long userId);

    // Lấy slot của tutor
    List<BookingPlanSlot> findByTutorID(Long tutorId);

    List<BookingPlanSlot> findAllByUserIDAndPaymentIDAndStatus(Long userId, Long paymentId, SlotStatus status);

    @Modifying
    @Query("""
        UPDATE BookingPlanSlot s
        SET s.paymentID = :paymentId
        WHERE s.userID = :userId
          AND s.tutorID = :tutorId
          AND s.status = 'Locked'
          AND s.paymentID IS NULL
    """)
    void updatePaymentForUserLockedSlots(
            @Param("userId") Long userId,
            @Param("tutorId") Long tutorId,
            @Param("paymentId") Long paymentId
    );

    @Query("""
        SELECT s FROM BookingPlanSlot s
        WHERE s.status = 'Locked'
          AND s.expiresAt < :now
    """)
    List<BookingPlanSlot> findAllExpiredSlots(@Param("now") LocalDateTime now);

    /**
     * Tìm tất cả slots của một tutor
     */
    List<BookingPlanSlot> findByTutorIDOrderByStartTimeAsc(Long tutorID);

    /**
     * Tìm slots của tutor theo booking plan
     */
    List<BookingPlanSlot> findByTutorIDAndBookingPlanIDOrderByStartTimeAsc(Long tutorID, Long bookingPlanID);

    /**
     * Tìm slots của tutor theo status
     */
    List<BookingPlanSlot> findByTutorIDAndStatusOrderByStartTimeAsc(Long tutorID, SlotStatus status);

    /**
     * Tìm slots của tutor trong khoảng thời gian
     */
    @Query("""
        SELECT s FROM BookingPlanSlot s
        WHERE s.tutorID = :tutorID
          AND s.startTime >= :startDate
          AND s.startTime < :endDate
        ORDER BY s.startTime ASC
    """)
    List<BookingPlanSlot> findByTutorIDAndDateRange(
            @Param("tutorID") Long tutorID,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * Tìm slots đã được book (có userID) của tutor
     */
    @Query("""
        SELECT s FROM BookingPlanSlot s
        WHERE s.tutorID = :tutorID
          AND s.userID IS NOT NULL
          AND s.status = 'Paid'
        ORDER BY s.startTime ASC
    """)
    List<BookingPlanSlot> findBookedSlotsByTutorID(@Param("tutorID") Long tutorID);

    /**
     * Tìm slots còn trống (chưa có user book) của tutor
     */
    @Query("""
        SELECT s FROM BookingPlanSlot s
        WHERE s.tutorID = :tutorID
          AND s.userID IS NULL
          AND s.status = 'Available'
        ORDER BY s.startTime ASC
    """)
    List<BookingPlanSlot> findAvailableSlotsByTutorID(@Param("tutorID") Long tutorID);

    /**
     * Tìm slots đã thanh toán (Paid) của learner với tutor
     */
    @Query("""
        SELECT s FROM BookingPlanSlot s
        WHERE s.userID = :userID
          AND s.tutorID = :tutorID
          AND s.status = 'Paid'
          AND s.paymentID IS NOT NULL
        ORDER BY s.startTime ASC
    """)
    List<BookingPlanSlot> findPaidSlotsByUserAndTutor(
            @Param("userID") Long userID,
            @Param("tutorID") Long tutorID
    );

    boolean existsByBookingPlanIDAndUserIDIsNotNull(Long bookingPlanID);

    long countByBookingPlanID(Long bookingPlanID);

    List<BookingPlanSlot> findByBookingPlanIDOrderByStartTimeAsc(Long bookingPlanID);

    void deleteByBookingPlanID(Long bookingPlanID);

    /**
     * Lấy danh sách User (distinct) đã booking slot (status = X) với tutor
     */
    @Query("""
        SELECT DISTINCT u
        FROM BookingPlanSlot s
        JOIN User u ON s.userID = u.userID
        WHERE s.tutorID = :tutorId
          AND s.userID IS NOT NULL
          AND s.status = :status
    """)
    List<User> findBookedUsersByTutor(
            @Param("tutorId") Long tutorId,
            @Param("status") SlotStatus status
    );
    List<BookingPlanSlot> findByTutorIDAndStatus(Long tutorId, SlotStatus status);

    // ==== thêm cho dashboard ====

    List<BookingPlanSlot> findTop5ByTutorIDAndStartTimeAfterAndStatusInOrderByStartTimeAsc(
            Long tutorID,
            LocalDateTime startTime,
            List<SlotStatus> statuses
    );
    List<BookingPlanSlot> findByStatusAndStartTimeBetweenAndReminderSentFalse(
            SlotStatus status,
            LocalDateTime from,
            LocalDateTime to
    );
}

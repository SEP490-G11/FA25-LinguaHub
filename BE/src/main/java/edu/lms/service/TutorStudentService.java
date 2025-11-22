package edu.lms.service;

import edu.lms.dto.response.TutorStudentSummaryResponse;
import edu.lms.entity.Tutor;
import edu.lms.entity.User;
import edu.lms.enums.SlotStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.BookingPlanSlotRepository;
import edu.lms.repository.TutorRepository;
import edu.lms.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TutorStudentService {

    BookingPlanSlotRepository bookingPlanSlotRepository;
    TutorRepository tutorRepository;
    UserRepository userRepository;

    // 1) GET LIST học viên của tutor (dùng cho /api/tutors/students)
    public List<TutorStudentSummaryResponse> getStudentsForTutorByTutorEmail(String email) {

        Tutor tutor = tutorRepository.findByUser_Email(email)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        Long tutorId = tutor.getTutorID();

        List<User> learners = bookingPlanSlotRepository
                .findBookedUsersByTutor(tutorId, SlotStatus.Paid);

        return learners.stream()
                .map(u -> {
                    Long totalBookedSlots =
                            bookingPlanSlotRepository.countByTutorIDAndUserIDAndStatus(
                                    tutorId,
                                    u.getUserID(),
                                    SlotStatus.Paid
                            );

                    LocalDateTime lastSlotTime =
                            bookingPlanSlotRepository.findLastSlotTimeByTutorAndUser(
                                    tutorId,
                                    u.getUserID(),
                                    SlotStatus.Paid
                            );

                    return TutorStudentSummaryResponse.builder()
                            .userId(u.getUserID())
                            .fullName(u.getFullName())
                            .email(u.getEmail())
                            .avatarUrl(u.getAvatarURL())
                            .country(u.getCountry())
                            .phone(u.getPhone())
                            .totalBookedSlots(totalBookedSlots)
                            .lastSlotTime(lastSlotTime)
                            .build();
                })
                .toList();
    }

    // 2) GET DETAIL 1 học viên (dùng cho /api/tutors/students/{studentUserId})
    public User getStudentDetailForTutor(String tutorEmail, Long studentUserId) {

        Tutor tutor = tutorRepository.findByUser_Email(tutorEmail)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        Long tutorId = tutor.getTutorID();

        // chỉ cho xem nếu student này đã Paid với tutor
        Long count = bookingPlanSlotRepository
                .countByTutorIDAndUserIDAndStatus(tutorId, studentUserId, SlotStatus.Paid);

        if (count == 0) {
            throw new AppException(ErrorCode.UNAUTHORIZED); // đổi code nếu bạn muốn
        }

        return userRepository.findById(studentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
    }
}


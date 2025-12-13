package edu.lms.service;

import edu.lms.entity.RefundRequest;
import edu.lms.enums.RefundStatus;
import edu.lms.repository.RefundRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefundAutoMarkService {

    private final RefundRequestRepository refundRepo;

    // Chạy mỗi giờ: tự động đánh dấu những refund PENDING mà tutor chưa phản hồi > 1 ngày
    @Scheduled(cron = "0 0 * * * *") // mỗi giờ phút 00
    @Transactional
    public void autoMarkTutorAbsentAfter1Day() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(1);

        List<RefundRequest> list = refundRepo
                .findByStatusAndTutorAttendIsNullAndCreatedAtBefore(
                        RefundStatus.PENDING,
                        threshold
                );

        for (RefundRequest r : list) {
            r.setTutorAttend(false); // coi như không tham gia / chấp nhận refund
            r.setTutorRespondedAt(LocalDateTime.now());
        }

        if (!list.isEmpty()) {
            refundRepo.saveAll(list);
            log.info("[REFUND AUTO] Marked {} refunds as tutorAttend = false (timeout > 1 day)", list.size());
        }
    }
}

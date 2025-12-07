package edu.lms.service;

import edu.lms.dto.response.WithdrawResponse;
import edu.lms.entity.Tutor;
import edu.lms.entity.WithdrawMoney;
import edu.lms.enums.WithdrawStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.TutorRepository;
import edu.lms.repository.WithdrawRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminWithdrawService {

    WithdrawRepository withdrawRepository;
    TutorRepository tutorRepository;

    private WithdrawResponse toResponse(WithdrawMoney w) {
        return WithdrawResponse.builder()
                .withdrawId(w.getWithdrawId())
                .tutorId(w.getTutor().getTutorID())
                .totalAmount(w.getTotalAmount())
                .withdrawAmount(w.getWithdrawAmount())
                .bankAccountNumber(w.getBankAccountNumber())
                .bankName(w.getBankName())
                .bankOwnerName(w.getBankOwnerName())
                .status(w.getStatus())
                .createdAt(w.getCreatedAt())
                .build();
    }

    public WithdrawResponse approve(Long id) {

        WithdrawMoney withdraw = withdrawRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        if (withdraw.getStatus() != WithdrawStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_STATUS);
        }

        Tutor tutor = withdraw.getTutor();

        // kiểm tra số dư ví
        if (tutor.getWalletBalance().compareTo(withdraw.getWithdrawAmount()) < 0) {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        }

        tutor.setWalletBalance(
                tutor.getWalletBalance().subtract(withdraw.getWithdrawAmount())
        );

        withdraw.setStatus(WithdrawStatus.APPROVED);

        tutorRepository.save(tutor);
        withdrawRepository.save(withdraw);

        return toResponse(withdraw);
    }

    public WithdrawResponse reject(Long id) {
        WithdrawMoney withdraw = withdrawRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        withdraw.setStatus(WithdrawStatus.REJECTED);

        return toResponse(withdrawRepository.save(withdraw));
    }

    public List<WithdrawResponse> getAll() {
        return withdrawRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<WithdrawResponse> getByStatus(WithdrawStatus status) {
        return withdrawRepository.findByStatus(status)
                .stream()
                .map(this::toResponse)
                .toList();
    }
}

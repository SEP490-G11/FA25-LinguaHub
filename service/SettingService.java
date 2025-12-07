package edu.lms.service;

import edu.lms.dto.request.SettingRequest;
import edu.lms.dto.response.SettingResponse;
import edu.lms.entity.Setting;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.SettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class SettingService {

    SettingRepository settingRepository;

    public SettingResponse getSetting() {
        Setting setting = settingRepository.getCurrentSetting();
        return toResponse(setting);
    }

    public SettingResponse updateSetting(SettingRequest request) {

        Setting setting = settingRepository.getCurrentSetting();
        if (setting == null) {
            throw new AppException(ErrorCode.NOT_FOUND);
        }

        setting.setCommissionCourse(request.getCommissionCourse());
        setting.setCommissionBooking(request.getCommissionBooking());

        settingRepository.save(setting);

        return toResponse(setting);
    }

    private SettingResponse toResponse(Setting setting) {
        return SettingResponse.builder()
                .id(setting.getId())
                .commissionCourse(setting.getCommissionCourse())
                .commissionBooking(setting.getCommissionBooking())
                .build();
    }
}

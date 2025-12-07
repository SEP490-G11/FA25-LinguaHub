package edu.lms.controller;

import edu.lms.dto.request.SettingRequest;
import edu.lms.dto.response.SettingResponse;
import edu.lms.service.SettingService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/admin/setting")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class SettingController {

    SettingService settingService;

    // Admin xem commission hiện tại
    @GetMapping
    public SettingResponse getSetting() {
        return settingService.getSetting();
    }

    // Admin cập nhật commission
    @PutMapping
    public SettingResponse updateSetting(@RequestBody SettingRequest request) {
        return settingService.updateSetting(request);
    }
}

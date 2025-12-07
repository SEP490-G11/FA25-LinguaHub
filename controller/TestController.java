package edu.lms.controller;

import edu.lms.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor //Tự động tạo constructor để inject EmailService
public class TestController {

    private final EmailService emailService; //Inject EmailService

    @GetMapping
    public ResponseEntity<String> hello() {
        return ResponseEntity.ok("Backend Connected Successfully!");
    }

    @GetMapping("/email")
    public String testEmail() {
        emailService.sendOtp("your_target_email@gmail.com", "123456");
        return "Email sent successfully!";
    }
}

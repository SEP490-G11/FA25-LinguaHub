package edu.lms.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        Map<String, Object> map = new HashMap<>();
        map.put("auth", authentication);
        map.put("name", authentication != null ? authentication.getName() : null);
        map.put("principal", authentication != null ? authentication.getPrincipal() : null);
        map.put("authorities", authentication != null ? authentication.getAuthorities() : null);
        return map;
    }
}

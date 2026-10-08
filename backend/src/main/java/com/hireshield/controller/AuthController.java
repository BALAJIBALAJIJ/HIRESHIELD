package com.hireshield.controller;

import com.hireshield.dto.*;
import com.hireshield.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/hiring-team")
    public ResponseEntity<ApiResponse> registerHiringTeam(@Valid @RequestBody HiringTeamRegisterRequest request) {
        AuthResponse response = authService.registerHiringTeam(request);
        return ResponseEntity.ok(ApiResponse.success("Hiring team registration successful", response));
    }

    @PostMapping("/register/applicant")
    public ResponseEntity<ApiResponse> registerApplicant(@Valid @RequestBody ApplicantRegisterRequest request) {
        AuthResponse response = authService.registerApplicant(request);
        return ResponseEntity.ok(ApiResponse.success("Applicant registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse> getCurrentUser(@RequestAttribute("email") String email) {
        // This will be populated via the security context
        return ResponseEntity.ok(ApiResponse.success("User retrieved"));
    }
}

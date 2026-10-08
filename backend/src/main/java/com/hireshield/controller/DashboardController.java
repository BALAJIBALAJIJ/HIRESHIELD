package com.hireshield.controller;

import com.hireshield.dto.ApiResponse;
import com.hireshield.model.User;
import com.hireshield.service.AuthService;
import com.hireshield.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthService authService;

    public DashboardController(DashboardService dashboardService, AuthService authService) {
        this.dashboardService = dashboardService;
        this.authService = authService;
    }

    @GetMapping("/hiring-team")
    public ResponseEntity<ApiResponse> getHiringTeamDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        Map<String, Object> dashboard = dashboardService.getHiringTeamDashboard(user.getOrganizationId());
        return ResponseEntity.ok(ApiResponse.success("Dashboard data retrieved", dashboard));
    }

    @GetMapping("/applicant")
    public ResponseEntity<ApiResponse> getApplicantDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        Map<String, Object> dashboard = dashboardService.getApplicantDashboard(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Dashboard data retrieved", dashboard));
    }
}

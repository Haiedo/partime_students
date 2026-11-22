package com.gr7.backend.controller;

import com.gr7.backend.dto.AvailabilityDto;
import com.gr7.backend.dto.JobSummary;
import com.gr7.backend.dto.PageResponse;
import com.gr7.backend.entity.SalaryUnit;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.MatchedJobService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/students/me")
public class MatchedJobController {

    private final MatchedJobService service;

    public MatchedJobController(MatchedJobService service) {
        this.service = service;
    }

    @GetMapping("/availability")
    public AvailabilityDto getAvailability(@AuthenticationPrincipal Jwt jwt) {
        return service.getAvailability(CurrentUser.id(jwt));
    }

    @PutMapping("/availability")
    public AvailabilityDto updateAvailability(@AuthenticationPrincipal Jwt jwt, @RequestBody AvailabilityDto req) {
        return service.updateAvailability(CurrentUser.id(jwt), req.availableSlots());
    }

    @GetMapping("/matched-jobs")
    public PageResponse<JobSummary> matchedJobs(@AuthenticationPrincipal Jwt jwt,
                                                @RequestParam(required = false) String category,
                                                @RequestParam(required = false) String location,
                                                @RequestParam(required = false) BigDecimal minSalary,
                                                @RequestParam(required = false) SalaryUnit salaryUnit,
                                                @RequestParam(defaultValue = "newest") String sort,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        return service.matchedJobs(CurrentUser.id(jwt), category, location, minSalary, salaryUnit, sort, page, size);
    }
}
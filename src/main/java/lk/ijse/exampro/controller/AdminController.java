package lk.ijse.exampro.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/v1/admin")
@CrossOrigin(origins = "http://localhost:63342")
public class AdminController {

    // Only ADMIN can access
    @GetMapping("/admin-only")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminAccess() {
        return "Admin access granted!";
    }

    // Only TEACHER can access
    @GetMapping("/teacher-only")
    @PreAuthorize("hasRole('TEACHER')")
    public String teacherAccess() {
        return "Teacher access granted!";
    }

    // Only STUDENT can access
    @GetMapping("/student-only")
    @PreAuthorize("hasRole('STUDENT')")
    public String studentAccess() {
        return "Student access granted!";
    }

    // Both TEACHER and ADMIN can access
    @GetMapping("/teacher-admin")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String teacherAdminAccess() {
        return "Both TEACHER and ADMIN can access this!";
    }

    // Everyone (ADMIN, TEACHER, STUDENT) can access
    @GetMapping("/all-users")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public String allUsersAccess() {
        return "Everyone can access this!";
    }
}

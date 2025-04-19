package lk.ijse.exampro.controller;

import lk.ijse.exampro.dto.ResponseDTO;
import lk.ijse.exampro.dto.UserDTO;
import lk.ijse.exampro.service.impl.UserServiceImpl;
import lk.ijse.exampro.util.VarList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("api/v1/admin")
@CrossOrigin(origins = "http://localhost:63342")
public class AdminController {

    @Autowired
    private UserServiceImpl userService;

    @GetMapping("/admin-only")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminAccess() {
        return "Admin access granted!";
    }

    @GetMapping("/teacher-only")
    @PreAuthorize("hasRole('TEACHER')")
    public String teacherAccess() {
        return "Teacher access granted!";
    }

    @GetMapping("/student-only")
    @PreAuthorize("hasRole('STUDENT')")
    public String studentAccess() {
        return "Student access granted!";
    }

    @GetMapping("/teacher-admin")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String teacherAdminAccess() {
        return "Both TEACHER and ADMIN can access this!";
    }

    @GetMapping("/all-users")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public String allUsersAccess() {
        return "Everyone can access this!";
    }

}
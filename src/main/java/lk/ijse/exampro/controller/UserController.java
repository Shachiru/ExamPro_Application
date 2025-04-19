package lk.ijse.exampro.controller;

import jakarta.validation.Valid;
import lk.ijse.exampro.dto.AuthDTO;
import lk.ijse.exampro.dto.ResponseDTO;
import lk.ijse.exampro.dto.UserDTO;
import lk.ijse.exampro.repository.UserRepository;
import lk.ijse.exampro.service.UserService;
import lk.ijse.exampro.util.JwtUtil;
import lk.ijse.exampro.util.VarList;
import lk.ijse.exampro.util.enums.UserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/v1/user")
@CrossOrigin(origins = {"http://localhost:63342", "http://localhost:3000"})
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    public UserController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/profile")
    public ResponseEntity<ResponseDTO> getUserProfile(Authentication authentication) {
        String email = authentication.getName();
        UserDTO userDTO = userService.searchUser(email);
        if (userDTO == null) {
            return new ResponseEntity<>(new ResponseDTO(
                    404, "User not found", null),
                    HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(new ResponseDTO(
                200, "User profile retrieved successfully", userDTO),
                HttpStatus.OK);
    }

    @PostMapping(value = "/sign_up/admin")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> registerAdmin(@RequestBody @Valid UserDTO userDTO) {
        try {
            if (userDTO.getRole() != UserRole.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ResponseDTO(
                        VarList.FORBIDDEN, "Only admins can be registered by super admins", null));
            }
            int res = userService.saveUser(userDTO);
            switch (res) {
                case VarList.CREATED:
                    String token = jwtUtil.generateToken(userDTO);
                    AuthDTO authDTO = new AuthDTO();
                    authDTO.setEmail(userDTO.getEmail());
                    authDTO.setToken(token);
                    authDTO.setRole(String.valueOf(userDTO.getRole()));
                    return ResponseEntity.status(HttpStatus.CREATED).body(
                            new ResponseDTO(VarList.CREATED, "Admin registered successfully by super admin", authDTO));
                case VarList.NOT_ACCEPTABLE:
                    return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE).body(
                            new ResponseDTO(VarList.NOT_ACCEPTABLE, "Email already used", null));
                default:
                    return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(
                            new ResponseDTO(VarList.BAD_GATEWAY, "Error during registration", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PostMapping(value = "/sign_up/teacher")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> registerTeacher(@RequestBody @Valid UserDTO userDTO) {
        try {
            if (userDTO.getRole() != UserRole.TEACHER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        new ResponseDTO(VarList.FORBIDDEN, "Only teachers can be registered by admins or super admins", null));
            }
            int res = userService.saveUser(userDTO);
            switch (res) {
                case VarList.CREATED:
                    String token = jwtUtil.generateToken(userDTO);
                    AuthDTO authDTO = new AuthDTO();
                    authDTO.setEmail(userDTO.getEmail());
                    authDTO.setToken(token);
                    authDTO.setRole(String.valueOf(userDTO.getRole()));
                    boolean isSuperAdmin = SecurityContextHolder.getContext().getAuthentication()
                            .getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
                    String registeredBy = isSuperAdmin ? "super admin" : "admin";
                    return ResponseEntity.status(HttpStatus.CREATED).body(
                            new ResponseDTO(VarList.CREATED, "Teacher registered successfully by " + registeredBy, authDTO));
                case VarList.NOT_ACCEPTABLE:
                    return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE).body(
                            new ResponseDTO(VarList.NOT_ACCEPTABLE, "Email already used", null));
                case VarList.BAD_REQUEST:
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                            new ResponseDTO(VarList.BAD_REQUEST, "Invalid input data", null));
                default:
                    return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(
                            new ResponseDTO(VarList.BAD_GATEWAY, "Error during registration", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PostMapping("/sign_up/student")
    public ResponseEntity<ResponseDTO> registerStudent(
            @RequestPart("userDTO") UserDTO userDTO,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {
        try {
            userDTO.setRole(UserRole.STUDENT);

            // Validate password and confirm password
            if (!userDTO.getPassword().equals(userDTO.getConfirmPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        new ResponseDTO(VarList.BAD_REQUEST, "Passwords do not match", null));
            }

            UserDTO createdUser = userService.createUserWithProfileImage(userDTO, profileImage);

            String token = jwtUtil.generateToken(createdUser);

            // Create response data
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("token", token);
            responseData.put("role", createdUser.getRole());
            responseData.put("email", createdUser.getEmail());

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    new ResponseDTO(VarList.CREATED, "Student registered successfully", responseData));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new ResponseDTO(VarList.BAD_REQUEST, e.getMessage(), null));
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> getAllUsers() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String roleString = authentication.getAuthorities().stream().findFirst().orElseThrow(() ->
                    new IllegalStateException("No authorities found")).getAuthority();
            UserRole authenticatedRole = UserRole.valueOf(roleString.replace("ROLE_", ""));
            List<UserDTO> users = userService.getAllUsers(authenticatedRole);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Users retrieved successfully", users));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @GetMapping("/admins")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> getAllAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        try {
            List<UserDTO> admins = userService.getAllAdmins(page, size, status, search);
            long totalElements = userService.countAllAdmins(status, search);
            int totalPages = (int) Math.ceil((double) totalElements / size);

            PageResponse pageResponse = new PageResponse(admins, page, size, totalElements, totalPages);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Admins retrieved successfully", pageResponse));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @GetMapping("/teachers")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> getAllTeachers(@RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "10") int size,
                                                      @RequestParam(required = false) String status,
                                                      @RequestParam(required = false) String search) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String roleString = authentication.getAuthorities().stream().findFirst().orElseThrow(() ->
                    new IllegalStateException("No authorities found")).getAuthority();
            UserRole authenticatedRole = UserRole.valueOf(roleString.replace("ROLE_", ""));
            List<UserDTO> teachers;
            long totalElements;
            int totalPages;

            if (authenticatedRole == UserRole.SUPER_ADMIN) {
                teachers = userService.getAllTeachers(page, size, status, search);
                totalElements = userService.countAllTeachers(status, search);
                totalPages = (int) Math.ceil((double) totalElements / size);
            } else {
                // Admin can only see teachers from their institution
                UserDTO admin = userService.searchUser(authentication.getName());
                if (admin == null || admin.getRole() != UserRole.ADMIN) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                            new ResponseDTO(VarList.FORBIDDEN, "Admin access required", null));
                }
                teachers = userService.getTeachersForInstitution(admin.getSchoolName(), page, size, status, search);
                totalElements = userService.countTeachersForInstitution(admin.getSchoolName(), status, search);
                totalPages = (int) Math.ceil((double) totalElements / size);
            }

            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Teachers retrieved successfully",
                    new PageResponse(teachers, page, size, totalElements, totalPages)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @DeleteMapping("/delete/{email}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> deleteUser(@PathVariable String email) {
        try {
            UserDTO user = userService.searchUser(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        new ResponseDTO(VarList.NOT_FOUND, "User not found", null));
            }
            if (user.getRole() == UserRole.SUPER_ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        new ResponseDTO(VarList.FORBIDDEN, "Cannot delete a Super Admin", null));
            }
            int res = userService.deleteUser(email);
            if (res == VarList.OK) {
                return ResponseEntity.ok(new ResponseDTO(VarList.OK, "User deleted successfully", null));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        new ResponseDTO(VarList.NOT_FOUND, "User not found", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PutMapping("/update")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN') or authentication.name == #userDTO.email")
    public ResponseEntity<ResponseDTO> updateUserProfile(@RequestBody @Valid UserDTO userDTO) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String authenticatedEmail = authentication.getName();
            boolean isSuperAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            if (!isSuperAdmin && !isAdmin && !authenticatedEmail.equals(userDTO.getEmail())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        new ResponseDTO(VarList.FORBIDDEN, "You can only update your own profile", null));
            }

            if (isAdmin) {
                UserDTO targetUser = userService.searchUser(userDTO.getEmail());
                if (targetUser == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                            new ResponseDTO(VarList.NOT_FOUND, "User not found", null));
                }
                UserDTO admin = userService.searchUser(authenticatedEmail);
                if (!admin.getSchoolName().equals(targetUser.getSchoolName()) || targetUser.getRole() != UserRole.TEACHER) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                            new ResponseDTO(VarList.FORBIDDEN, "Admins can only update teachers from their institution", null));
                }
            }

            int res = userService.updateUserProfile(userDTO.getEmail(), userDTO);
            switch (res) {
                case VarList.OK:
                    UserDTO updatedUser = userService.searchUser(userDTO.getEmail());
                    return ResponseEntity.status(HttpStatus.OK).body(
                            new ResponseDTO(VarList.OK, "Profile updated successfully", updatedUser));
                case VarList.NOT_FOUND:
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                            new ResponseDTO(VarList.NOT_FOUND, "User not found", null));
                case VarList.UNAUTHORIZED:
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                            new ResponseDTO(VarList.UNAUTHORIZED, "Incorrect old password", null));
                default:
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                            new ResponseDTO(VarList.BAD_REQUEST, "Failed to update profile", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PutMapping("/deactivate/{email}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> deactivateUserBySuperAdmin(@PathVariable String email) {
        try {
            UserDTO user = userService.searchUser(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        new ResponseDTO(VarList.NOT_FOUND, "User not found", null));
            }
            if (user.getRole() == UserRole.SUPER_ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        new ResponseDTO(VarList.FORBIDDEN, "Cannot deactivate another Super Admin", null));
            }
            int res = userService.deactivateUser(email);
            if (res == VarList.OK) {
                return ResponseEntity.ok(new ResponseDTO(VarList.OK, "User deactivated successfully by Super Admin", null));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        new ResponseDTO(VarList.NOT_FOUND, "User not found", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PutMapping("/activate/{email}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> activateUserBySuperAdmin(@PathVariable String email) {
        try {
            UserDTO user = userService.searchUser(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        new ResponseDTO(VarList.NOT_FOUND, "User not found", null));
            }
            if (user.getRole() == UserRole.SUPER_ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        new ResponseDTO(VarList.FORBIDDEN, "Cannot activate a Super Admin", null));
            }
            int res = userService.activateUser(email);
            if (res == VarList.OK) {
                return ResponseEntity.ok(new ResponseDTO(VarList.OK, "User activated successfully by Super Admin", null));
            } else if (res == VarList.NOT_FOUND) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        new ResponseDTO(VarList.NOT_FOUND, "User not found", null));
            } else if (res == VarList.CONFLICT) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(
                        new ResponseDTO(VarList.CONFLICT, "User is already active", null));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                        new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, "Failed to activate user", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PostMapping("/profile-picture")
    @PreAuthorize("authentication.name == #email")
    public ResponseEntity<ResponseDTO> uploadProfilePicture(
            @RequestParam String email,
            @RequestParam("file") MultipartFile file) {
        try {
            UserDTO updatedUser = userService.uploadProfilePicture(email, file);
            return ResponseEntity.status(HttpStatus.OK).body(
                    new ResponseDTO(VarList.OK, "Profile picture uploaded successfully", updatedUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    new ResponseDTO(VarList.NOT_FOUND, e.getMessage(), null));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new ResponseDTO(VarList.BAD_REQUEST, "Failed to upload profile picture: " + e.getMessage(), null));
        }
    }

    @DeleteMapping("/profile-picture")
    @PreAuthorize("authentication.name == #email")
    public ResponseEntity<ResponseDTO> deleteProfilePicture(@RequestParam String email) {
        try {
            UserDTO updatedUser = userService.deleteProfilePicture(email);
            return ResponseEntity.status(HttpStatus.OK).body(
                    new ResponseDTO(VarList.OK, "Profile picture deleted successfully", updatedUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    new ResponseDTO(VarList.NOT_FOUND, e.getMessage(), null));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new ResponseDTO(VarList.BAD_REQUEST, "Failed to delete profile picture: " + e.getMessage(), null));
        }
    }

    @DeleteMapping("/teachers/{email}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> deleteTeacher(@PathVariable String email) {
        try {
            UserDTO user = userService.searchUser(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        new ResponseDTO(VarList.NOT_FOUND, "Teacher not found", null));
            }
            if (user.getRole() != UserRole.TEACHER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        new ResponseDTO(VarList.FORBIDDEN, "Only teachers can be deleted", null));
            }
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (isAdmin) {
                UserDTO admin = userService.searchUser(authentication.getName());
                if (!admin.getSchoolName().equals(user.getSchoolName())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                            new ResponseDTO(VarList.FORBIDDEN, "Cannot delete teacher from another institution", null));
                }
            }
            int res = userService.deleteUser(email);
            if (res == VarList.OK) {
                return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Teacher deleted successfully", null));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    new ResponseDTO(VarList.NOT_FOUND, "Teacher not found", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    // Helper class for paginated response
    private static class PageResponse {
        private final List<UserDTO> content;
        private final int number;
        private final int size;
        private final long totalElements;
        private final int totalPages;

        public PageResponse(List<UserDTO> content, int number, int size, long totalElements, int totalPages) {
            this.content = content;
            this.number = number;
            this.size = size;
            this.totalElements = totalElements;
            this.totalPages = totalPages;
        }

        public List<UserDTO> getContent() {
            return content;
        }

        public int getNumber() {
            return number;
        }

        public int getSize() {
            return size;
        }

        public long getTotalElements() {
            return totalElements;
        }

        public int getTotalPages() {
            return totalPages;
        }
    }
}
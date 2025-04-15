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
import java.util.List;

@RestController
@RequestMapping("api/v1/user")
@CrossOrigin(origins = "http://localhost:63342")
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO> registerTeacher(@RequestBody @Valid UserDTO userDTO) {
        try {
            if (userDTO.getRole() != UserRole.TEACHER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        new ResponseDTO(VarList.FORBIDDEN, "Only teachers can be registered by admins", null));
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
                            new ResponseDTO(VarList.CREATED, "Teacher registered successfully by admin", authDTO));
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

    @PostMapping(value = "/sign_up/student")
    public ResponseEntity<ResponseDTO> registerStudent(@RequestBody @Valid UserDTO userDTO) {
        try {
            if (userDTO.getRole() == null) {
                userDTO.setRole(UserRole.STUDENT);
            }
            if (userDTO.getRole() != UserRole.STUDENT) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        new ResponseDTO(VarList.FORBIDDEN, "Only students can register themselves", null));
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
                            new ResponseDTO(VarList.CREATED, "Student registered successfully", authDTO));
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
    public ResponseEntity<ResponseDTO> getAllAdmins() {
        try {
            List<UserDTO> admins = userService.getAllAdmins();
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Admins retrieved successfully", admins));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @DeleteMapping("/delete/{email}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> deleteAdmin(@PathVariable String email) {
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
                return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Admin deleted successfully", null));
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
    @PreAuthorize("authentication.name == #email")
    public ResponseEntity<ResponseDTO> updateUserProfile(@RequestParam String email, @RequestBody @Valid UserDTO userDTO) {
        try {
            int res = userService.updateUserProfile(email, userDTO);
            switch (res) {
                case VarList.OK:
                    UserDTO updatedUser = userService.searchUser(email);
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
}
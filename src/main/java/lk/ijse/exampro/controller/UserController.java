package lk.ijse.exampro.controller;

import jakarta.validation.Valid;
import lk.ijse.exampro.dto.AuthDTO;
import lk.ijse.exampro.dto.ResponseDTO;
import lk.ijse.exampro.dto.UserDTO;
import lk.ijse.exampro.repository.UserRepository;
import lk.ijse.exampro.service.UserService;
import lk.ijse.exampro.util.JwtUtil;
import lk.ijse.exampro.util.VarList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping(value = "/sign_up")
    public ResponseEntity<ResponseDTO> registerUser(@RequestBody @Valid UserDTO userDTO) {
        try {
            int res = userService.saveUser(userDTO);

            switch (res) {
                case VarList.CREATED -> {
                    String token = jwtUtil.generateToken(userDTO);
                    AuthDTO authDTO = new AuthDTO();
                    authDTO.setEmail(userDTO.getEmail());
                    authDTO.setToken(token);
                    authDTO.setRole(String.valueOf(userDTO.getRole()));

                    return ResponseEntity.status(HttpStatus.CREATED)
                            .body(new ResponseDTO(VarList.CREATED, "User registered successfully", authDTO));
                }
                case VarList.NOT_ACCEPTABLE -> {
                    return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE)
                            .body(new ResponseDTO(VarList.NOT_ACCEPTABLE, "Email already used", null));
                }
                default -> {
                    return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                            .body(new ResponseDTO(VarList.BAD_GATEWAY, "Error during registration", null));
                }
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO> getAllUsers() {
        try {
            List<UserDTO> users = userService.getAllUsers(); // Add this method to UserService
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Users retrieved successfully", users));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @DeleteMapping("/delete/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO> deleteUserByEmail(@PathVariable String email) {
        try {
            int res = userService.deleteUserByEmail(email);
            if (res == VarList.OK) {
                return ResponseEntity.status(HttpStatus.OK)
                        .body(new ResponseDTO(VarList.OK, "User deleted successfully", null));
            } else if (res == VarList.NOT_FOUND) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ResponseDTO(VarList.NOT_FOUND, "User not found", null));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.BAD_REQUEST, "Failed to delete user", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PutMapping("/update")
    @PreAuthorize("authentication.name == #email") // Use 'name' instead of 'principal' if needed
    public ResponseEntity<ResponseDTO> updateUserProfile(@RequestParam String email, @RequestBody @Valid UserDTO userDTO) {
        try {
            int res = userService.updateUserProfile(email, userDTO);

            switch (res) {
                case VarList.OK:
                    return ResponseEntity.status(HttpStatus.OK)
                            .body(new ResponseDTO(VarList.OK, "Profile updated successfully", null));
                case VarList.NOT_FOUND:
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(new ResponseDTO(VarList.NOT_FOUND, "User not found", null));
                default:
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(new ResponseDTO(VarList.BAD_REQUEST, "Failed to update profile", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }
}

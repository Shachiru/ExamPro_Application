package lk.ijse.exampro.controller;

import lk.ijse.exampro.dto.AuthDTO;
import lk.ijse.exampro.dto.ResponseDTO;
import lk.ijse.exampro.dto.UserDTO;
import lk.ijse.exampro.service.impl.UserServiceImpl;
import lk.ijse.exampro.util.JwtUtil;
import lk.ijse.exampro.util.VarList;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/auth")
@CrossOrigin(origins = "http://localhost:63342")
public class AuthController {

    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserServiceImpl userService;
    private final ResponseDTO responseDTO;

    public AuthController(JwtUtil jwtUtil, AuthenticationManager authenticationManager, UserServiceImpl userService, ResponseDTO responseDTO) {
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.responseDTO = responseDTO;
    }

    @PostMapping("/sign_in/admin")
    public ResponseEntity<ResponseDTO> authenticateAdmin(@RequestBody UserDTO userDTO) {
        return authenticateByRole(userDTO, "ADMIN");
    }

    @PostMapping("/sign_in/teacher")
    public ResponseEntity<ResponseDTO> authenticateTeacher(@RequestBody UserDTO userDTO) {
        return authenticateByRole(userDTO, "TEACHER");
    }

    @PostMapping("/sign_in/student")
    public ResponseEntity<ResponseDTO> authenticateStudent(@RequestBody UserDTO userDTO) {
        return authenticateByRole(userDTO, "STUDENT");
    }

    private ResponseEntity<ResponseDTO> authenticateByRole(UserDTO userDTO, String expectedRole) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(userDTO.getEmail(), userDTO.getPassword()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ResponseDTO(VarList.UNAUTHORIZED, "Invalid Credentials", e.getMessage()));
        }

        UserDTO loadedUser = userService.loadUserDetailsByUsername(userDTO.getEmail());
        if (loadedUser == null || !loadedUser.getRole().equalsIgnoreCase(expectedRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ResponseDTO(VarList.FORBIDDEN, "Access Denied! Incorrect Role", null));
        }

        String token = jwtUtil.generateToken(loadedUser);
        AuthDTO authDTO = new AuthDTO();
        authDTO.setEmail(loadedUser.getEmail());
        authDTO.setToken(token);

        return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Login Successful", authDTO));
    }
}

package lk.ijse.exampro.controller;

import jakarta.annotation.PostConstruct;
import lk.ijse.exampro.dto.AuthDTO;
import lk.ijse.exampro.dto.LoginRequestDTO;
import lk.ijse.exampro.dto.ResponseDTO;
import lk.ijse.exampro.dto.UserDTO;
import lk.ijse.exampro.repository.UserRepository;
import lk.ijse.exampro.service.impl.UserServiceImpl;
import lk.ijse.exampro.util.JwtUtil;
import lk.ijse.exampro.util.VarList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/auth")
@CrossOrigin(origins = "http://localhost:63342")
public class AuthController {

    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserServiceImpl userService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public AuthController(JwtUtil jwtUtil, AuthenticationManager authenticationManager, UserServiceImpl userService, ResponseDTO responseDTO) {
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userService = userService;
    }

    @PostMapping("/sign_in")
    public ResponseEntity<ResponseDTO> authenticateUser(@RequestBody LoginRequestDTO loginRequestDTO) {
        System.out.println("Attempting login for: " + loginRequestDTO.getEmail());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequestDTO.getEmail(), loginRequestDTO.getPassword())
            );
        } catch (Exception e) {
            System.out.println("Authentication failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ResponseDTO(VarList.UNAUTHORIZED, "Invalid Credentials", null));
        }

        UserDTO loadedUser = userService.searchUser(loginRequestDTO.getEmail());
        if (loadedUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseDTO(VarList.NOT_FOUND, "User not found", null));
        }

        String token = jwtUtil.generateToken(loadedUser);

        AuthDTO responseAuth = new AuthDTO();
        responseAuth.setEmail(loadedUser.getEmail());
        responseAuth.setToken(token);
        responseAuth.setRole(String.valueOf(loadedUser.getRole())); // Include Role

        return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Login Successful", responseAuth));
    }

    @PostConstruct
    public void verifyPassword() {
        userRepository.findByEmail("shachirurashmika35@gmail.com")
                .ifPresentOrElse(
                        user -> System.out.println("Super admin password match: " +
                                passwordEncoder.matches("123456", user.getPassword())),
                        () -> System.out.println("Super admin not found in database"));
    }
}

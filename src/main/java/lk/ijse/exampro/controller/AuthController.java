package lk.ijse.exampro.controller;

import lk.ijse.exampro.dto.AuthDTO;
import lk.ijse.exampro.dto.LoginRequestDTO;
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

    @PostMapping("/sign_in")
    public ResponseEntity<ResponseDTO> authenticateUser(@RequestBody LoginRequestDTO loginRequestDTO) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequestDTO.getEmail(), loginRequestDTO.getPassword())
            );
        } catch (Exception e) {
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
        responseAuth.setRole(loadedUser.getRole()); // Include Role

        return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Login Successful", responseAuth));
    }
}

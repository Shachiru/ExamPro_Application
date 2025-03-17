package lk.ijse.exampro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private String email;
    private String username;
    private String password;
    private String role;


    private String school_name;  // For Admin
    private String grade;       // For Student
    private String subject;     // For Teacher
}


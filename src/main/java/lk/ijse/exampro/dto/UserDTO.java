package lk.ijse.exampro.dto;

import lk.ijse.exampro.util.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private String email;
    private String fullName;
    private String username;
    private String password;
    private String nic;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private UserRole role;
    private String profilePicture;

    private String schoolName;  // For Admin
    private String grade;       // For Student
    private String subject;     // For Teacher

    private boolean isActive;
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}


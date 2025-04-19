package lk.ijse.exampro.service;

import lk.ijse.exampro.dto.UserDTO;
import lk.ijse.exampro.util.enums.UserRole;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface UserService {
    int saveUser(UserDTO userDTO);

    UserDTO createUserWithProfileImage(UserDTO userDTO, MultipartFile profileImage) throws IOException;

    List<UserDTO> getAllUsers(UserRole authenticatedRole);

    List<UserDTO> getAllAdmins(int page, int size, String status, String search); // Updated

    long countAllAdmins(String status, String search); // Updated

    List<UserDTO> getAllTeachers(int page, int size, String status, String search);

    long countAllTeachers(String status, String search);

    List<UserDTO> getTeachersForInstitution(String schoolName, int page, int size, String status, String search);

    long countTeachersForInstitution(String schoolName, String status, String search);

    UserDTO searchUser(String username);

    int updateUserProfile(String email, UserDTO userDTO);

    int deactivateUser(String email);

    int activateUser(String email);

    UserDTO uploadProfilePicture(String email, MultipartFile file) throws IOException;

    UserDTO deleteProfilePicture(String email) throws IOException;

    int deleteUser(String email);

    List<UserDTO> getTeachersForInstitution(String schoolName);

    List<UserDTO> getStudentsForInstitution(String schoolName);
}
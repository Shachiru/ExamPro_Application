package lk.ijse.exampro.service;

import lk.ijse.exampro.dto.UserDTO;

public interface UserService {
    int saveUser(UserDTO userDTO);
    UserDTO searchUser(String username);
    int deleteUserByEmail(String email);
    int updateUserProfile(String email, UserDTO userDTO);
}
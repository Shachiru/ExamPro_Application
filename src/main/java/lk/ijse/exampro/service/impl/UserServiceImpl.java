package lk.ijse.exampro.service.impl;

import lk.ijse.exampro.dto.UserDTO;
import lk.ijse.exampro.entity.Admin;
import lk.ijse.exampro.entity.Student;
import lk.ijse.exampro.entity.Teacher;
import lk.ijse.exampro.entity.User;
import lk.ijse.exampro.repository.AdminRepository;
import lk.ijse.exampro.repository.StudentRepository;
import lk.ijse.exampro.repository.TeacherRepository;
import lk.ijse.exampro.repository.UserRepository;
import lk.ijse.exampro.service.UserService;
import lk.ijse.exampro.util.VarList;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@Transactional
public class UserServiceImpl implements UserDetailsService, UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email);
        return new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPassword(), getAuthority(user));
    }

    public UserDTO loadUserDetailsByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username);
        return modelMapper.map(user, UserDTO.class);
    }

    private Set<SimpleGrantedAuthority> getAuthority(User user) {
        Set<SimpleGrantedAuthority> authorities = new HashSet<>();

        if (adminRepository.existsByUser(user)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        } else if (studentRepository.existsByUser(user)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_STUDENT"));
        } else if (teacherRepository.existsByUser(user)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_TEACHER"));
        } else {
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        }
        return authorities;
    }

    @Override
    public UserDTO searchUser(String username) {
        if (userRepository.existsByEmail(username)) {
            User user = userRepository.findByEmail(username);
            return modelMapper.map(user, UserDTO.class);
        } else {
            return null;
        }
    }

    @Override
    public int deleteUserByEmail(String email) {
        if (userRepository.existsByEmail(email)) {
            userRepository.deleteByEmail(email);
            return VarList.OK;
        } else {
            return VarList.NOT_FOUND;
        }
    }

    @Override
    public int saveUser(UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            return VarList.NOT_ACCEPTABLE;
        }

        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        userDTO.setPassword(passwordEncoder.encode(userDTO.getPassword()));

        User user = modelMapper.map(userDTO, User.class);
        userRepository.save(user);

        switch (userDTO.getRole().toUpperCase()) {
            case "ADMIN" -> {
                Admin admin = new Admin();
                admin.setUser(user);
                admin.setSchool_name(userDTO.getSchool_name());
                adminRepository.save(admin);
            }
            case "STUDENT" -> {
                Student student = new Student();
                student.setUser(user);
                student.setGrade(userDTO.getGrade());
                studentRepository.save(student);
            }
            case "TEACHER" -> {
                Teacher teacher = new Teacher();
                teacher.setUser(user);
                teacher.setSubject(userDTO.getSubject());
                teacherRepository.save(teacher);
            }
            default -> {
                return VarList.NOT_ACCEPTABLE;
            }
        }

        return VarList.CREATED;
    }

}

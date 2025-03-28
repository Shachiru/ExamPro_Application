package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User,String> {

    User findByEmail(String email);

    boolean existsByEmail(String userName);

    int deleteByEmail(String email);

}
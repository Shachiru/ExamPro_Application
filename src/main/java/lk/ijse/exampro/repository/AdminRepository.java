package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.Admin;
import lk.ijse.exampro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<Admin, Long> {

    boolean existsByUser(User user);

    boolean existsByUser_Email(String email);

    Admin findByUser_Email(String email);

    void deleteByUser_Email(String email);
}

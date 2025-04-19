package lk.ijse.exampro.service.impl;

import lk.ijse.exampro.dto.DashboardStatsDTO;
import lk.ijse.exampro.repository.ExamRepository;
import lk.ijse.exampro.service.DashboardService;
import lk.ijse.exampro.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private UserService userService;

    @Autowired
    private ExamRepository examRepository;

    @Override
    public DashboardStatsDTO getDashboardStats() {
        long totalAdmins = userService.countAllAdmins(null, null);
        long totalStudents = userService.countAllStudents(null, null);
        long totalTeachers = userService.countAllTeachers(null, null);
        long examsThisMonth = examRepository.countExamsThisMonth();
        return new DashboardStatsDTO(totalAdmins, totalStudents, totalTeachers, examsThisMonth);
    }
}

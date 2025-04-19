package lk.ijse.exampro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsDTO {
    private long totalAdmins;
    private long totalStudents;
    private long totalTeachers;
    private long examsThisMonth;
}

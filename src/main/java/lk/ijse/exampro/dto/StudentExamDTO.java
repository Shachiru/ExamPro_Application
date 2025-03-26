package lk.ijse.exampro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamDTO {
    private Long id;
    private Long examId;
    private String studentEmail;
    private Integer score;
    private boolean isCompleted;
}
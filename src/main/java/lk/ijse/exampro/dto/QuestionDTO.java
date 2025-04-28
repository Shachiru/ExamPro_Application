package lk.ijse.exampro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDTO {
    private Long examId;
    private String type;
    private String content;
    private String correctAnswer;
    private String options;
    private String subject;
}

package lk.ijse.exampro.exception;

public class ExamSubmissionException extends RuntimeException {
    public ExamSubmissionException(String message) {
        super(message);
    }

    public ExamSubmissionException(String message, Throwable cause) {
        super(message, cause);
    }
}

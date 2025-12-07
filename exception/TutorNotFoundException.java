package edu.lms.exception;

public class TutorNotFoundException extends RuntimeException {
  public TutorNotFoundException(String message) {
    super(message);
  }

  public TutorNotFoundException(String message, Throwable cause) {
    super(message, cause);
  }
}

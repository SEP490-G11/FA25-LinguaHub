package edu.lms.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.Arrays;
import java.util.Set;
import java.util.Objects;

public class ActiveDaysValidator implements ConstraintValidator<MaxActiveDays, String> {

    private int max;
    private static final Set<String> VALID_DAYS = Set.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");

    @Override
    public void initialize(MaxActiveDays constraintAnnotation) {
        ConstraintValidator.super.initialize(constraintAnnotation);
        max = constraintAnnotation.max();
    }

    @Override
    public boolean isValid(String activeDays, ConstraintValidatorContext constraintValidatorContext) {
        if (Objects.isNull(activeDays) || activeDays.isBlank()) {
            return true; // Let @NotBlank handle empty strings
        }

        // Split by comma and validate
        String[] days = activeDays.split(",");

        // First, validate format of all days
        for (String day : days) {
            String trimmedDay = day.trim().toUpperCase();
            if (trimmedDay.isEmpty()) {
                continue;
            }
            if (!VALID_DAYS.contains(trimmedDay)) {
                constraintValidatorContext.disableDefaultConstraintViolation();
                constraintValidatorContext.buildConstraintViolationWithTemplate(
                        "Invalid day format: '" + day.trim() + "'. Valid formats: Mon, Tue, Wed, Thu, Fri, Sat, Sun"
                ).addConstraintViolation();
                return false;
            }
        }

        // Then, count distinct valid days
        long distinctDays = Arrays.stream(days)
                .map(String::trim)
                .map(String::toUpperCase)
                .filter(day -> !day.isEmpty() && VALID_DAYS.contains(day))
                .distinct()
                .count();

        if (distinctDays == 0) {
            constraintValidatorContext.disableDefaultConstraintViolation();
            constraintValidatorContext.buildConstraintViolationWithTemplate(
                    "Phải có ít nhất 1 ngày hoạt động"
            ).addConstraintViolation();
            return false;
        }

        if (distinctDays > max) {
            constraintValidatorContext.disableDefaultConstraintViolation();
            constraintValidatorContext.buildConstraintViolationWithTemplate(
                    "Tutor chỉ được dạy tối đa " + max + " ngày trong tuần"
            ).addConstraintViolation();
            return false;
        }

        return true;
    }
}


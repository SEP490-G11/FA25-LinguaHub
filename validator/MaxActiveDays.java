package edu.lms.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target({FIELD})
@Retention(RUNTIME)
@Constraint(validatedBy = {ActiveDaysValidator.class})
public @interface MaxActiveDays {
    String message() default "Active days cannot exceed {max} days per week";

    int max() default 5;

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}


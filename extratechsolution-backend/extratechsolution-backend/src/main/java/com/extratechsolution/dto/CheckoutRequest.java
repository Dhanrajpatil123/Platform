package com.extratechsolution.dto;
import com.extratechsolution.enums.PremiumPlan;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckoutRequest {

    @NotNull(message = "Plan is required")
    private PremiumPlan plan;
}

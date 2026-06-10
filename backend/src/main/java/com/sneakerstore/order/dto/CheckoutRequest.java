package com.sneakerstore.order.dto;

import com.sneakerstore.order.enums.PaymentMethod;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CheckoutRequest(
        @NotNull(message = "Informe o metodo de pagamento.")
        PaymentMethod paymentMethod,

        @NotNull(message = "Informe a quantidade de parcelas.")
        @Min(value = 1, message = "Parcelas devem ser pelo menos 1.")
        @Max(value = 10, message = "Cartao permite no maximo 10 parcelas.")
        Integer installments,

        String fullName,
        String email,
        String phone,
        String cep,
        String address,
        String number,
        String complement,
        String city,
        String state
) {
}

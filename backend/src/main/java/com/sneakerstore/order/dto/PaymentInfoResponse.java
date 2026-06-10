package com.sneakerstore.order.dto;

import com.sneakerstore.order.enums.PaymentMethod;

public record PaymentInfoResponse(
        PaymentMethod method,
        Integer installments
) {
}

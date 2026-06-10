package com.sneakerstore.order.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long productId,
        String productName,
        String productImage,
        BigDecimal unitPrice,
        Integer selectedSize,
        Integer quantity,
        BigDecimal lineTotal
) {
}

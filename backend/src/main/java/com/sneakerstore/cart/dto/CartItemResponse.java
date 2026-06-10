package com.sneakerstore.cart.dto;

import java.math.BigDecimal;

public record CartItemResponse(
        Long id,
        Long productId,
        String name,
        String image,
        BigDecimal price,
        Integer selectedSize,
        Integer quantity,
        BigDecimal lineTotal
) {
}

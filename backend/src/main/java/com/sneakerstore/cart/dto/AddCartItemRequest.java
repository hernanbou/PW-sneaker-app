package com.sneakerstore.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AddCartItemRequest(
        @NotNull(message = "Informe o produto.")
        Long productId,

        @NotNull(message = "Informe o tamanho.")
        Integer selectedSize,

        @NotNull(message = "Informe a quantidade.")
        @Min(value = 1, message = "A quantidade deve ser pelo menos 1.")
        Integer quantity
) {
}

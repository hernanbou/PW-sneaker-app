package com.sneakerstore.product.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProductResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        String image,
        Integer stock,
        List<Integer> sizes,
        String brand,
        String line,
        String model,
        String category,
        String gender,
        String colorway,
        Boolean featured,
        BigDecimal rating,
        Integer reviewCount,
        List<String> tags,
        List<String> features
) {
}

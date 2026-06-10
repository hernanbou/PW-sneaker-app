package com.sneakerstore.product.service;

import com.sneakerstore.product.dto.ProductResponse;
import com.sneakerstore.product.entity.Product;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getImage(),
                product.getStock(),
                List.copyOf(product.getSizes()),
                product.getBrand(),
                product.getLine(),
                product.getModel(),
                product.getCategory(),
                product.getGender(),
                product.getColorway(),
                product.getFeatured(),
                product.getRating(),
                product.getReviewCount(),
                List.copyOf(product.getTags()),
                List.copyOf(product.getFeatures())
        );
    }
}

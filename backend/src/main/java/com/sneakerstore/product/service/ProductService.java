package com.sneakerstore.product.service;

import com.sneakerstore.exception.NotFoundException;
import com.sneakerstore.product.dto.ProductResponse;
import com.sneakerstore.product.entity.Product;
import com.sneakerstore.product.repository.ProductRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public ProductService(ProductRepository productRepository, ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> list(String search) {
        List<Product> products = (search == null || search.isBlank())
                ? productRepository.findAll()
                : productRepository.search(search.trim());

        return products.stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Produto nao encontrado."));
        return productMapper.toResponse(product);
    }
}

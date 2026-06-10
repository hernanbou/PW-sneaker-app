package com.sneakerstore.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sneakerstore.product.entity.Product;
import com.sneakerstore.product.repository.ProductRepository;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    public DataSeeder(ProductRepository productRepository, ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (productRepository.count() > 0) {
            return;
        }

        List<SeedProduct> seedProducts = loadProductsFromFrontendCatalog();

        if (seedProducts.isEmpty()) {
            seedProducts = fallbackProducts();
        }

        productRepository.saveAll(seedProducts.stream().map(this::toEntity).toList());
    }

    private List<SeedProduct> loadProductsFromFrontendCatalog() throws Exception {
        List<Path> candidates = List.of(
                Path.of("..", "frontend", "public", "data", "products.json"),
                Path.of("frontend", "public", "data", "products.json")
        );

        for (Path candidate : candidates) {
            if (Files.exists(candidate)) {
                return objectMapper.readValue(
                        Files.readString(candidate),
                        new TypeReference<List<SeedProduct>>() {
                        }
                );
            }
        }

        return List.of();
    }

    private Product toEntity(SeedProduct seedProduct) {
        Product product = new Product();
        product.setId(seedProduct.id());
        product.setName(seedProduct.name());
        product.setDescription(seedProduct.description());
        product.setPrice(seedProduct.price());
        product.setImage(seedProduct.image());
        product.setStock(seedProduct.stock());
        product.setSizes(seedProduct.sizes() == null ? new ArrayList<>() : new ArrayList<>(seedProduct.sizes()));
        product.setBrand(seedProduct.brand());
        product.setLine(seedProduct.line());
        product.setModel(seedProduct.model());
        product.setCategory(seedProduct.category());
        product.setGender(seedProduct.gender());
        product.setColorway(seedProduct.colorway());
        product.setFeatured(seedProduct.featured() != null ? seedProduct.featured() : false);
        product.setRating(seedProduct.rating());
        product.setReviewCount(seedProduct.reviewCount());
        product.setTags(seedProduct.tags() == null ? new ArrayList<>() : new ArrayList<>(seedProduct.tags()));
        product.setFeatures(seedProduct.features() == null ? new ArrayList<>() : new ArrayList<>(seedProduct.features()));
        return product;
    }

    private List<SeedProduct> fallbackProducts() {
        return List.of(
                new SeedProduct(
                        1L,
                        "Nike",
                        "Air Force 1",
                        "Air Force 1 '07",
                        "Nike Air Force 1 '07 Black / White",
                        "Classico de lifestyle com cabedal em couro e visual de quadra.",
                        "Lifestyle",
                        "Masculino",
                        "Black/Black/White",
                        new BigDecimal("799.90"),
                        "https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto/3f3e7049-5c99-428c-abcd-e246b086f2ed/AIR%2BFORCE%2B1%2B%2707.png",
                        11,
                        List.of(38, 39, 40, 41, 42, 43),
                        true,
                        new BigDecimal("4.9"),
                        1117,
                        List.of("couro", "streetwear", "retro", "casual"),
                        List.of("amortecimento Nike Air", "solado de borracha", "acabamento em couro")
                ),
                new SeedProduct(
                        2L,
                        "Adidas",
                        "Campus",
                        "Campus 00s",
                        "Adidas Campus 00s Core Black",
                        "Silhueta robusta com inspiracao skate e cabedal em camurca.",
                        "Lifestyle",
                        "Unissex",
                        "Core Black/Cloud White",
                        new BigDecimal("699.90"),
                        "https://assets.adidas.com/images/w_600,f_auto,q_auto/1b94134b64c54de6aad9af5001040464_9366/Tenis_Campus_00s_Preto_HQ8708_01_standard.jpg",
                        9,
                        List.of(37, 38, 39, 40, 41, 42),
                        true,
                        new BigDecimal("4.8"),
                        712,
                        List.of("camurca", "skate", "urbano"),
                        List.of("solado cupsole", "lingua acolchoada", "visual anos 2000")
                )
        );
    }

    private record SeedProduct(
            Long id,
            String brand,
            String line,
            String model,
            String name,
            String description,
            String category,
            String gender,
            String colorway,
            BigDecimal price,
            String image,
            Integer stock,
            List<Integer> sizes,
            Boolean featured,
            BigDecimal rating,
            Integer reviewCount,
            List<String> tags,
            List<String> features
    ) {
    }
}

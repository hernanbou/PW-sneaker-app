package com.sneakerstore.cart.repository;

import com.sneakerstore.cart.entity.CartItem;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByIdAndCartUserId(Long id, Long userId);
}

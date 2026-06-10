package com.sneakerstore.cart.service;

import com.sneakerstore.cart.dto.AddCartItemRequest;
import com.sneakerstore.cart.dto.CartResponse;
import com.sneakerstore.cart.entity.Cart;
import com.sneakerstore.cart.entity.CartItem;
import com.sneakerstore.cart.repository.CartItemRepository;
import com.sneakerstore.cart.repository.CartRepository;
import com.sneakerstore.exception.BadRequestException;
import com.sneakerstore.exception.InsufficientStockException;
import com.sneakerstore.exception.NotFoundException;
import com.sneakerstore.product.entity.Product;
import com.sneakerstore.product.repository.ProductRepository;
import com.sneakerstore.security.CurrentUserProvider;
import com.sneakerstore.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final CurrentUserProvider currentUserProvider;
    private final CartMapper cartMapper;

    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            CurrentUserProvider currentUserProvider,
            CartMapper cartMapper
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.currentUserProvider = currentUserProvider;
        this.cartMapper = cartMapper;
    }

    @Transactional(readOnly = true)
    public CartResponse getMyCart() {
        Cart cart = getCurrentUserCartWithItems();
        return cartMapper.toResponse(cart);
    }

    @Transactional
    public CartResponse addItem(AddCartItemRequest request) {
        User user = currentUserProvider.getCurrentUser();
        Cart cart = getOrCreateCart(user);
        Product product = productRepository.findByIdForUpdate(request.productId())
                .orElseThrow(() -> new NotFoundException("Produto nao encontrado."));

        validateSize(product, request.selectedSize());
        reserveStock(product, request.quantity());

        CartItem item = cart.getItems().stream()
                .filter(currentItem -> currentItem.getProduct().getId().equals(product.getId()))
                .filter(currentItem -> currentItem.getSelectedSize().equals(request.selectedSize()))
                .findFirst()
                .orElseGet(() -> {
                    CartItem newItem = new CartItem();
                    newItem.setProduct(product);
                    newItem.setSelectedSize(request.selectedSize());
                    newItem.setQuantity(0);
                    cart.addItem(newItem);
                    return newItem;
                });

        item.setQuantity(item.getQuantity() + request.quantity());

        Cart savedCart = cartRepository.save(cart);
        return cartMapper.toResponse(savedCart);
    }

    @Transactional
    public CartResponse removeItem(Long itemId) {
        User user = currentUserProvider.getCurrentUser();
        CartItem item = cartItemRepository.findByIdAndCartUserId(itemId, user.getId())
                .orElseThrow(() -> new NotFoundException("Item do carrinho nao encontrado."));

        Product product = productRepository.findByIdForUpdate(item.getProduct().getId())
                .orElseThrow(() -> new NotFoundException("Produto nao encontrado."));
        product.setStock(product.getStock() + item.getQuantity());

        Cart cart = item.getCart();
        cart.removeItem(item);

        return cartMapper.toResponse(cart);
    }

    @Transactional
    public CartResponse clearMyCart() {
        Cart cart = getCurrentUserCartWithItems();

        for (CartItem item : cart.getItems()) {
            Product product = productRepository.findByIdForUpdate(item.getProduct().getId())
                    .orElseThrow(() -> new NotFoundException("Produto nao encontrado."));
            product.setStock(product.getStock() + item.getQuantity());
        }

        cart.clearItems();
        return cartMapper.toResponse(cart);
    }

    public Cart getCurrentUserCartWithItems() {
        User user = currentUserProvider.getCurrentUser();
        return cartRepository.findByUserIdWithItems(user.getId())
                .orElseGet(() -> getOrCreateCart(user));
    }

    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUserIdWithItems(user.getId())
                .orElseGet(() -> {
                    Cart cart = new Cart();
                    cart.setUser(user);
                    return cartRepository.save(cart);
                });
    }

    private void validateSize(Product product, Integer selectedSize) {
        if (!product.getSizes().contains(selectedSize)) {
            throw new BadRequestException("Tamanho indisponivel para este produto.");
        }
    }

    private void reserveStock(Product product, Integer quantity) {
        if (product.getStock() < quantity) {
            throw new InsufficientStockException("Estoque insuficiente para o produto selecionado.");
        }

        product.setStock(product.getStock() - quantity);
    }
}

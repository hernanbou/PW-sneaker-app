package com.sneakerstore.auth.service;

import com.sneakerstore.auth.dto.LoginRequest;
import com.sneakerstore.auth.dto.LoginResponse;
import com.sneakerstore.auth.dto.RegisterRequest;
import com.sneakerstore.cart.entity.Cart;
import com.sneakerstore.exception.ConflictException;
import com.sneakerstore.security.CurrentUserProvider;
import com.sneakerstore.security.JwtService;
import com.sneakerstore.user.dto.UserResponse;
import com.sneakerstore.user.entity.User;
import com.sneakerstore.user.repository.UserRepository;
import com.sneakerstore.user.service.UserMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final CurrentUserProvider currentUserProvider;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserMapper userMapper,
            CurrentUserProvider currentUserProvider
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userMapper = userMapper;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        String cpf = onlyDigits(request.cpf());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Ja existe um usuario cadastrado com este e-mail.");
        }

        if (userRepository.existsByCpf(cpf)) {
            throw new ConflictException("Ja existe um usuario cadastrado com este CPF.");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setCpf(cpf);
        user.setPhone(onlyDigits(request.phone()));
        user.setCep(onlyDigits(request.cep()));
        user.setAddress(request.address().trim());
        user.setNumber(request.number().trim());
        user.setComplement(trimToEmpty(request.complement()));
        user.setCity(request.city().trim());
        user.setState(request.state().trim().toUpperCase());

        Cart cart = new Cart();
        cart.setUser(user);
        user.setCart(cart);

        User savedUser = userRepository.save(user);
        return userMapper.toResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password())
            );
        } catch (BadCredentialsException exception) {
            throw new BadCredentialsException("E-mail ou senha invalidos.");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("E-mail ou senha invalidos."));
        String token = jwtService.generateToken(user.getEmail());

        return new LoginResponse(token, "Bearer", userMapper.toResponse(user));
    }

    @Transactional(readOnly = true)
    public UserResponse me() {
        return userMapper.toResponse(currentUserProvider.getCurrentUser());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String onlyDigits(String value) {
        return value.replaceAll("\\D", "");
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}

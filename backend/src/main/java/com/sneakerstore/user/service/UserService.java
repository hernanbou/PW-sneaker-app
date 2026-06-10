package com.sneakerstore.user.service;

import com.sneakerstore.exception.ConflictException;
import com.sneakerstore.exception.NotFoundException;
import com.sneakerstore.security.CurrentUserProvider;
import com.sneakerstore.user.dto.UpdateUserRequest;
import com.sneakerstore.user.dto.UserResponse;
import com.sneakerstore.user.entity.User;
import com.sneakerstore.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;
    private final UserMapper userMapper;

    public UserService(
            UserRepository userRepository,
            CurrentUserProvider currentUserProvider,
            UserMapper userMapper
    ) {
        this.userRepository = userRepository;
        this.currentUserProvider = currentUserProvider;
        this.userMapper = userMapper;
    }

    @Transactional(readOnly = true)
    public UserResponse getMe() {
        User currentUser = currentUserProvider.getCurrentUser();
        User user = findById(currentUser.getId());
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateMe(UpdateUserRequest request) {
        User currentUser = currentUserProvider.getCurrentUser();
        User user = findById(currentUser.getId());

        String email = normalizeEmail(request.email());
        String cpf = onlyDigits(request.cpf());

        if (userRepository.existsByEmailIgnoreCaseAndIdNot(email, user.getId())) {
            throw new ConflictException("Ja existe outro usuario cadastrado com este e-mail.");
        }

        if (userRepository.existsByCpfAndIdNot(cpf, user.getId())) {
            throw new ConflictException("Ja existe outro usuario cadastrado com este CPF.");
        }

        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setCpf(cpf);
        user.setPhone(onlyDigits(request.phone()));
        user.setCep(onlyDigits(request.cep()));
        user.setAddress(request.address().trim());
        user.setNumber(request.number().trim());
        user.setComplement(trimToEmpty(request.complement()));
        user.setCity(request.city().trim());
        user.setState(request.state().trim().toUpperCase());

        return userMapper.toResponse(user);
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Usuario nao encontrado."));
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

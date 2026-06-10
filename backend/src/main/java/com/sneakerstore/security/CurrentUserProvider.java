package com.sneakerstore.security;

import com.sneakerstore.exception.UnauthorizedException;
import com.sneakerstore.user.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserProvider {

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            throw new UnauthorizedException("Usuario nao autenticado.");
        }

        return authenticatedUser.getUser();
    }
}

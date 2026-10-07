package com.extratechsolution.config;

import com.extratechsolution.entity.User;
import com.extratechsolution.enums.Role;
import com.extratechsolution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final PasswordEncoder passwordEncoder;

    private final UserRepository userRepository;


    @Override
    public void run(String... args) throws Exception {

        if(this.userRepository.existsByUsername("admin")){
            return;
        }

        User admin = new User();
        admin.setUsername("admin");
        admin.setEmail("admin@extratech.com");
        admin.setPasswordHash(this.passwordEncoder.encode("Admin@123"));
        admin.setRole(Role.ADMIN);

        userRepository.save(admin);


    }
}

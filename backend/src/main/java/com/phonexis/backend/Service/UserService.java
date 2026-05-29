package com.phonexis.backend.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Entity.User.Role;
import com.phonexis.backend.Repository.UserRepository;

@Service
public class UserService {
	private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

	private final UserRepository userRepository;

	public UserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<UserProfile> listUsers() {
		return userRepository.findAll().stream().map(this::toUserProfile).toList();
	}

	@Transactional(readOnly = true)
	public UserProfile getUser(Long id) {
		return toUserProfile(getUserEntity(id));
	}

	@Transactional
	public UserProfile createUser(CreateUserRequest request) {
		String username = normalizeUsername(request.username());
		String email = normalizeEmail(request.email());

		if (username.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
		}

		if (email.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
		}

		if (request.password() == null || request.password().length() < 8) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
		}

		if (userRepository.existsByUsernameIgnoreCase(username)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with that username already exists");
		}

		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with that email already exists");
		}

		User user = new User();
		applyUserFields(user, username, email, request.role());
		user.setPasswordHash(PASSWORD_ENCODER.encode(request.password()));

		return toUserProfile(userRepository.save(user));
	}

	@Transactional
	public UserProfile updateUser(Long id, UpdateUserRequest request) {
		User user = getUserEntity(id);
		String username = normalizeUsername(request.username() != null ? request.username() : user.getUsername());
		String email = normalizeEmail(request.email() != null ? request.email() : user.getEmail());

		if (username.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
		}

		if (email.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
		}

		if (userRepository.existsByUsernameIgnoreCaseAndUserIdNot(username, id)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with that username already exists");
		}

		if (userRepository.existsByEmailIgnoreCaseAndUserIdNot(email, id)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with that email already exists");
		}

		applyUserFields(user, username, email, request.role() != null ? request.role() : user.getRole().name());

		if (request.password() != null && !request.password().isBlank()) {
			if (request.password().length() < 8) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
			}

			user.setPasswordHash(PASSWORD_ENCODER.encode(request.password()));
		}

		return toUserProfile(userRepository.save(user));
	}

	@Transactional
	public void deleteUser(Long id) {
		userRepository.delete(getUserEntity(id));
	}

	@Transactional(readOnly = true)
	public UserProfile login(String email, String password) {
		User user = getUserByEmail(email);
		if (!PASSWORD_ENCODER.matches(password, user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
		}

		return toUserProfile(user);
	}

	@Transactional
	public void resetPassword(String email, String password) {
		if (password == null || password.length() < 8) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
		}

		User user = getUserByEmail(email);
		user.setPasswordHash(PASSWORD_ENCODER.encode(password));
		userRepository.save(user);
	}

	@Transactional
	public void changePassword(String email, String currentPassword, String password) {
		if (password == null || password.length() < 8) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
		}

		User user = getUserByEmail(email);
		if (!PASSWORD_ENCODER.matches(currentPassword, user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
		}

		user.setPasswordHash(PASSWORD_ENCODER.encode(password));
		userRepository.save(user);
	}

	private void applyUserFields(User user, String username, String email, String role) {
		user.setUsername(username);
		user.setEmail(email);
		user.setRole(normalizeRole(role));
	}

	private User getUserEntity(Long id) {
		if (id == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User id is required");
		}

		return userRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
	}

	private User getUserByEmail(String email) {
		String normalizedEmail = normalizeEmail(email);
		if (normalizedEmail.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
		}

		return userRepository.findByEmailIgnoreCase(normalizedEmail)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
	}

	private String normalizeEmail(String email) {
		return email == null ? "" : email.trim().toLowerCase();
	}

	private String normalizeUsername(String username) {
		return username == null ? "" : username.trim();
	}

	private Role normalizeRole(String role) {
		if (role == null || role.trim().isEmpty()) {
			return Role.STUDENT;
		}

		return switch (role.trim().toUpperCase()) {
			case "TEACHER" -> Role.TEACHER;
			case "ADMIN" -> Role.ADMIN;
			default -> Role.STUDENT;
		};
	}

	private UserProfile toUserProfile(User user) {
		Map<String, Object> userMetadata = new LinkedHashMap<>();
		userMetadata.put("username", user.getUsername());
		userMetadata.put("role", user.getRole().name().toLowerCase());
		userMetadata.put("email", user.getEmail());

		return new UserProfile(
			user.getUserId(),
			user.getEmail(),
			user.getUsername(),
			user.getRole().name().toLowerCase(),
			user.getCreatedAt(),
			userMetadata
		);
	}

	public record CreateUserRequest(String username, String email, String password, String role) {
	}

	public record UpdateUserRequest(String username, String email, String password, String role) {
	}

	public record UserProfile(Long id, String email, String username, String role, java.time.LocalDateTime createdAt, Map<String, Object> user_metadata) {
	}
}
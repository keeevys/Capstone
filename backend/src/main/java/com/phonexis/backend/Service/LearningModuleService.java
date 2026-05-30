package com.phonexis.backend.Service;

import java.util.List;
import java.util.Map;

import jakarta.annotation.PostConstruct;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.phonexis.backend.Entity.LearningModule;
import com.phonexis.backend.Repository.LearningModuleRepository;

@Service
public class LearningModuleService {
	private final LearningModuleRepository learningModuleRepository;

	public LearningModuleService(LearningModuleRepository learningModuleRepository) {
		this.learningModuleRepository = learningModuleRepository;
	}

	@PostConstruct
	public void seedDefaultModules() {
		seedModule("alphabet", "Alphabet recognition", "Letter shapes, sounds, and fast visual recall.", 1);
		seedModule("vowels", "Vowels", "Learn vowel sounds with audio guides and activities.", 2);
		seedModule("consonants", "Consonants", "Explore consonant sounds with visual learning.", 3);
		seedModule("cvc", "CVC words", "Three-letter blend practice for simple decoding.", 4);
	}

	@Transactional(readOnly = true)
	public List<ModuleResponse> listModules() {
		return learningModuleRepository.findAllByOrderByDisplayOrderAscTitleAsc()
			.stream()
			.map(ModuleResponse::new)
			.toList();
	}

	@Transactional(readOnly = true)
	public ModuleResponse getModule(Long id) {
		return new ModuleResponse(getModuleEntity(id));
	}

	@Transactional(readOnly = true)
	public ModuleResponse getModuleByKey(String moduleKey) {
		return new ModuleResponse(getModuleEntityByKey(moduleKey));
	}

	@Transactional
	public ModuleResponse createModule(CreateModuleRequest request) {
		String moduleKey = normalize(request.moduleKey());
		String title = normalize(request.title());
		String description = request.description() == null ? "" : request.description().trim();
		Integer displayOrder = request.displayOrder() == null ? 0 : request.displayOrder();

		if (moduleKey.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Module key is required");
		}

		if (title.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Module title is required");
		}

		if (learningModuleRepository.existsByModuleKeyIgnoreCase(moduleKey)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "A module with that key already exists");
		}

		LearningModule module = new LearningModule();
		module.setModuleKey(moduleKey);
		module.setTitle(title);
		module.setDescription(description);
		module.setDisplayOrder(displayOrder);
		module.setActive(request.active() == null || request.active());

		return new ModuleResponse(learningModuleRepository.save(module));
	}

	@Transactional
	public ModuleResponse updateModule(Long id, UpdateModuleRequest request) {
		LearningModule module = getModuleEntity(id);

		if (request.moduleKey() != null) {
			String moduleKey = normalize(request.moduleKey());
			if (moduleKey.isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Module key is required");
			}
			if (learningModuleRepository.existsByModuleKeyIgnoreCaseAndModuleIdNot(moduleKey, id)) {
				throw new ResponseStatusException(HttpStatus.CONFLICT, "A module with that key already exists");
			}
			module.setModuleKey(moduleKey);
		}

		if (request.title() != null) {
			String title = normalize(request.title());
			if (title.isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Module title is required");
			}
			module.setTitle(title);
		}

		if (request.description() != null) {
			module.setDescription(request.description().trim());
		}

		if (request.displayOrder() != null) {
			module.setDisplayOrder(request.displayOrder());
		}

		if (request.active() != null) {
			module.setActive(request.active());
		}

		return new ModuleResponse(learningModuleRepository.save(module));
	}

	@Transactional
	public void deleteModule(Long id) {
		learningModuleRepository.delete(getModuleEntity(id));
	}

	private void seedModule(String moduleKey, String title, String description, int displayOrder) {
		if (learningModuleRepository.existsByModuleKeyIgnoreCase(moduleKey)) {
			return;
		}

		LearningModule module = new LearningModule();
		module.setModuleKey(moduleKey);
		module.setTitle(title);
		module.setDescription(description);
		module.setDisplayOrder(displayOrder);
		module.setActive(true);
		learningModuleRepository.save(module);
	}

	private LearningModule getModuleEntity(Long id) {
		if (id == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Module id is required");
		}

		return learningModuleRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
	}

	private LearningModule getModuleEntityByKey(String moduleKey) {
		String normalizedKey = normalize(moduleKey);
		if (normalizedKey.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Module key is required");
		}

		return learningModuleRepository.findByModuleKeyIgnoreCase(normalizedKey)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
	}

	private String normalize(String value) {
		return value == null ? "" : value.trim().toLowerCase();
	}

	public record CreateModuleRequest(String moduleKey, String title, String description, Integer displayOrder, Boolean active) {
	}

	public record UpdateModuleRequest(String moduleKey, String title, String description, Integer displayOrder, Boolean active) {
	}

	public record ModuleResponse(Long id, String moduleKey, String title, String description, Integer displayOrder, Boolean active, java.time.LocalDateTime createdAt, java.time.LocalDateTime updatedAt, Map<String, Object> metadata) {
		public ModuleResponse(LearningModule module) {
			this(
				module.getModuleId(),
				module.getModuleKey(),
				module.getTitle(),
				module.getDescription(),
				module.getDisplayOrder(),
				module.getActive(),
				module.getCreatedAt(),
				module.getUpdatedAt(),
				Map.of(
					"moduleKey", module.getModuleKey(),
					"title", module.getTitle(),
					"active", module.getActive()
				)
			);
		}
	}
}
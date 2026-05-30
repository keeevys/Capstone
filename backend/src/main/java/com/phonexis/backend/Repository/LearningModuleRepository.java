package com.phonexis.backend.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.phonexis.backend.Entity.LearningModule;

@Repository
public interface LearningModuleRepository extends JpaRepository<LearningModule, Long> {
	Optional<LearningModule> findByModuleKeyIgnoreCase(String moduleKey);

	boolean existsByModuleKeyIgnoreCase(String moduleKey);

	boolean existsByModuleKeyIgnoreCaseAndModuleIdNot(String moduleKey, Long moduleId);

	List<LearningModule> findAllByOrderByDisplayOrderAscTitleAsc();
}
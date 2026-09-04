package com.phonexis.backend.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.phonexis.backend.Entity.PronunciationAttempt;

@Repository
public interface PronunciationAttemptRepository extends JpaRepository<PronunciationAttempt, Long> {
	List<PronunciationAttempt> findByUser_UserIdOrderByCreatedAtDesc(Long userId);

	List<PronunciationAttempt> findByUser_UserIdAndLevelIdOrderByCreatedAtDesc(Long userId, String levelId);
}

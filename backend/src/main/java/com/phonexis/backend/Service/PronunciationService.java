package com.phonexis.backend.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.phonexis.backend.Entity.PronunciationAttempt;
import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Repository.PronunciationAttemptRepository;
import com.phonexis.backend.Repository.UserRepository;

/**
 * Authoritative, server-side pronunciation check. The browser is the only
 * thing that can capture a microphone and run speech-to-text (that's what
 * the Web Speech API on the client already does), so this service takes the
 * recognized transcript the client produced and independently re-scores it
 * against the target word — the game does not simply trust the client's own
 * number. Every checked attempt is persisted so progress/history survives
 * across devices instead of living only in browser localStorage.
 */
@Service
public class PronunciationService {

	private static final int PASS_THRESHOLD = 60;
	private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

	private final PronunciationAttemptRepository attemptRepository;
	private final UserRepository userRepository;

	public PronunciationService(PronunciationAttemptRepository attemptRepository, UserRepository userRepository) {
		this.attemptRepository = attemptRepository;
		this.userRepository = userRepository;
	}

	@Transactional
	public CheckResponse checkPronunciation(CheckRequest request) {
		String targetWord = request.targetWord() == null ? "" : request.targetWord().trim();
		if (targetWord.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetWord is required");
		}

		List<AlternativeDTO> alternatives = request.alternatives();
		String bestAlternative = pickBestAlternative(targetWord, request.transcript(), alternatives);

		CheckResponse response;
		if (bestAlternative == null || bestAlternative.isBlank()) {
			response = new CheckResponse(0, "incorrect", false, "", targetWord,
				"We couldn't hear you",
				"No speech text reached the server. Check your microphone and try again.");
		} else {
			double phonetic = PhoneticMatcher.phoneticSimilarity(targetWord, bestAlternative);
			double text = PhoneticMatcher.textSimilarity(targetWord, bestAlternative);
			double confidence = clamp01(request.confidence() == null ? 0.7 : request.confidence());
			double audioQuality = clamp01(request.audioQuality() == null ? 0.7 : request.audioQuality());

			double blended = 0.6 * phonetic + 0.25 * confidence + 0.15 * audioQuality;
			double textBoost = text >= 0.98 ? 0.05 : 0;
			int score = (int) Math.round(clamp01(blended + textBoost) * 100);

			Band band = bandFor(score);
			boolean passed = score >= PASS_THRESHOLD;
			response = new CheckResponse(score, band.key, passed, bestAlternative, targetWord,
				band.emoji + " " + band.label,
				buildMessage(band, bestAlternative, targetWord));
		}

		if (request.userId() != null) {
			persistAttempt(request.userId(), request.levelId(), response);
		}

		return response;
	}

	@Transactional(readOnly = true)
	public List<AttemptSummary> getHistory(Long userId, String levelId) {
		if (userId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
		}

		List<PronunciationAttempt> attempts = (levelId == null || levelId.isBlank())
			? attemptRepository.findByUser_UserIdOrderByCreatedAtDesc(userId)
			: attemptRepository.findByUser_UserIdAndLevelIdOrderByCreatedAtDesc(userId, levelId);

		return attempts.stream().map(AttemptSummary::new).toList();
	}

	private void persistAttempt(Long userId, String levelId, CheckResponse response) {
		User user = userRepository.findById(userId).orElse(null);
		if (user == null) {
			// Unknown/guest user id — the check itself still succeeded, just skip persistence.
			return;
		}

		PronunciationAttempt attempt = new PronunciationAttempt();
		attempt.setUser(user);
		attempt.setLevelId(levelId);
		attempt.setTargetWord(response.targetWord());
		attempt.setTranscript(response.transcript());
		attempt.setScore(response.score());
		attempt.setPassed(response.passed());
		attempt.setBand(response.band());
		attemptRepository.save(attempt);
	}

	private String pickBestAlternative(String targetWord, String fallbackTranscript, List<AlternativeDTO> alternatives) {
		String best = null;
		double bestScore = -1;

		if (alternatives != null) {
			for (AlternativeDTO alt : alternatives) {
				if (alt == null || alt.transcript() == null || alt.transcript().isBlank()) {
					continue;
				}
				double score = PhoneticMatcher.phoneticSimilarity(targetWord, alt.transcript());
				if (score > bestScore) {
					bestScore = score;
					best = alt.transcript();
				}
			}
		}

		if (best == null && fallbackTranscript != null && !fallbackTranscript.isBlank()) {
			best = fallbackTranscript;
		}

		return best;
	}

	private String buildMessage(Band band, String transcript, String targetWord) {
		return switch (band.key) {
			case "excellent" -> "Perfect! \"" + transcript + "\" sounded just like \"" + targetWord + "\".";
			case "good" -> "Nice work! You said \"" + transcript + "\", very close to \"" + targetWord + "\".";
			case "needs-improvement" ->
				"Getting there! You said \"" + transcript + "\". Try to match \"" + targetWord + "\" more closely.";
			default -> "You said \"" + transcript + "\", but the target word is \"" + targetWord + "\". Listen and try again.";
		};
	}

	private Band bandFor(int score) {
		if (score >= 90) return new Band("excellent", "Excellent", "✅");
		if (score >= 75) return new Band("good", "Good", "✅");
		if (score >= PASS_THRESHOLD) return new Band("needs-improvement", "Needs Improvement", "🔄");
		return new Band("incorrect", "Incorrect", "❌");
	}

	private double clamp01(double value) {
		if (Double.isNaN(value)) return 0;
		return Math.min(1, Math.max(0, value));
	}

	private record Band(String key, String label, String emoji) {
	}

	public record AlternativeDTO(String transcript, Double confidence) {
	}

	public record CheckRequest(
		Long userId,
		String levelId,
		String targetWord,
		String transcript,
		List<AlternativeDTO> alternatives,
		Double confidence,
		Double audioQuality
	) {
	}

	public record CheckResponse(
		int score,
		String band,
		boolean passed,
		String transcript,
		String targetWord,
		String title,
		String message
	) {
	}

	public record AttemptSummary(
		Long attemptId,
		String levelId,
		String targetWord,
		String transcript,
		Integer score,
		Boolean passed,
		String band,
		String createdAt
	) {
		AttemptSummary(PronunciationAttempt attempt) {
			this(
				attempt.getAttemptId(),
				attempt.getLevelId(),
				attempt.getTargetWord(),
				attempt.getTranscript(),
				attempt.getScore(),
				attempt.getPassed(),
				attempt.getBand(),
				attempt.getCreatedAt() == null ? null : attempt.getCreatedAt().format(TIMESTAMP_FORMAT)
			);
		}
	}
}

package com.phonexis.backend.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.phonexis.backend.Service.PronunciationService;
import com.phonexis.backend.Service.PronunciationService.AttemptSummary;
import com.phonexis.backend.Service.PronunciationService.CheckRequest;
import com.phonexis.backend.Service.PronunciationService.CheckResponse;

@RestController
@RequestMapping("/api/pronunciation")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"})
public class PronunciationController {

	private final PronunciationService pronunciationService;

	public PronunciationController(PronunciationService pronunciationService) {
		this.pronunciationService = pronunciationService;
	}

	@PostMapping("/check")
	public ResponseEntity<CheckResponse> check(@RequestBody CheckRequest request) {
		return ResponseEntity.ok(pronunciationService.checkPronunciation(request));
	}

	@GetMapping("/history/user/{userId}")
	public ResponseEntity<List<AttemptSummary>> history(
		@PathVariable Long userId,
		@RequestParam(required = false) String levelId
	) {
		return ResponseEntity.ok(pronunciationService.getHistory(userId, levelId));
	}
}

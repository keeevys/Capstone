package com.phonexis.backend.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Server-side mirror of the frontend's rule-based grapheme-to-phoneme
 * approximation (see Web/phonexis/.../Phonzy/lib/phonemeUtils.js). Kept in
 * lockstep so the backend can independently verify a recognized transcript
 * against the target word, rather than trusting the client's own score.
 */
final class PhoneticMatcher {

	private static final List<Map.Entry<String, String>> MULTI_LETTER_RULES = buildMultiLetterRules();
	private static final Map<Character, String> SINGLE_LETTER_RULES = buildSingleLetterRules();

	private PhoneticMatcher() {
	}

	static List<String> wordToPhonemes(String word) {
		List<String> phonemes = new ArrayList<>();
		if (word == null) {
			return phonemes;
		}

		String clean = word.toLowerCase().replaceAll("[^a-z]", "");
		if (clean.isEmpty()) {
			return phonemes;
		}

		if (clean.length() > 3 && clean.endsWith("e") && "bcdfghjklmnpqrstvwxyz".indexOf(clean.charAt(clean.length() - 2)) >= 0) {
			clean = clean.substring(0, clean.length() - 1);
		}

		int i = 0;
		while (i < clean.length()) {
			boolean matched = false;
			for (Map.Entry<String, String> rule : MULTI_LETTER_RULES) {
				String pattern = rule.getKey();
				if (clean.startsWith(pattern, i)) {
					phonemes.add(rule.getValue());
					i += pattern.length();
					matched = true;
					break;
				}
			}
			if (matched) {
				continue;
			}

			char letter = clean.charAt(i);
			phonemes.add(SINGLE_LETTER_RULES.getOrDefault(letter, String.valueOf(letter).toUpperCase()));
			i += 1;
		}

		return phonemes;
	}

	static double phoneticSimilarity(String targetWord, String spokenText) {
		return arraySimilarity(wordToPhonemes(targetWord), wordToPhonemes(spokenText));
	}

	static double textSimilarity(String a, String b) {
		String left = a == null ? "" : a.toLowerCase().trim();
		String right = b == null ? "" : b.toLowerCase().trim();
		if (left.isEmpty() || right.isEmpty()) {
			return 0;
		}
		if (left.equals(right)) {
			return 1;
		}
		return arraySimilarity(toCharTokens(left), toCharTokens(right));
	}

	private static List<String> toCharTokens(String value) {
		List<String> tokens = new ArrayList<>(value.length());
		for (int i = 0; i < value.length(); i += 1) {
			tokens.add(String.valueOf(value.charAt(i)));
		}
		return tokens;
	}

	private static double arraySimilarity(List<String> a, List<String> b) {
		if (a.isEmpty() && b.isEmpty()) {
			return 1;
		}
		int distance = editDistance(a, b);
		return 1 - (double) distance / Math.max(a.size(), b.size());
	}

	private static int editDistance(List<String> a, List<String> b) {
		int m = a.size();
		int n = b.size();
		if (m == 0) return n;
		if (n == 0) return m;

		int[][] matrix = new int[m + 1][n + 1];
		for (int i = 0; i <= m; i += 1) matrix[i][0] = i;
		for (int j = 0; j <= n; j += 1) matrix[0][j] = j;

		for (int i = 1; i <= m; i += 1) {
			for (int j = 1; j <= n; j += 1) {
				if (a.get(i - 1).equals(b.get(j - 1))) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = 1 + Math.min(matrix[i - 1][j - 1], Math.min(matrix[i - 1][j], matrix[i][j - 1]));
				}
			}
		}

		return matrix[m][n];
	}

	private static List<Map.Entry<String, String>> buildMultiLetterRules() {
		List<Map.Entry<String, String>> rules = new ArrayList<>();
		String[][] pairs = {
			{"tch", "CH"}, {"dge", "JH"}, {"igh", "AY"}, {"eigh", "AY"},
			{"sh", "SH"}, {"ch", "CH"}, {"th", "TH"}, {"ph", "F"}, {"wh", "W"},
			{"ng", "NG"}, {"ck", "K"}, {"qu", "KW"},
			{"ai", "AY"}, {"ay", "AY"}, {"ee", "IY"}, {"ea", "IY"}, {"oa", "OW"},
			{"ow", "OW"}, {"ou", "AW"}, {"oo", "UW"}, {"oy", "OY"}, {"oi", "OY"},
			{"ar", "AR"}, {"er", "ER"}, {"ir", "ER"}, {"or", "AOR"}, {"ur", "ER"},
			{"au", "AO"}, {"aw", "AO"},
		};
		for (String[] pair : pairs) {
			rules.add(Map.entry(pair[0], pair[1]));
		}
		return rules;
	}

	private static Map<Character, String> buildSingleLetterRules() {
		Map<Character, String> map = new LinkedHashMap<>();
		map.put('a', "AE");
		map.put('b', "B");
		map.put('c', "K");
		map.put('d', "D");
		map.put('e', "EH");
		map.put('f', "F");
		map.put('g', "G");
		map.put('h', "HH");
		map.put('i', "IH");
		map.put('j', "JH");
		map.put('k', "K");
		map.put('l', "L");
		map.put('m', "M");
		map.put('n', "N");
		map.put('o', "AA");
		map.put('p', "P");
		map.put('q', "K");
		map.put('r', "R");
		map.put('s', "S");
		map.put('t', "T");
		map.put('u', "AH");
		map.put('v', "V");
		map.put('w', "W");
		map.put('x', "KS");
		map.put('y', "IY");
		map.put('z', "Z");
		return map;
	}
}

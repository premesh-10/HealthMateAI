# triage_gemini.py
import os
import json
import re
from typing import Any, Dict, List, Tuple, Optional

import google.generativeai as genai
from dotenv import load_dotenv

# -----------------------------
# Env & Gemini configuration
# -----------------------------
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

if not GEMINI_API_KEY:
    raise RuntimeError("❌ Missing GEMINI_API_KEY in .env file")

genai.configure(api_key=GEMINI_API_KEY)

# -----------------------------
# Schema example (for prompt)
# -----------------------------
SCHEMA_EXAMPLE = {
    "conditions": [
        {
            "name": "Common Cold",
            "confidence": 0.72,
            "description": "A viral infection causing sore throat, fever, and fatigue.",
            "recommendedActions": ["Rest at home", "Hydrate frequently", "Use over-the-counter pain relief"],
            "whenToSeekCare": "If fever persists for more than 3 days, or symptoms worsen."
        }
    ],
    "triageLevel": "self-care",
    "disclaimer": "This tool provides educational insights only. Consult a healthcare professional for medical advice."
}

SYSTEM_INSTRUCTIONS = """
You are a cautious medical triage assistant. Return ONLY a STRICT JSON object matching:

{
  "conditions": [
    {
      "name": "string",
      "confidence": 0.0,
      "description": "string",
      "recommendedActions": ["string", "string"],
      "whenToSeekCare": "string"
    }
  ],
  "triageLevel": "self-care" | "doctor" | "emergency",
  "disclaimer": "This tool provides educational insights only. Consult a healthcare professional for medical advice."
}

Rules:
- Output ONLY valid JSON. No extra text.
- Provide 1–3 likely conditions.
- confidence: a number 0–1 with two-decimal precision.
- Use clear, layperson-friendly language.

Triage rules (authoritative):
1) "emergency" ONLY if clearly severe red flags are present:
   severe/crushing chest pain (esp. radiating to arm/jaw); shortness of breath/difficulty breathing; blue lips;
   fainting/unresponsive; confusion; signs of stroke (face droop, arm weakness, speech trouble); uncontrolled bleeding;
   stiff neck with fever; seizure; severe allergic reaction/anaphylaxis (swelling of face/lips/tongue + breathing trouble);
   suspected poisoning/overdose; shock (cold/clammy, very low BP); pregnancy with heavy bleeding or severe abdominal pain;
   SpO2 < 90%; temperature ≥ 40.0°C (104°F); sustained HR ≥ 130 bpm.

2) Else "doctor" if any moderate flags are present:
   fever > 3 days; persistent/high fever (≥38.5°C / ≥101.5°F); dehydration; symptoms clearly worsening;
   severe headache; ear pain; chest tightness or wheeze; pregnancy; immunocompromised; infant or elderly;
   SpO2 90–93%; sustained HR 110–129 bpm.

3) Else "self-care" for mild or vague symptoms without red/moderate flags.
   - Specifically: phrases like "mild fever", "low-grade fever", or "fever under 38°C" without other concerning signs,
     and duration ≤ 3 days MUST be "self-care".

- Always include the disclaimer as shown.
"""

# -----------------------------
# Negation handling & patterns
# -----------------------------
NEGATIONS = [
    r"\bno\b", r"\bnot\b", r"\bdenies?\b", r"\bwithout\b", r"\bnone\b",
    r"\bnever\b", r"\babsence of\b", r"\bdoesn'?t\b", r"\bdoes not\b"
]
NEGATION_WINDOW = 6  # tokens before a match that can negate it

# Emergency patterns (regex, unnegated)
EMERGENCY_PATTERNS = [
    # Cardiac / respiratory
    r"\b(crushing|severe)\s+chest pain\b",
    r"\bchest pain (radiating|shooting) (to )?(left )?(arm|jaw|back)\b",
    r"\b(shortness of breath|difficulty breathing|can'?t breathe|cannot breathe|gasping|labou?r(ed)? breathing|breathless|dyspnea)\b",
    r"\bblue lips?\b",
    # Neuro / consciousness
    r"\b(unresponsive|unconscious|coma|not waking up|can'?t wake up)\b",
    r"\bfaint(ing)?\b",
    r"\b(confusion|disoriented|altered mental status)\b",
    r"\b(stroke|face droop|arm weakness|speech (trouble|difficulty)|aphasia|one[- ]sided weakness)\b",
    r"\b(seizure|fits?|convulsion|status epilepticus)\b",
    r"\b(sudden|thunderclap)\s+(headache|worst headache of (my|your) life)\b",
    # Bleeding / sepsis / shock
    r"\buncontrolled bleeding|bleeding won'?t stop\b",
    r"\b(vomiting|throwing up)\s+(blood|coffee[- ]grounds?)\b",
    r"\b(black|tarry)\s+stools?\b",
    r"\bbloody stools?\b",
    r"\b(sepsis|septic shock|shock state|cold and clammy)\b",
    # Anaphylaxis
    r"\b(anaphylaxis|allergic shock)\b",
    r"\b(swelling of (face|lips|tongue)|throat closing)\b",
    # Abdomen / GI catastrophe
    r"\b(severe|tearing)\s+abdominal pain\b",
    r"\b(rigid|board[- ]like)\s+abdomen\b",
    r"\buncontrolled vomiting\b",
    # Respiratory blood
    r"\bcough(ing)?\s+blood\b",
    # Eye emergencies
    r"\b(sudden|acute)\s+(vision loss|blindness|loss of vision)\b",
    r"\bchemical\s+(in|to)\s+eye\b",
    r"\b(painful|red)\s+eye\s+with\s+vision\s+changes?\b",
    # OB/Gyn emergencies
    r"\b(pregnan(t|cy)).*(heavy bleeding|passing clots|severe abdominal pain|shoulder tip pain)\b",
    # GU
    r"\b(sudden|severe)\s+testicular pain\b",
    # Overdose / toxins / trauma
    r"\bpoison(ing)?|overdose|toxin exposure\b",
    r"\b(major|high[- ]speed|severe)\s+trauma\b",
    # Profound lethargy suggestive of coma/sepsis
    r"\b(very|prolonged|continuous)\s+(sleep|sleepiness|drowsiness|lethargy|hard to wake)\b",
]

# Moderate patterns (regex, unnegated)
MODERATE_PATTERNS = [
    r"\bworsening symptoms?\b",
    r"\bsevere headache\b",
    r"\bear pain\b",
    r"\b(chest tightness|tight chest)\b",
    r"\bwheez(e|ing)\b",
    r"\bpregnan(t|cy)\b",
    r"\bimmunocompromised|on chemotherapy|steroid therapy\b",
    r"\binfant|newborn|elderly|older adult\b",
    r"\b(dehydrated|dehydration|very dry mouth|no urine|dark urine)\b",
    r"\b(new|sudden)\s+chest pain\b",
    r"\bproductive cough\b",
    r"\bhigh blood pressure\b",
    r"\bpersistent vomiting\b",
    r"\bpain with urination\b",
    r"\bback pain with fever\b",
]

# Mild cues -> prefer self-care when no flags
MILD_HINTS = [
    "mild", "low-grade", "low grade", "slight", "minor",
    "not interfering with activities", "breathing normal",
    "no breathing difficulty", "no shortness of breath", "no wheeze",
]

# -----------------------------
# Regex helpers (negation-aware)
# -----------------------------
_token_re = re.compile(r"\w+|\S")

def _tokenize(text: str) -> List[str]:
    return _token_re.findall(text)

def _is_negated(tokens: List[str], match_start_idx: int) -> bool:
    left = max(0, match_start_idx - NEGATION_WINDOW)
    window = " ".join(tokens[left:match_start_idx]).lower()
    for n in NEGATIONS:
        if re.search(n, window):
            return True
    return False

def _find_unnegated(pattern: str, text: str) -> bool:
    tokens = _tokenize(text)
    # map char index to token index
    char_to_tok: List[Tuple[int, int, int]] = []
    pos = 0
    for i, t in enumerate(tokens):
        start = text.find(t, pos)
        end = start + len(t)
        char_to_tok.append((start, end, i))
        pos = end

    for m in re.finditer(pattern, text, flags=re.IGNORECASE):
        start_char = m.start()
        tok_idx = 0
        for (s, e, ti) in char_to_tok:
            if s <= start_char < e:
                tok_idx = ti
                break
        if not _is_negated(tokens, tok_idx):
            return True
    return False

def _contains_any_unnegated(patterns: List[str], text: str) -> bool:
    return any(_find_unnegated(p, text) for p in patterns)

# -----------------------------
# Numeric extraction (vitals, duration)
# -----------------------------
TEMP_C_RE = re.compile(r"(?P<val>\d+(?:\.\d+)?)\s*°?\s*c\b", re.I)
TEMP_F_RE = re.compile(r"(?P<val>\d+(?:\.\d+)?)\s*°?\s*f\b", re.I)
SPO2_RE   = re.compile(r"(spo2|oxygen\s*(saturation|sat)).{0,8}?(?P<val>\d{2,3})\s*%?", re.I)
HR_RE     = re.compile(r"\b(hr|heart\s*rate|pulse)\b.{0,6}?(?P<val>\d{2,3})\b", re.I)
BP_RE     = re.compile(r"\b(bp|blood\s*pressure)\b.*?(?P<sys>\d{2,3})\s*/\s*(?P<dia>\d{2,3})", re.I)
GLUCOSE_RE= re.compile(r"\b(glucose|sugar|blood sugar)\b.*?(?P<val>\d{2,4})\b", re.I)
DAYS_RE   = re.compile(r"(?P<val>\d+)\s*(days?|d)\b", re.I)

def _extract_temp(text: str) -> Dict[str, float]:
    out: Dict[str, float] = {}
    m = TEMP_C_RE.search(text)
    if m: out["C"] = float(m.group("val"))
    m = TEMP_F_RE.search(text)
    if m: out["F"] = float(m.group("val"))
    return out

def _extract_spo2(text: str) -> Optional[float]:
    m = SPO2_RE.search(text)
    return float(m.group("val")) if m else None

def _extract_hr(text: str) -> Optional[float]:
    m = HR_RE.search(text)
    return float(m.group("val")) if m else None

def _extract_bp(text: str) -> Tuple[Optional[int], Optional[int]]:
    m = BP_RE.search(text)
    if not m: return None, None
    return int(m.group("sys")), int(m.group("dia"))

def _extract_glucose(text: str) -> Optional[int]:
    m = GLUCOSE_RE.search(text)
    return int(m.group("val")) if m else None

def _duration_days_gt_3(text: str) -> bool:
    for m in DAYS_RE.finditer(text):
        try:
            if int(m.group("val")) > 3:
                return True
        except Exception:
            pass
    phr = text
    return ("fever > 3 days" in phr) or ("more than 3 days" in phr) or ("over 3 days" in phr)

# -----------------------------
# Symptom-specific overrides (extensible)
# Each entry: { "term": regex, "doctor": [patterns], "emergency": [patterns], "default": "self-care" }
# -----------------------------
SYMPTOM_OVERRIDES: List[Dict[str, Any]] = [
    {
        "name": "headache",
        "term": re.compile(r"\bheadaches?\b", re.I),
        "emergency": [r"\b(sudden|thunderclap)\s+headache\b",
                      r"\bworst headache of (my|your) life\b",
                      r"\b(stroke|face droop|arm weakness|speech (trouble|difficulty)|seizure|stiff neck with fever)\b"],
        "doctor": [r"\bpersistent headache\b",
                   r"\bheadache (for|x)\s*\d+\s*(days?|d)\b",
                   r"\bheadache with (fever|vomiting|vision changes?)\b",
                   r"\bheadache (in|during)\s+pregnan(cy|t)\b",
                   r"\bpost[- ](head )?(injury|trauma)\b",
                   r"\bworse in the morning\b"],
        "default": "self-care"
    },
    {
        "name": "cough",
        "term": re.compile(r"\bcough(ing)?\b", re.I),
        "emergency": [r"\bcough(ing)?\s+blood\b",
                      r"\b(shortness of breath|difficulty breathing|blue lips?)\b"],
        "doctor": [r"\bpersistent cough\b",
                   r"\bcough\b.*\b\d+\s*(days?|d)\b",
                   r"\bproductive cough\b",
                   r"\bwheez(e|ing)\b",
                   r"\bchest tightness\b",
                   r"\bfever\b.*\b(>|\b(?:greater|over))\s*3\s*days\b"],
        "default": "self-care"
    },
    {
        "name": "sore throat",
        "term": re.compile(r"\b(sore throat|throat pain|throat ache)\b", re.I),
        "emergency": [r"\b(throat closing|trouble breathing|drooling|can'?t swallow)\b"],
        "doctor": [r"\bfever\b.*\b(>|\b(?:greater|over))\s*3\s*days\b",
                   r"\bwhite patches\b",
                   r"\bpersistent severe pain\b",
                   r"\bear pain\b"],
        "default": "self-care"
    },
    {
        "name": "runny nose",
        "term": re.compile(r"\b(runny nose|nasal congestion|stuffy nose|sneez(ing|e))\b", re.I),
        "emergency": [],
        "doctor": [r"\bfever\b.*\b(>|\b(?:greater|over))\s*3\s*days\b",
                   r"\bsevere facial pain\b",
                   r"\bsinus\b.*\bpain\b"],
        "default": "self-care"
    },
    {
        "name": "nausea/vomiting",
        "term": re.compile(r"\b(nausea|vomit(ing)?)\b", re.I),
        "emergency": [r"\b(vomiting|throwing up)\s+(blood|coffee[- ]grounds?)\b",
                      r"\buncontrolled vomiting\b",
                      r"\bsigns of shock\b",
                      r"\b(severe|tearing)\s+abdominal pain\b"],
        "doctor": [r"\bpersistent vomiting\b",
                   r"\bvomiting\b.*\b\d+\s*(days?|d)\b",
                   r"\bdehydration|very dry mouth|no urine|dark urine\b"],
        "default": "self-care"
    },
    {
        "name": "diarrhea",
        "term": re.compile(r"\bdiarrh(oe|e)a\b", re.I),
        "emergency": [r"\bbloody stools?\b", r"\b(black|tarry)\s+stools?\b", r"\bsigns of shock\b"],
        "doctor": [r"\bpersistent diarrhea\b",
                   r"\bdiarrh(oe|e)a\b.*\b\d+\s*(days?|d)\b",
                   r"\bdehydration|very dry mouth|no urine|dark urine\b",
                   r"\bback pain with fever\b"],
        "default": "self-care"
    },
    {
        "name": "abdominal pain",
        "term": re.compile(r"\babdominal pain|stomach ache|stomach pain\b", re.I),
        "emergency": [r"\b(severe|tearing)\s+abdominal pain\b", r"\b(rigid|board[- ]like)\s+abdomen\b"],
        "doctor": [r"\bpain (worse|worsening)\b", r"\bpain with fever\b", r"\bpersistent pain\b"],
        "default": "self-care"
    },
    {
        "name": "back pain",
        "term": re.compile(r"\bback pain\b", re.I),
        "emergency": [r"\b(saddle anesthesia|loss of bowel|loss of bladder|urinary retention)\b",
                      r"\bsevere weakness\b"],
        "doctor": [r"\bpersistent back pain\b", r"\bback pain with fever\b", r"\bradiating to leg\b"],
        "default": "self-care"
    },
    {
        "name": "dizziness",
        "term": re.compile(r"\bdizz(y|iness)|lightheaded(ness)?\b", re.I),
        "emergency": [r"\b(stroke|face droop|arm weakness|speech trouble)\b",
                      r"\bchest pain\b",
                      r"\bunconscious|faint(ing)?\b"],
        "doctor": [r"\bpersistent dizziness\b", r"\bworsening\b", r"\bwith headache\b"],
        "default": "self-care"
    },
    {
        "name": "rash",
        "term": re.compile(r"\brash\b", re.I),
        "emergency": [r"\b(swelling of (face|lips|tongue)|throat closing)\b",
                      r"\brash\b.*\bwith\b.*\bbreathing\b",
                      r"\b(stiff neck with fever)\b"],
        "doctor": [r"\bpainful\b", r"\bspreading\b", r"\bwith fever\b", r"\bblistering\b", r"\binfected\b"],
        "default": "self-care"
    },
    {
        "name": "urinary symptoms",
        "term": re.compile(r"\b(pain with urination|burning urination|dysuria|frequent urination)\b", re.I),
        "emergency": [r"\bconfusion\b"],
        "doctor": [r"\bback pain with fever\b", r"\bpregnan(t|cy)\b", r"\bpersistent\b"],
        "default": "doctor"  # UTIs usually need doctor eval
    },
    {
        "name": "toothache",
        "term": re.compile(r"\btooth ache|toothache|dental pain\b", re.I),
        "emergency": [r"\bswelling\b.*\bbreathing\b"],
        "doctor": [r"\bpersistent\b", r"\bfever\b", r"\bswelling\b"],
        "default": "doctor"
    },
]

# -----------------------------
# Symptom override engine
# -----------------------------
def _apply_symptom_overrides(text: str) -> Optional[str]:
    """
    If a known symptom term is present, apply symptom-specific rules:
    - Emergency patterns within that symptom -> 'emergency'
    - Else Doctor patterns -> 'doctor'
    - Else symptom default (usually 'self-care' unless set otherwise)
    Returns None if no symptom match or if general gating should decide.
    """
    for rule in SYMPTOM_OVERRIDES:
        if not rule["term"].search(text):
            continue
        # Emergency within symptom?
        if any(_find_unnegated(p, text) for p in rule.get("emergency", [])):
            return "emergency"
        # Doctor within symptom?
        if any(_find_unnegated(p, text) for p in rule.get("doctor", [])):
            return "doctor"
        return rule.get("default", "self-care")
    return None

# -----------------------------
# Flag logic (global)
# -----------------------------
def _has_emergency(text: str) -> bool:
    # numeric thresholds
    temps = _extract_temp(text); c, f = temps.get("C"), temps.get("F")
    if (c is not None and c >= 40.0) or (f is not None and f >= 104.0):
        return True

    spo2 = _extract_spo2(text)
    if spo2 is not None and spo2 < 90:
        return True

    hr = _extract_hr(text)
    if hr is not None and hr >= 130:
        return True

    sys, dia = _extract_bp(text)
    if (sys is not None and sys < 90) or (dia is not None and dia < 60):  # hypotension/shock
        return True
    if (sys is not None and sys >= 180) or (dia is not None and dia >= 120):
        return True

    glu = _extract_glucose(text)
    if glu is not None and (glu >= 400 or glu <= 55):
        return True

    # pattern-based red flags (negation-aware)
    return _contains_any_unnegated(EMERGENCY_PATTERNS, text)

def _has_moderate(text: str) -> bool:
    temps = _extract_temp(text); c, f = temps.get("C"), temps.get("F")
    if (c is not None and c >= 38.5) or (f is not None and f >= 101.5):
        return True

    spo2 = _extract_spo2(text)
    if spo2 is not None and 90 <= spo2 <= 93:
        return True

    hr = _extract_hr(text)
    if hr is not None and 110 <= hr < 130:
        return True

    sys, dia = _extract_bp(text)
    if (sys is not None and 160 <= sys < 180) or (dia is not None and 100 <= dia < 120):
        return True

    glu = _extract_glucose(text)
    if glu is not None and (300 <= glu < 400 or 56 <= glu <= 70):
        return True

    if _duration_days_gt_3(text):
        return True

    return _contains_any_unnegated(MODERATE_PATTERNS, text)

def _decide_triage(symptoms_text: str) -> str:
    """
    Authoritative gating (ignore model's own triage):
      - Emergency if severe red flags / thresholds
      - Symptom-specific overrides (e.g., 'headache' alone -> self-care)
      - Doctor if any moderate flags
      - Else Self-care (covers vague/mild inputs like "mild fever")
    """
    text = (symptoms_text or "").lower()
    # normalize some variants
    text = text.replace("3+ days", "more than 3 days").replace(">3d", "4d").replace("> 3 days", "more than 3 days")

    if _has_emergency(text):
        return "emergency"

    # Apply symptom-specific overrides BEFORE general moderate checks
    ov = _apply_symptom_overrides(text)
    if ov is not None:
        return ov

    if _has_moderate(text):
        return "doctor"

    # Prefer self-care when vague/mild and no flags
    return "self-care"

# -----------------------------
# Post-process model JSON safely
# -----------------------------
def _clamp_confidence(val: Any) -> float:
    try:
        f = float(val)
    except Exception:
        return 0.0
    f = max(0.0, min(1.0, f))
    return round(f, 2)

def _extract_json(text: str) -> str:
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL | re.IGNORECASE)
    if fence:
        return fence.group(1).strip()
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text.strip()

def _postprocess(payload: Dict[str, Any], symptoms_text: str = "") -> Dict[str, Any]:
    conditions = payload.get("conditions", [])
    if not isinstance(conditions, list):
        conditions = []

    normalized: List[Dict[str, Any]] = []
    for c in conditions[:3]:
        if not isinstance(c, dict):
            continue
        name = (str(c.get("name", "")) or "Unknown").strip()
        desc = (str(c.get("description", "")) or "No description available.").strip()
        when = (str(c.get("whenToSeekCare", "")) or "If symptoms worsen or persist.").strip()
        actions = c.get("recommendedActions", [])
        if not isinstance(actions, list):
            actions = []
        actions = [str(a).strip() for a in actions if str(a).strip()][:6]
        conf = _clamp_confidence(c.get("confidence", 0.0))
        normalized.append({
            "name": name, "confidence": conf, "description": desc,
            "recommendedActions": actions, "whenToSeekCare": when
        })

    if not normalized:
        normalized = [{
            "name": "Non-specific viral illness",
            "confidence": 0.30,
            "description": "A mild viral infection may cause short-term fever, sore throat, and fatigue.",
            "recommendedActions": ["Rest", "Hydrate", "Use over-the-counter pain relief as directed"],
            "whenToSeekCare": "If symptoms persist beyond 3 days, or severe symptoms develop."
        }]

    triage = _decide_triage(symptoms_text)
    return {
        "conditions": normalized,
        "triageLevel": triage,
        "disclaimer": "This tool provides educational insights only. Consult a healthcare professional for medical advice."
    }

# -----------------------------
# Core inference
# -----------------------------
def infer_conditions_from_symptoms(symptoms_text: str) -> Dict[str, Any]:
    model = genai.GenerativeModel(GEMINI_MODEL)

    # Strict JSON-only output
    generation_config = genai.types.GenerationConfig(
        temperature=0.1,
        response_mime_type="application/json"
    )

    prompt = f"""{SYSTEM_INSTRUCTIONS}

User symptoms (JSON):
{{
  "symptoms": "{symptoms_text.strip()}"
}}

Example format (not binding to content):
{json.dumps(SCHEMA_EXAMPLE, ensure_ascii=False, indent=2)}
"""

    resp = model.generate_content(prompt, generation_config=generation_config)
    raw_text = (getattr(resp, "text", "") or "").strip()

    try:
        parsed = json.loads(_extract_json(raw_text))
    except Exception:
        parsed = {"conditions": [], "triageLevel": "self-care", "disclaimer": SCHEMA_EXAMPLE["disclaimer"]}

    return _postprocess(parsed, symptoms_text)

# -----------------------------
# Simple connection test
# -----------------------------
def test_gemini_connection():
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content("Hello")
        print("✅ Connected successfully to Google Gemini!")
        print("🔹 Gemini Response:", (getattr(response, "text", "") or "").strip())
    except Exception as e:
        print("❌ Failed to connect to Gemini API:", e)

# -----------------------------
# Script entry (quick sanity suite)
# -----------------------------
if __name__ == "__main__":
    test_gemini_connection()

    tests = [
        # Vague / should be self-care:
        "headache",
        "mild fever",
        "cough",
        "sore throat",
        "runny nose",
        "nausea",
        "diarrhea",
        "back pain",
        "abdominal pain",
        "dizzy",
        "rash",
        "toothache",
        # Doctor:
        "fever for 4 days",
        "temperature 38.8 C and worsening symptoms",
        "oxygen saturation 92%",
        "heart rate 120",
        "blood pressure 165/105",
        "blood sugar 320",
        "persistent cough with wheezing",
        "sore throat with ear pain and fever for 4 days",
        "diarrhea for 4 days with dehydration",
        "headache with vomiting",
        "back pain with fever",
        "pain with urination",
        # Emergency:
        "severe chest pain radiating to left arm and jaw",
        "shortness of breath and blue lips",
        "unconscious, not waking up",
        "possible overdose, breathing slow",
        "pregnancy with heavy bleeding and severe abdominal pain",
        "vomiting blood and black tarry stool",
        "temperature 40.2 C",
        "oxygen saturation 88%",
        "heart rate 140",
        "blood pressure 85/55",
        "blood sugar 45",
        "sudden loss of vision in one eye",
        "sudden thunderclap headache, worst headache of my life",
    ]
    for t in tests:
        print("\n---")
        print("INPUT:", t)
        print(json.dumps(infer_conditions_from_symptoms(t), ensure_ascii=False, indent=2))

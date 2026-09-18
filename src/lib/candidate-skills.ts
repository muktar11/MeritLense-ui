// Fixed, translatable skill vocabulary per candidate job role (JOB_ROLES in
// api/candidates/types.ts) - replaces the previous free-text "core_skills"
// field, which couldn't be translated (raw, whatever-was-typed values like
// "Maiores sint quos ve" or "787878") and produced inconsistent data.
//
// Each code is a stable English key stored as-is in Candidate.core_skills
// (a plain comma-separated CharField on the backend - no backend change
// needed), and translated for display via
// shared.candidateSkills.<code> in messages/{en,ar}/common.json. A
// candidate whose skills predate this change (free text, not one of these
// codes) still displays - see translateSkill() - just untranslated, same
// fallback pattern as ROLE_NAME_AR for an unmapped role.
export const CANDIDATE_SKILLS_BY_ROLE: Record<string, string[]> = {
  NA: [
    "child_supervision",
    "meal_preparation",
    "homework_help",
    "bathing_dressing",
    "storytelling",
    "first_aid",
    "safe_sleep_practices",
    "activity_planning",
    "positive_discipline",
    "school_pickup_dropoff",
  ],
  DR: [
    "safe_driving",
    "route_planning",
    "vehicle_maintenance",
    "defensive_driving",
    "gps_navigation",
    "passenger_assistance",
    "luggage_handling",
    "traffic_law_knowledge",
    "night_driving",
    "child_car_seat_safety",
  ],
  HK: [
    "deep_cleaning",
    "laundry_ironing",
    "home_organizing",
    "kitchen_sanitation",
    "dusting_polishing",
    "floor_care",
    "bathroom_cleaning",
    "waste_management",
    "inventory_management",
    "eco_friendly_cleaning",
  ],
  EC: [
    "mobility_assistance",
    "medication_reminders",
    "companionship",
    "meal_preparation",
    "light_housekeeping",
    "appointment_scheduling",
    "fall_prevention",
    "emotional_support",
    "mobility_aid_use",
    "vital_signs_monitoring",
  ],
  KA: [
    "food_preparation",
    "food_safety",
    "kitchen_sanitation",
    "inventory_management",
    "menu_planning",
    "dietary_restrictions",
    "knife_skills",
    "dishwashing",
    "portion_control",
    "waste_management",
  ],
  MW: [
    "plumbing_repair",
    "electrical_basics",
    "painting",
    "carpentry",
    "appliance_repair",
    "hvac_basics",
    "landscaping",
    "pest_control",
    "safety_inspection",
    "tool_maintenance",
  ],
  OT: [
    "reliability",
    "communication",
    "teamwork",
    "problem_solving",
    "time_management",
    "adaptability",
    "attention_to_detail",
    "customer_service",
  ],
};

// t is the "shared.candidateSkills" translator (has()/call() from next-intl).
// Falls back to the raw stored value for anything not in the fixed
// vocabulary - either a legacy free-text skill from before this change, or
// (defensively) a code with no translation entry yet.
export function translateSkill(code: string, t: { has: (key: string) => boolean; (key: string): string }): string {
  return t.has(code) ? t(code) : code;
}

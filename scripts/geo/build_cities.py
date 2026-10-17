"""Build public/geo/cities/{CC}.json from GeoNames cities15000.txt.

Each file: [{"en": "Dubai", "ar": "دبي"}, ...], largest population first,
at most MAX_PER_COUNTRY cities. GeoNames data (https://www.geonames.org/)
is CC BY 4.0. The Arabic name is the first alternate name written in
Arabic script, preferring ones without Persian/Urdu-only letters.

Usage: python build_cities.py <cities15000.txt> <out_dir> <country codes JSON>
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

MAX_PER_COUNTRY = 300
ARABIC = re.compile(r"^[؀-ۿ\s\-'ʼ]+$")
NON_ARABIC_LETTERS = re.compile(r"[پچژگکیےٹڈڑںہھ]")


# Main GCC cities, checked by hand (the platform's primary market).
OVERRIDES = {
    "AE": {"Dubai": "دبي", "Abu Dhabi": "أبوظبي", "Sharjah": "الشارقة", "Al Ain City": "العين", "Ajman": "عجمان",
           "Ras Al Khaimah": "رأس الخيمة", "Fujairah": "الفجيرة", "Umm Al Quwain City": "أم القيوين", "Khor Fakkan": "خورفكان"},
    "SA": {"Jeddah": "جدة", "Riyadh": "الرياض", "Makkah": "مكة المكرمة", "Madinah": "المدينة المنورة", "Dammam": "الدمام",
           "Khobar": "الخبر", "Taif": "الطائف", "Tabuk": "تبوك", "Abha": "أبها", "Buraydah": "بريدة"},
    "QA": {"Doha": "الدوحة", "Al Rayyan": "الريان", "Al Wakrah": "الوكرة"},
    "KW": {"Kuwait City": "مدينة الكويت", "Al Ahmadi": "الأحمدي", "Hawalli": "حولي"},
    "BH": {"Manama": "المنامة", "Riffa": "الرفاع", "Muharraq": "المحرق"},
    "OM": {"Muscat": "مسقط", "Seeb": "السيب", "Salalah": "صلالة", "Sohar": "صحار", "Nizwa": "نزوى"},
}


def clean_arabic(name):
    # GeoNames often writes ي as ى inside words (Persian style): keep ى
    # only at the end of a word, where Arabic uses it.
    return re.sub(r"ى(?=[؀-ۿ])", "ي", name)


def arabic_name(alternates):
    candidates = [a.strip() for a in alternates.split(",") if a.strip() and ARABIC.match(a.strip())]
    for name in candidates:
        if not NON_ARABIC_LETTERS.search(name):
            return clean_arabic(name)
    return None


def main(src, out_dir, codes_path):
    codes = set(json.loads(Path(codes_path).read_text(encoding="utf-8")))
    by_country = defaultdict(list)
    with open(src, encoding="utf-8") as fh:
        for line in fh:
            cols = line.rstrip("\n").split("\t")
            if len(cols) < 15:
                continue
            name, alternates, cc, population = cols[1], cols[3], cols[8], int(cols[14] or 0)
            if cc not in codes:
                continue
            by_country[cc].append((population, name, arabic_name(alternates)))
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    total = 0
    for cc, rows in by_country.items():
        rows.sort(key=lambda r: -r[0])
        seen, cities = set(), []
        overrides = OVERRIDES.get(cc, {})
        for _, en, ar in rows:
            ar = overrides.get(en, ar)
            if en.lower() in seen:
                continue
            seen.add(en.lower())
            cities.append({"en": en, **({"ar": ar} if ar else {})})
            if len(cities) >= MAX_PER_COUNTRY:
                break
        (out / f"{cc}.json").write_text(json.dumps(cities, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        total += len(cities)
    print(f"{len(by_country)} countries, {total} cities, missing: {sorted(codes - set(by_country))}")


if __name__ == "__main__":
    main(*sys.argv[1:4])
